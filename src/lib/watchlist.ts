import { sources, type Anime } from "./types";

export const WATCHLIST_KEY = "anime-hub:watchlist:v1";
export const THEME_KEY = "anime-hub:theme";

export function loadWatchlist(): Anime[] {
  try {
    const list: unknown = JSON.parse(
      localStorage.getItem(WATCHLIST_KEY) || "[]",
    );
    if (!Array.isArray(list)) return [];
    return list.filter(
      (item): item is Anime =>
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        Object.hasOwn(sources, item.source) &&
        Array.isArray(item.tags) &&
        typeof item.url === "string" &&
        item.url.startsWith("https://"),
    );
  } catch {
    return [];
  }
}

export function writeWatchlist(list: Anime[]) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
