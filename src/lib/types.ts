export const sources = {
  bangumi: "Bangumi",
  douban: "豆瓣",
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
export type Person = { name: string; role: string; image: string };
export type Review = {
  author: string;
  rating: number | null;
  content: string;
  date: string;
  url: string;
};
export type Provider = { name: string; logo: string; kind: string; url: string };
export type Video = { key: string; name: string; type: string };
export type DetailData = {
  backdrop: string;
  tagline: string;
  date: string;
  genres: string[];
  runtime: string;
  credits: Person[];
  recommendations: Anime[];
  similar: Anime[];
  images: string[];
  videos: Video[];
  providers: Provider[];
  reviews: Review[];
};
export type DetailResult = { item: Anime; detail: DetailData };
export type CatalogQuery = {
  source: Source;
  locale: "en" | "zh";
  search: string;
  page: number;
  country: "" | "CN" | "JP";
  sort: "popular" | "score" | "rank" | "newest";
  minScore: number;
};
export type CatalogResult = {
  items: Anime[];
  hasNext: boolean;
  page: number;
  total?: number;
  note?: string;
};
