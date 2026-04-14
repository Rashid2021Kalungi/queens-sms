/**
 * Build URL for API calls. With no VITE_API_URL, uses `/api/...` (Vite dev proxy → backend).
 * Production: set VITE_API_URL to your API origin, e.g. https://api.school.example.com
 */
export function apiUrl(path: string): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  const base = raw?.replace(/\/$/, "") ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

/** Authorization header from stored JWT (for authenticated API calls). */
export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
