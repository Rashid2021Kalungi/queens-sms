import { apiUrl, authHeaders } from "./baseUrl";
import type { DashboardExpenseRow } from "./dashboard";

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) throw new Error("Empty response");
  return JSON.parse(text) as T;
}

export type ExpenseSortBy = "date" | "id" | "status";
export type ExpenseSortDir = "asc" | "desc";

export async function fetchExpenses(opts: {
  q?: string;
  sortBy?: ExpenseSortBy;
  sortDir?: ExpenseSortDir;
  limit?: number;
}): Promise<DashboardExpenseRow[]> {
  const p = new URLSearchParams();
  if (opts.q?.trim()) p.set("q", opts.q.trim());
  p.set("sortBy", opts.sortBy ?? "date");
  p.set("sortDir", opts.sortDir ?? "desc");
  if (opts.limit != null) p.set("limit", String(opts.limit));
  const res = await fetch(apiUrl(`/api/me/expenses?${p.toString()}`), {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const err = await readJson<{ error?: string }>(res).catch(() => null);
    throw new Error(err?.error ?? "Request failed");
  }
  const data = await readJson<{ items: DashboardExpenseRow[] }>(res);
  return data.items;
}
