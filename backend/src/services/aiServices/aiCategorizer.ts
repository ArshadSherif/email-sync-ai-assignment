import { GoogleGenerativeAI } from "@google/generative-ai";
import client from "../../config/elasticsearch";
import { prepareEmailContent } from "../../utils/prepareEmailContext";
import dotenv from "dotenv";

dotenv.config();

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function categorizeEmail(id: string, text: string) {
  const cleanedEmail = prepareEmailContent(text);
  console.table({
    Raw: text,
    Cleaned: cleanedEmail,
  });
  const prompt = `
    Classify this email into one of these categories:
Interested, Meeting Booked, Not Interested, Spam, Out of Office.
Respond with only the category name.

Email:
${cleanedEmail}
    `;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  const result = await model.generateContent(prompt);
  const label = result.response.text().trim();

  const existing = await client.get({ index: "emails", id }).catch(() => null);
  const existingSource = existing?._source || {};

  await client.update({
    index: "emails",
    id,
    doc: {
      ...existingSource,
      category: label,
    },
    doc_as_upsert: true,
  });

  return label;
}

export async function categorizeEmailsBatch(
  emails: { id: string; text: string }[]
) {
  const prompt = `
Classify each email into one of:
Interested, Meeting Booked, Not Interested, Spam, Out of Office.

Respond ONLY as valid JSON array like:
[{"id":"<id>","category":"<category>"}]

Emails:
${emails.map((e) => `ID:${e.id}\n${prepareEmailContent(e.text)}`).join("\n\n")}
`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(text);
    console.log(`Batch categorized ${parsed.length} emails`);
    return parsed;
  } catch (e) {
    console.error("Failed to parse model output:", text);
    return [];
  }
}
