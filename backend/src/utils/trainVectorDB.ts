import { QdrantClient } from "@qdrant/js-client-rest";
import { pipeline } from "@xenova/transformers";

function meanPool(output: any): number[] {
  const data = output?.data ?? output;
  const vectorSize = 384;
  const tokenCount = Math.floor(data.length / vectorSize);
  const result = new Array(vectorSize).fill(0);
  for (let t = 0; t < tokenCount; t++) {
    for (let j = 0; j < vectorSize; j++) {
      result[j] += data[t * vectorSize + j];
    }
  }
  return result.map((v) => v / tokenCount);
}

export async function initQdrant() {
  const client = new QdrantClient({ url: "http://localhost:6333" });
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  await client.recreateCollection("knowledge", {
    vectors: { size: 384, distance: "Cosine" },
  });

  const texts = [
    "ReachInbox automates cold outreach and engagement.",
    "If a lead is interested, share https://cal.com/example",
    "Reply concisely and professionally.",
  ];

  for (let i = 0; i < texts.length; i++) {
    const vec = meanPool(await embedder(texts[i]));
    await client.upsert("knowledge", {
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
}
