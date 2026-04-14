/**
 * Display as DD/MM/YYYY. Date-only strings (YYYY-MM-DD) are parsed as local calendar dates
 * so they are not shifted by UTC.
 */
export function safeLocaleDate(
  v: Date | string | null | undefined,
  fallback = "—",
): string {
  if (v == null || v === "") return fallback;
  let d: Date;
  if (v instanceof Date) {
    d = v;
  } else {
    const trimmed = v.trim();
    const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
    if (ymd) {
      d = new Date(
        Number(ymd[1]),
        Number(ymd[2]) - 1,
        Number(ymd[3]),
      );
    } else {
      d = new Date(trimmed);
    }
  }
  if (Number.isNaN(d.getTime())) return fallback;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Parse user search text to YYYY-MM-DD for DB `DATE` match, or null. */
export function parseQueryToIsoDate(q: string): string | null {
  const t = q.trim();
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (dmy) {
    const dd = dmy[1].padStart(2, "0");
    const mm = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${mm}-${dd}`;
  }
  return null;
}
