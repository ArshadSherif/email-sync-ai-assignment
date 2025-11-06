import { QdrantClient } from "@qdrant/js-client-rest";
import { pipeline } from "@xenova/transformers";
import es from "../config/elasticsearch";
import { genAI } from "./aiServices/aiCategorizer";
import dotenv from "dotenv";

dotenv.config();

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });

let embedder: any = null;

// mean-pooling for Xenova embeddings
function meanPool(output: any): number[] {
  const data = output?.data ?? output;
  const vectorSize = 384;
  const tokenCount = Math.floor(data.length / vectorSize);
  if (tokenCount === 0) return [];
  const result = new Array(vectorSize).fill(0);
  for (let t = 0; t < tokenCount; t++) {
    for (let j = 0; j < vectorSize; j++) result[j] += data[t * vectorSize + j];
  }
  return result.map((v) => v / tokenCount);
}

// Fetch similar knowledge from Qdrant
export async function getRelevantContext(emailText: string): Promise<string[]> {
  if (!embedder)
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  const vector = meanPool(await embedder(emailText));
  const results = await qdrant.search("knowledge", {
    vector,
    limit: 5,
  });

  return results.map((r: any) => r.payload.text);
}

export async function handleAIReply(id: string, text: string) {
  const context = await getRelevantContext(text);

  const prompt = `
Email:
${text}

Context:
${context.join("\n")}

Instruction:
Write a short, polite, and professional reply using the context above.
Include the meeting links if relevant.
  `;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  const result = await model.generateContent(prompt);
  const reply = result.response.text().trim();

  const existing = await es.get({ index: "emails", id }).catch(() => null);
  const existingSource = existing?._source || {};

  await es.update({
    index: "emails",
    id,
    doc: {
      ...existingSource,
      ai_reply: {
        text: reply,
        generated_at: new Date().toISOString(),
      },
    },
    doc_as_upsert: true,
  });

  return reply;
}
