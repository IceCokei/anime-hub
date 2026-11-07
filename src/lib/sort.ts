import type { Anime } from "./types";

const MAX_YEARS_AHEAD = 2;

const yearOf = (item: Anime) => {
  const year = Number.parseInt(item.year, 10);
  return Number.isFinite(year) ? year : 0;
};

export function byNewest(items: Anime[]): Anime[] {
  return items
    .filter((item) => yearOf(item) <= new Date().getFullYear() + MAX_YEARS_AHEAD)
    .sort((a, b) => yearOf(b) - yearOf(a));
}
