import {
  sources,
  type Anime,
  type CatalogQuery,
  type CatalogResult,
  type Source,
} from "./types";
export type CatalogEnv = { TMDB_READ_TOKEN?: string; TMDB_API_KEY?: string };
const PAGE_SIZE = 20;
export class CatalogError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}
export function parseQuery(params: URLSearchParams): CatalogQuery {
  const source = params.get("source") || "bangumi";
  const locale = params.get("locale") || "en";
  const page = Number(params.get("page") || 1);
  const minScore = Number(params.get("minScore") || 0);
  const country = params.get("country") || "";
  const sort = params.get("sort") || "popular";
  const search = (params.get("search") || "").trim();
  if (
    !["en", "zh"].includes(locale) ||
    !Object.hasOwn(sources, source) ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 40 ||
    !Number.isFinite(minScore) ||
    minScore < 0 ||
    minScore > 10 ||
    !["", "CN", "JP"].includes(country) ||
    !["popular", "score", "rank", "newest"].includes(sort) ||
    search.length > 100
  )
    throw new CatalogError("Invalid query. Please adjust the filters.", 400);
  if (source === "kitsu" && country)
    throw new CatalogError(
      "Kitsu does not support reliable country filtering. Choose another source.",
      400,
    );
  if (source.startsWith("tmdb") && search)
    throw new CatalogError(
      "TMDB Discover does not support keyword search. Choose Bangumi, Douban or Kitsu.",
      400,
    );
  return {
    source: source as Source,
    locale: locale as "en" | "zh",
    page,
    minScore,
    country: country as CatalogQuery["country"],
    sort: sort as CatalogQuery["sort"],
    search,
  };
}
const UNREACHABLE =
  "The source could not be reached. Retry or choose another source.";
const pause = (ms: number) => new Promise((done) => setTimeout(done, ms));

export async function request<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  let message = UNREACHABLE;
  let status = 502;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await pause(200 * attempt);
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(7000),
        headers: { Accept: "application/json", ...init.headers },
      });
    } catch {
      message = UNREACHABLE;
      status = 502;
      continue;
    }
    if (!response.ok) {
      status = response.status === 429 ? 429 : 502;
      message =
        response.status === 429
          ? "Too many requests. Please try again later."
          : `Source unavailable (HTTP ${response.status}). Retry or choose another source.`;
      // Upstream 5xx and rate limits are usually transient: try again.
      if (response.status === 429 || response.status >= 500) continue;
      throw new CatalogError(message, status);
    }
    try {
      return (await response.json()) as T;
    } catch {
      message = UNREACHABLE;
      status = 502;
    }
  }
  throw new CatalogError(message, status);
}
export const safeImage = (value?: string | null) =>
  value?.startsWith("https://") ? value : "";
