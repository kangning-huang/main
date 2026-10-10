/**
 * Shareable view state in the query string (static export: no router round-trip).
 * Read after mount, write with replaceState so the back button isn't flooded.
 */
export function readQuery(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function updateQuery(patch: Record<string, string | null>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url.href);
}
