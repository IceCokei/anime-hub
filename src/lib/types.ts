export const sources = {
  bangumi: "Bangumi",
  anilist: "AniList",
  "tmdb-tv": "TMDB TV",
  "tmdb-movie": "TMDB Movies",
  kitsu: "Kitsu",
} as const;
export type Source = keyof typeof sources;
export type Anime = {
  id: string;
  source: Source;
  title: string;
  originalTitle: string;
  image: string;
  summary: string;
  score: number | null;
  votes: number | null;
  year: string;
  format: string;
  tags: string[];
  url: string;
};
export type CatalogQuery = {
  source: Source;
  locale: "en" | "zh";
  search: string;
  page: number;
  country: "" | "CN" | "JP";
  sort: "popular" | "score";
  minScore: number;
};
export type CatalogResult = {
  items: Anime[];
  hasNext: boolean;
  page: number;
  total?: number;
  note?: string;
};