export const score = (value: unknown, divisor = 1): number | null => {
  const number = Number(value);
  return value != null && value !== "" && Number.isFinite(number) && number > 0
    ? Math.min(10, number / divisor)
    : null;
};
export const plainText = (value?: string | null) =>
  (value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

type BangumiSubject = {
  id: number;
  name: string;
  name_cn?: string;
  date?: string;
  platform?: string;
  summary?: string;
  images?: { large?: string; common?: string };
  rating?: { score?: number; total?: number };
  tags?: { name: string }[];
};
const withinWindow = (date?: string | null) => {
  const year = Number.parseInt((date || "").slice(0, 4), 10);
  return !Number.isFinite(year) || year <= new Date().getFullYear() + 2;
};
const bangumiItem = (item: BangumiSubject, locale: "en" | "zh"): Anime => ({
  id: `bangumi:${item.id}`,
  source: "bangumi",
  title: locale === "zh" ? item.name_cn || item.name : item.name,
  originalTitle: item.name,
  image: safeImage(item.images?.large || item.images?.common),
  summary: plainText(item.summary),
  score: score(item.rating?.score),
  votes: item.rating?.total ?? null,
  year: item.date?.slice(0, 4) || "",
  format: item.platform || "Animation",
  tags: (item.tags || []).slice(0, 5).map((tag) => tag.name),
  url: `https://bgm.tv/subject/${item.id}`,
});
async function bangumi(query: CatalogQuery): Promise<CatalogResult> {
  if (query.sort === "rank" || query.sort === "newest") {
    const order = query.sort === "newest" ? "date" : "rank";
    // The date feed leads with titles further out than the window, so fetch slack.
    const limit = query.sort === "newest" ? PAGE_SIZE + 5 : PAGE_SIZE;
    const ranking = await request<{ data: BangumiSubject[]; total: number }>(
      `https://api.bgm.tv/v0/subjects?type=2&sort=${order}&limit=${limit}&offset=${(query.page - 1) * PAGE_SIZE}`,
      {
        headers: {
          "User-Agent": "AnimeHub/1.0 (anime catalog; Next.js)",
        },
      },
    );
    return {
      items: ranking.data
        .filter((item) => withinWindow(item.date))
        .slice(0, PAGE_SIZE)
        .map((item) => bangumiItem(item, query.locale)),
      page: query.page,
      total: ranking.total,
      hasNext: query.page * PAGE_SIZE < Math.min(ranking.total, 1000),
      note:
        query.sort === "newest"
          ? "Bangumi 按上映时间倒序，含已定档的未上映作品。"
          : "Bangumi 排行榜使用站内加权排名，评分人数过少的条目不参与排序。",
    };
  }
  const response = await request<{ data: BangumiSubject[]; total: number }>(
    `https://api.bgm.tv/v0/search/subjects?limit=${PAGE_SIZE}&offset=${(query.page - 1) * PAGE_SIZE}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AnimeHub/1.0 (local anime catalog; Next.js)",
      },
      body: JSON.stringify({
        keyword: query.search,
        sort: query.sort === "score" ? "score" : "heat",
        filter: {
          type: [2],
          nsfw: false,
          rating: [`>=${query.minScore}`],
          ...(query.country
            ? { tag: [query.country === "CN" ? "国产" : "日本"] }
            : {}),
        },
      }),
    },
  );
  return {
    items: response.data.map((item) => bangumiItem(item, query.locale)),
    page: query.page,
    total: response.total,
    hasNext: query.page * PAGE_SIZE < Math.min(response.total, 1000),
    note: query.country
      ? "Country filtering uses Bangumi community tags and may be approximate."
      : undefined,
  };
}
type TmdbMedia = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path?: string;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
};
async function tmdb(
  query: CatalogQuery,
  env: CatalogEnv,
): Promise<CatalogResult> {
  const token = env.TMDB_READ_TOKEN;
  const key = env.TMDB_API_KEY;
  if (!token && !key)
    throw new CatalogError(
      "TMDB is not configured. Add TMDB_READ_TOKEN or TMDB_API_KEY as a Cloudflare Pages secret and redeploy.",
      503,
    );
  const type = query.source === "tmdb-movie" ? "movie" : "tv";
  const params = new URLSearchParams({
    language: query.locale === "zh" ? "zh-CN" : "en-US",
    page: String(query.page),
    with_genres: "16",
    include_adult: "false",
    sort_by:
      query.sort === "newest"
        ? type === "movie"
          ? "primary_release_date.desc"
          : "first_air_date.desc"
        : query.sort === "popular"
          ? "popularity.desc"
          : "vote_average.desc",
    "vote_average.gte": String(query.minScore),
    "vote_count.gte":
      query.sort === "score" || query.sort === "rank" ? "50" : "0",
  });
  if (query.country) params.set("with_origin_country", query.country);
  if (!token && key) params.set("api_key", key);
  const response = await request<{
    results: TmdbMedia[];
    total_pages: number;
    total_results: number;
  }>(`https://api.themoviedb.org/3/discover/${type}?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return {
    items: response.results.map(
      (item): Anime => ({
        id: `${query.source}:${item.id}`,
        source: query.source,
        title: item.title || item.name || "Untitled",
        originalTitle: item.original_title || item.original_name || "",
        image: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : "",
        summary: plainText(item.overview),
        score: score(item.vote_average),
        votes: item.vote_count ?? null,
        year: (item.release_date || item.first_air_date || "").slice(0, 4),
        format: type === "movie" ? "Movie" : "TV",
        tags: ["Animation"],
        url: `https://www.themoviedb.org/${type}/${item.id}`,
      }),
    ),
    page: query.page,
    total: response.total_results,
    hasNext: query.page < Math.min(response.total_pages, 40),
    note:
      query.sort === "score"
        ? "Score sorting includes titles with at least 50 ratings."
        : undefined,
  };
}
type KitsuMedia = {
  id: string;
  attributes: {
    canonicalTitle: string;
    titles?: { ja_jp?: string };
    synopsis?: string;
    posterImage?: { large?: string };
    averageRating?: string;
    startDate?: string;
    subtype?: string;
    ratingFrequencies?: Record<string, string>;
  };
};
async function kitsu(query: CatalogQuery): Promise<CatalogResult> {
  const params = new URLSearchParams({
    "page[limit]": String(PAGE_SIZE),
    "page[offset]": String((query.page - 1) * PAGE_SIZE),
    sort:
      query.sort === "newest"
        ? "-startDate"
        : query.sort === "popular"
          ? "-userCount"
          : "-averageRating",
  });
  if (query.search) params.set("filter[text]", query.search);
  const response = await request<{
    data: KitsuMedia[];
    links?: { next?: string };
  }>(`https://kitsu.io/api/edge/anime?${params}`, {
    headers: { Accept: "application/vnd.api+json" },
  });
  const items = response.data
    .map(
      (item): Anime => ({
        id: `kitsu:${item.id}`,
        source: "kitsu",
        title: item.attributes.canonicalTitle,
        originalTitle: item.attributes.titles?.ja_jp || "",
        image: safeImage(item.attributes.posterImage?.large),
        summary: plainText(item.attributes.synopsis),
        score: score(item.attributes.averageRating, 10),
        votes: item.attributes.ratingFrequencies
          ? Object.values(item.attributes.ratingFrequencies).reduce(
              (sum, value) => sum + Number(value),
              0,
            )
          : null,
        year: item.attributes.startDate?.slice(0, 4) || "",
        format: item.attributes.subtype || "Animation",
        tags: [],
        url: `https://kitsu.io/anime/${item.id}`,
      }),
    )
    .filter((item) => (item.score || 0) >= query.minScore);
  return {
    items,
    page: query.page,
    hasNext: Boolean(response.links?.next) && query.page < 40,
    note: "Kitsu country is unverified. Minimum score filters the current page; empty pages may still have a next page.",
  };
}
/* ---------- Douban ---------- */
const DOUBAN_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  Referer: "https://m.douban.com/",
};
type DoubanSubject = {
  id?: string;
  title?: string;
  year?: string;
  card_subtitle?: string;
  rating?: { value?: number; count?: number };
  pic?: { large?: string; normal?: string };
};
type DoubanSuggestion = {
  id: string;
  title: string;
  sub_title?: string;
  year?: string;
  img?: string;
  type?: string;
};
const doubanSubject = (item: DoubanSubject): Anime => ({
  id: `douban:${item.id}`,
  source: "douban",
  title: item.title || "Untitled",
  originalTitle: "",
  image: safeImage(item.pic?.large || item.pic?.normal),
  summary: "",
  score: score(item.rating?.value),
  votes: item.rating?.count ?? null,
  year: item.year || item.card_subtitle?.slice(0, 4) || "",
  format: "Animation",
  tags: [],
  url: `https://movie.douban.com/subject/${item.id}/`,
});
async function douban(query: CatalogQuery): Promise<CatalogResult> {
  if (query.search) {
    const list = await request<DoubanSuggestion[]>(
      `https://movie.douban.com/j/subject_suggest?q=${encodeURIComponent(query.search)}`,
      { headers: DOUBAN_HEADERS },
    );
    return {
      items: list
        .filter((item) => item.id && item.title)
        .slice(0, PAGE_SIZE)
        .map(
          (item): Anime => ({
            id: `douban:${item.id}`,
            source: "douban",
            title: item.title,
            originalTitle: item.sub_title || "",
            image: safeImage(item.img),
            summary: "",
            score: null,
            votes: null,
            year: item.year || "",
            format: item.type === "tv" ? "TV" : "Movie",
            tags: [],
            url: `https://movie.douban.com/subject/${item.id}/`,
          }),
        ),
      page: query.page,
      hasNext: false,
      note: "豆瓣搜索只返回建议条目，不含评分与简介。",
    };
  }
  const params = new URLSearchParams({
    refresh: "0",
    start: String((query.page - 1) * PAGE_SIZE),
    // Douban pads each page with chart cards we drop, so ask for a few extra.
    count: String(PAGE_SIZE + 5),
    selected_categories: "{}",
    uncollect: "false",
    tags: "动画",
    sort:
      query.sort === "newest" ? "R" : query.sort === "popular" ? "T" : "S",
  });
  const response = await request<{ items?: DoubanSubject[]; total?: number }>(
    `https://m.douban.com/rexxar/api/v2/movie/recommend?${params}`,
    { headers: DOUBAN_HEADERS },
  );
  const total = response.total || 0;
  return {
    items: (response.items || [])
      .filter((item) => item.id && item.rating)
      .filter((item) => withinWindow(item.year ? `${item.year}-01-01` : ""))
      .slice(0, PAGE_SIZE)
      .map(doubanSubject),
    page: query.page,
    total,
    hasNext: total > 0 && query.page * PAGE_SIZE < total,
    note: query.country
      ? "豆瓣不支持产地筛选，已忽略该条件。"
      : "豆瓣按「动画」标签推荐，评分来自豆瓣。",
  };
}
export async function getCatalog(
  query: CatalogQuery,
  env: CatalogEnv = {},
): Promise<CatalogResult> {
  const result = await (query.source === "bangumi"
    ? bangumi(query)
    : query.source === "douban"
      ? douban(query)
      : query.source === "kitsu"
        ? kitsu(query)
        : tmdb(query, env));
  return { ...result, hasNext: result.hasNext && query.page < 40 };
}
