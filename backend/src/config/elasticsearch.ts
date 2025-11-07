import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const client = new Client(
  isProd
    ? {
        node: process.env.ELASTIC_URL!,
        auth: { apiKey: process.env.ELASTIC_API_KEY! },
        tls: { rejectUnauthorized: false },
      }
    : {
        node: process.env.LOCAL_ELASTIC_URL || "http://localhost:9200",
      }
);

export default client;
