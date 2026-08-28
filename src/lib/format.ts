/**
 * Formats a Postgres `time` column value ("HH:MM:SS", as PostgREST returns
 * it) into a locale time string ("8:30 AM"). Parsed as plain hour/minute
 * rather than through `Date` -- attaching an arbitrary date to a bare time
 * and formatting it risks a timezone-driven off-by-one on the displayed hour.
 */
export function formatEventTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
