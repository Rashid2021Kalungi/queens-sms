import { apiUrl, authHeaders } from "./baseUrl";

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) throw new Error("Empty response");
  return JSON.parse(text) as T;
}

export type CountryOption = { code: string; name: string };

export async function fetchNationalities(): Promise<string[]> {
  const res = await fetch(apiUrl("/api/me/geo/nationalities"), {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to load nationalities");
  const data = await readJson<{ items: string[] }>(res);
  return data.items;
}

export async function fetchCountries(): Promise<CountryOption[]> {
  const res = await fetch(apiUrl("/api/me/geo/countries"), {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to load countries");
  const data = await readJson<{ items: CountryOption[] }>(res);
  return data.items;
}

export async function fetchDistricts(countryCode: string): Promise<string[]> {
  const p = new URLSearchParams({ country: countryCode.trim().toUpperCase() });
  const res = await fetch(apiUrl(`/api/me/geo/districts?${p.toString()}`), {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("Failed to load districts");
  const data = await readJson<{ items: { name: string }[] }>(res);
  return data.items.map((x) => x.name);
}
