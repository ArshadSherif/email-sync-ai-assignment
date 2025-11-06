import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export async function webhookTrigger(email: any) {
  const url = process.env.WEBHOOK_URL;
  if (!url) return;

  await axios.post(url, {
    subject: email.subject,
    from: email.from,
    body: email.text,
    date: email.date,
  });
}
