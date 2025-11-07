import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export async function getEmails(
  page = 1,
  size = 20,
  filters?: { folder?: string; accountId?: string; category?: string }
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (filters?.folder && filters.folder !== "All")
    params.append("folder", filters.folder);
  if (filters?.accountId && filters.accountId !== "All")
    params.append("accountId", filters.accountId);
  if (filters?.category && filters.category !== "All")
    params.append("category", filters.category);

  const res = await api.get(`/api/emails/getEmails?${params.toString()}`);
  return res.data;
}

export async function searchEmails(
  q?: string,
  folder?: string,
  account?: string
) {
  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (folder) params.append("folder", folder);
  if (account) params.append("account", account);

  const res = await api.get(`/api/emails/search?${params.toString()}`);
  return res.data;
}

export async function getEmailById(id: string) {
  const res = await api.get(`/api/emails/${id}`);
  return res.data;
}

export async function generateAIReply(email: any, id: string) {
  const res = await api.post(`/api/ai/suggest-reply`, {
    id: id,
    text: email.text,
  });
  return res.data;
}
