/** Short relative label for lists (e.g. `12m`, `1h`, `2d`). */
export function formatShortAgo(iso: string, nowMs = Date.now()): string {
  const t = new Date(iso).getTime();
  const sec = Math.max(0, Math.floor((nowMs - t) / 1000));
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}
