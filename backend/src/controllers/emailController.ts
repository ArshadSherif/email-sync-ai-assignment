import client from "../config/elasticsearch";
import { Request, Response } from "express";

import {
  categorizeEmail,
  categorizeEmailsBatch,
} from "../services/aiServices/aiCategorizer";
import { EmailDoc } from "../types/email";

export const searchEmails = async (req: Request, res: Response) => {
  const { q, folder, account } = req.query;
  try {
    const must: any[] = [];

    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ["subject", "body", "from", "to"],
          fuzziness: "AUTO",
        },
      });
    }

    if (folder) {
      must.push({ term: { folder } });
    }

    if (account) {
      must.push({ term: { account } });
    }

    const result = await client.search({
      index: "emails",
      query: must.length ? ({ bool: { must } } as any) : { match_all: {} },
      size: 50,
    });

    res.json(result.hits.hits);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error searching emails" });
  }
};

export const categorize = async (req: Request, res: Response) => {
  const { id, text } = req.body;
  try {
    const category = await categorizeEmail(id, text);
    res.json({ category });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error categorizing email" });
  }
};

export const getEmails = async (req: Request, res: Response) => {
  const { page = 1, size = 50, folder, accountId } = req.query;
  const from = (Number(page) - 1) * Number(size);

  try {
    // Build dynamic filters for Elasticsearch
    const must: any[] = [];
    if (folder && folder !== "All") {
      must.push({ term: { folder: String(folder).toLowerCase() } });
    }
    if (accountId && accountId !== "All") {
      must.push({ term: { accountId: String(accountId).toLowerCase() } });
    }

    // Fetch paginated + filtered emails
    const result = await client.search({
      index: "emails",
      from,
      size: Number(size),
      sort: [{ date: { order: "desc" } }],
      query: must.length ? { bool: { must } } : { match_all: {} },
    });

    const emails: EmailDoc[] = result.hits.hits.map((hit) => ({
      id: hit._id as string,
      ...(hit._source as Record<string, any>),
    }));

    // Filter uncategorized emails (only from this filtered batch)
    const uncategorized = emails.filter(
      (e) => !e.category && e.text && e.text.trim().length > 0
    );

    //  Batch categorize if needed
    if (uncategorized.length > 0) {
      console.log(
        `Categorizing ${uncategorized.length} uncategorized emails...`
      );

      const results = await categorizeEmailsBatch(
        uncategorized.map((e) => ({ id: e.id, text: e.text! }))
      );

      //  Update categorized emails back into Elasticsearch
      for (const r of results) {
        if (!r.category || r.category === "Uncategorized") continue;

        await client.update({
          index: "emails",
          id: r.id,
          doc: { category: r.category },
          doc_as_upsert: true,
        });

        // Update the local batch for immediate return
        const email = emails.find((e) => e.id === r.id);
        if (email) email.category = r.category;
      }

      await client.indices.refresh({ index: "emails" });
    }

    // Return paginated + filtered response
    res.json({
      page: Number(page),
      size: Number(size),
      total: result.hits.total,
      data: emails,
    });
  } catch (error) {
    console.error("Error in getEmails:", error);
    res.status(500).json({ error: "Failed to fetch or categorize emails" });
  }
};

export const getEmailById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await client.get({ index: "emails", id });
    if (!result.found) {
      return res.status(404).json({ error: "Email not found" });
    }
    res.json(result._source);
  } catch (error) {
    console.error("Error fetching email by ID:", error);
    res.status(500).json({ error: "Error fetching email" });
  }
};
