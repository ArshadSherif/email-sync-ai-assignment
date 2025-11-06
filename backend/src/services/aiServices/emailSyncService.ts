import { ImapFlow } from "imapflow";
import { imapAccounts } from "../../config/imap";
import { simpleParser } from "mailparser";
import client from "../../config/elasticsearch";
import { slackNotifier } from "../notifierService/slackNotifier";
import { webhookTrigger } from "../notifierService/webhookTrgger";
import { categorizeEmail } from "./aiCategorizer";

const MAX_INITIAL_FETCH = 100; // safe for Render

export async function startIMAPSync() {
  console.log(`[${new Date().toISOString()}] Starting IMAP synchronization...`);

  for (const account of imapAccounts) {
    if (!account.user || !account.password || !account.host) {
      console.log(
        `[${new Date().toISOString()}] Skipping invalid IMAP account configuration`
      );
      continue;
    }

    const imap = new ImapFlow({
      host: account.host,
      port: account.port,
      secure: account.secure,
      auth: { user: account.user, pass: account.password },
    });

    (async () => {
      try {
        await imap.connect();
        console.log(`[${account.user}] Connected to IMAP`);
        await imap.mailboxOpen("INBOX");

        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let fetched = 0;

        console.log(
          `[${account.user}] Fetching up to ${MAX_INITIAL_FETCH} recent messages from last 30 days...`
        );

        for await (const msg of imap.fetch(
          { since },
          { envelope: true, source: true, internalDate: true }
        )) {
          if (fetched >= MAX_INITIAL_FETCH) break;
          await indexMessage(msg, account.user, { categorize: false });
          fetched++;
        }

        console.log(
          `[${account.user}] Initial sync complete (${fetched} messages indexed)`
        );

        imap.on("exists", async () => {
          try {
            const seq =
              imap.mailbox && typeof imap.mailbox === "object"
                ? imap.mailbox.exists
                : null;
            if (!seq) return;

            console.log(`[${account.user}] New mail detected (seq=${seq})`);
            const msg = await imap.fetchOne(String(seq), {
              source: true,
              envelope: true,
              internalDate: true,
            });

            if (msg)
              await indexMessage(msg, account.user, { categorize: true });
          } catch (err) {
            console.log(`[${account.user}] Error handling new mail:`, err);
          }
        });

        imap.on("close", () => {
          console.log(`[${account.user}] IMAP connection closed`);
        });

        console.log(`[${account.user}] Entering IDLE mode for live updates`);

        while (imap.usable) {
          try {
            await imap.idle();
          } catch (err) {
            console.log(`[${account.user}] IDLE error:`, err);
            if (!imap.usable) break;
          }
        }
      } catch (err) {
        console.log(`[${account.user}] IMAP error:`, err);
      }
    })().catch(console.error);
  }

  console.log(
    `[${new Date().toISOString()}] IMAP sync initialized for all accounts`
  );
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

      console.log(
        `[${accountId}] Indexed: ${parsed.subject || "(no subject)"}`
      );

      if (opts.categorize) {
        categorizeAndNotify(response._id, document).catch(console.error);
      }
    }
  } catch (error) {
    console.log(`[${accountId}] Error indexing message:`, error);
  }
}

async function categorizeAndNotify(id: string, email: any) {
  try {
    console.log(`[${email.accountId}] Categorizing: ${email.subject}`);
    const label = await categorizeEmail(id, email.text);
    console.log(`[${email.accountId}] Category: ${label}`);

    if (!label || label === "Uncategorized") return;

    await client.update({
      index: "emails",
      id,
      doc: { category: label },
      doc_as_upsert: true,
    });

    if (label === "Interested") {
      console.log(`[${email.accountId}] Triggering Slack + Webhook`);
      await Promise.allSettled([slackNotifier(email), webhookTrigger(email)]);
    }

    console.log(`[${email.accountId}] Categorized as ${label}`);
  } catch (error) {
    console.log(`[${email.accountId}] Error categorizing message:`, error);
  }
}
