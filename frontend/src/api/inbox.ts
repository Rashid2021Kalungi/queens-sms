import { apiUrl, authHeaders } from "./baseUrl";

export type InboxApiItem = {
  id: number;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type InboxMessageApiItem = InboxApiItem & {
  senderUserId: number | null;
};

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) throw new Error("Empty response");
  return JSON.parse(text) as T;
}

export async function fetchNotifications(opts?: {
  unreadOnly?: boolean;
}): Promise<InboxApiItem[]> {
  const q = opts?.unreadOnly ? "?unreadOnly=1" : "";
  const res = await fetch(apiUrl(`/api/me/notifications${q}`), {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const err = await readJson<{ error?: string }>(res).catch(() => null);
    throw new Error(err?.error ?? "Request failed");
  }
  const data = await readJson<{ items: InboxApiItem[] }>(res);
  return data.items;
}

export async function fetchNotification(id: number): Promise<InboxApiItem> {
  const res = await fetch(apiUrl(`/api/me/notifications/${id}`), {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) throw new Error("Request failed");
  return readJson<InboxApiItem>(res);
}

export async function markNotificationRead(id: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/me/notifications/${id}/read`), {
    method: "PATCH",
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Request failed");
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(apiUrl("/api/me/notifications/read-all"), {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Request failed");
}

export async function fetchMessages(opts?: {
  unreadOnly?: boolean;
}): Promise<InboxMessageApiItem[]> {
  const q = opts?.unreadOnly ? "?unreadOnly=1" : "";
  const res = await fetch(apiUrl(`/api/me/messages${q}`), {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const err = await readJson<{ error?: string }>(res).catch(() => null);
    throw new Error(err?.error ?? "Request failed");
  }
  const data = await readJson<{ items: InboxMessageApiItem[] }>(res);
  return data.items;
}

export async function fetchMessage(id: number): Promise<InboxMessageApiItem> {
  const res = await fetch(apiUrl(`/api/me/messages/${id}`), {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) throw new Error("Request failed");
  return readJson<InboxMessageApiItem>(res);
}

export async function markMessageRead(id: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/me/messages/${id}/read`), {
    method: "PATCH",
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Request failed");
}

export async function markAllMessagesRead(): Promise<void> {
  const res = await fetch(apiUrl("/api/me/messages/read-all"), {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Request failed");
}
