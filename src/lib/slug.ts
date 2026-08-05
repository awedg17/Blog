export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric"});
}

export function timeAgo(dateish: string | Date | null | undefined): string {
  if (!dateish) return "";
  const d = typeof dateish === "string" ? new Date(dateish) : dateish;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  // Older than a week: relative time stops being useful, show the date.
  return formatDate(typeof dateish === "string" ? dateish : d.toISOString());
}

/** Treat empty strings and the "#" placeholder (seed default) as no URL. */
export function realUrl(url: string | null | undefined, fallback: string): string {
  return url && url !== "#" ? url : fallback;
}
