import express from "express";
import dotenv from "dotenv";
import emailRoutes from "./routes/emailRoutes";
import { setupElasticIndex } from "./utils/setupElastic";
import cors from "cors";
import { startIMAPSync } from "./services/aiServices/emailSyncService";
import { initQdrant } from "./utils/trainVectorDB";
import aiRoutes from "./routes/aiRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/emails", emailRoutes);
app.use("/api/ai", aiRoutes);

async function startServer() {
  await setupElasticIndex();

  // vector DB training
  initQdrant();

  app.listen(process.env.PORT || 3000, () => {
    console.log(
      `Server running at ${
        process.env.BACKEND_URL ||
        `http://localhost:${process.env.PORT || 3000}`
      }`
    );
    // persistent IMAP sync
    startIMAPSync();
  });
}

startServer();
