const PROXIED = ["doubanio.com", "douban.com"];

// Douban only serves images to its own referers, so they go through /api/img.
export function imageUrl(url: string): string {
  if (!url) return "";
  try {
    const { hostname } = new URL(url);
    if (PROXIED.some((host) => hostname === host || hostname.endsWith(`.${host}`)))
      return `/api/img?u=${encodeURIComponent(url)}`;
  } catch {}
  return url;
}
