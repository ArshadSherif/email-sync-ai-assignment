import client from "../config/elasticsearch";

export async function setupElasticIndex() {
  try {
    const exists = await client.indices.exists({ index: "emails" });

    if (!exists) {
      console.log("Creating 'emails' index...");
      await client.indices.create({
        index: "emails",
        body: {
          mappings: {
            properties: {
              subject: { type: "text" },
              from: { type: "keyword" },
              to: { type: "keyword" },
              date: { type: "date" },
              text: { type: "text" },
              html: { type: "text" },
              folder: { type: "keyword" },
              accountId: { type: "keyword" },
              category: { type: "keyword" },
              messageId: { type: "keyword" },
              ai_reply: {
                properties: {
                  text: { type: "text" },
                  generated_at: { type: "date" },
                },
              },
            },
          },
        },
      });
      console.log("'emails' index created successfully.");
    } else {
      console.log("'emails' index already exists.");
    }
  } catch (err) {
    console.error("Error setting up Elasticsearch index:", err);
    throw err;
  }
}
