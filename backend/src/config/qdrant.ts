import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

export const qdrant = new QdrantClient(
  isProd
    ? {
        url: process.env.QDRANT_URL!,
        apiKey: process.env.QDRANT_API_KEY!,
      }
    : {
        url: process.env.LOCAL_QDRANT_URL || "http://localhost:6333",
      }
);
