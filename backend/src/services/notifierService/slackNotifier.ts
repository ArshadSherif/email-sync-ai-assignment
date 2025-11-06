import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function slackNotifier(email: any) {
  try {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) return;

    const payload = {
      text: `*New Interested Email Received*\n*Subject:* ${
        email.subject
      }\n*From:* ${email.from}\n*To:* ${email.to}\n*Date:* ${
        email.date
      }\n*Snippet:* ${email.text.substring(0, 100)}...`,
    };

    await axios.post(webhook, payload);
  } catch (error) {
    console.error("Error sending Slack notification:", error);
  }
}
