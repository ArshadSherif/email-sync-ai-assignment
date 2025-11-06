import { ImapFlow } from "imapflow";
import { imapAccounts } from "../../config/imap";
import { simpleParser } from "mailparser";
import client from "../../config/elasticsearch";

import { slackNotifier } from "../notifierService/slackNotifier";
import { webhookTrigger } from "../notifierService/webhookTrgger";
import { categorizeEmail } from "./aiCategorizer";

export async function startIMAPSync() {
  for (const account of imapAccounts) {
    if (!account.user || !account.password || !account.host) {
      console.error("Skipping invalid IMAP account config:", account);
      continue;
    }

    const imap = new ImapFlow({
      host: account.host,
      port: account.port,
      secure: account.secure,
      auth: { user: account.user, pass: account.password },
    });

    (async () => {
      await imap.connect();
      console.log(`Connected to ${account.user}`);
      await imap.mailboxOpen("INBOX");

      // 30-day historical fetch
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      for await (const msg of imap.fetch(
        { since },
        { envelope: true, source: true, internalDate: true }
      )) {
        await indexMessage(msg, account.user, { categorize: false });
      }

      // Real-time events
      console.log(`Entering persistent IDLE for ${account.user}`);

      imap.on("exists", async () => {
        try {
          const seq =
            imap.mailbox && typeof imap.mailbox === "object"
              ? imap.mailbox.exists
              : null;
          if (!seq) return;
          console.log(`New mail event for ${account.user}, seq=${seq}`);

          const msg = await imap.fetchOne(String(seq), {
            source: true,
            envelope: true,
            internalDate: true,
          });
          if (msg) await indexMessage(msg, account.user, { categorize: true });
        } catch (err) {
          console.error(`Error handling new mail for ${account.user}:`, err);
        }
      });

      imap.on("close", () =>
        console.log(`Connection closed for ${account.user}`)
      );

      // Continuous IDLE loop
      while (imap.usable) {
        try {
          await imap.idle();
        } catch (err) {
          console.error(`IDLE error for ${account.user}:`, err);
          if (!imap.usable) break;
        }
      }
    })().catch(console.error);
  }

  console.log("IMAP sync initialized for all accounts.");
}

async function indexMessage(
  msg: any,
  accountId: string,
  opts = { categorize: false }
) {
  try {
    const parsed = await simpleParser(msg.source);

    const exists = await client.search({
      index: "emails",
      query: { term: { messageId: parsed.messageId } },
    });

    const total =
      typeof exists.hits.total === "number"
        ? exists.hits.total
        : exists.hits.total?.value;

    if (total === 0) {
      const document = {
        messageId: parsed.messageId,
        subject: parsed.subject,
        from: parsed.from?.text,
        to: Array.isArray(parsed.to)
          ? parsed.to.map((addr) => addr.text).join(", ")
          : parsed.to?.text,
        date: parsed.date,
        text: parsed.text || "",
        html: parsed.html || "",
        folder: (msg.mailbox || "inbox").toLowerCase(),
        accountId: accountId.toLowerCase(),
      };

      const response = await client.index({
        index: "emails",
        document,
      });

      console.log(`Indexed email: ${parsed.subject}`);

      if (opts.categorize) {
        // Only categorize for new live messages
        categorizeAndNotify(response._id, document).catch(console.error);
      }
    }
  } catch (error) {
    console.error("Error parsing or indexing email:", error);
  }
}

async function categorizeAndNotify(id: string, email: any) {
  try {
    console.log(`Running categorizer for: ${email.subject}`);
    const label = await categorizeEmail(id, email.text);
    console.log(`AI returned label: ${label}`);

    if (!label || label === "Uncategorized") return;

    await client.update({
      index: "emails",
      id,
      doc: { category: label },
      doc_as_upsert: true,
    });

    if (label === "Interested") {
      console.log(`Triggering Slack + webhook for ${email.subject}`);
      await Promise.allSettled([slackNotifier(email), webhookTrigger(email)]);
    }

    console.log(`Categorized email (${label}): ${email.subject}`);
  } catch (error) {
    console.error("Error in categorizeAndNotify:", error);
  }
}
