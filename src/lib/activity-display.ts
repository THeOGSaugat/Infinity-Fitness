/** "4h 30m", "45m" or "0m" — or the compact "4.5h" / "45m" for tight labels. */
export function formatMinutes(total: number, compact = false): string {
  const minutes = Math.max(0, Math.round(total));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (compact) return `${(minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1)}h`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
