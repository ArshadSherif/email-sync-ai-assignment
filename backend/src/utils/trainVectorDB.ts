import { qdrant } from "../config/qdrant";
import { pipeline } from "@xenova/transformers";

const VECTOR_SIZE = 384;

function meanPool(output: any): number[] {
  const data = output?.data ?? output;
  const tokenCount = Math.floor(data.length / VECTOR_SIZE);
  const result = new Array(VECTOR_SIZE).fill(0);
  for (let t = 0; t < tokenCount; t++) {
    for (let j = 0; j < VECTOR_SIZE; j++) {
      result[j] += data[t * VECTOR_SIZE + j];
    }
  }
  return result.map((v) => v / Math.max(tokenCount, 1));
}

export async function initQdrant() {
  try {
    // check if collection exists
    await qdrant.getCollection("knowledge");
    console.log("Collection 'knowledge' already exists.");
  } catch {
    console.log("Creating collection 'knowledge'...");
    await qdrant.createCollection("knowledge", {
      vectors: { size: VECTOR_SIZE, distance: "Cosine" },
    });
  }

  // check if collection is empty
  const existing = await qdrant.scroll("knowledge", { limit: 1 });
  if (existing.points && existing.points.length > 0) {
    console.log("'knowledge' already has data, skipping initialization.");
    return;
  }

  console.log("Seeding 'knowledge' collection...");
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  const texts = [
    "ReachInbox automates cold outreach and engagement.",
    "If a lead is interested, share https://cal.com/example",
    "Reply concisely and professionally.",
  ];

  for (let i = 0; i < texts.length; i++) {
    const vec = meanPool(await embedder(texts[i]));
    await qdrant.upsert("knowledge", {
      wait: true,
      points: [
        {
          id: i + 1,
          vector: vec,
          payload: { text: texts[i] },
        },
      ],
    });
    console.log(`Inserted ${i + 1}`);
  }

  console.log("Qdrant initialization complete.");
}
