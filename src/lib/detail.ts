import {
  CatalogError,
  plainText,
  request,
  safeImage,
  score,
  type CatalogEnv,
} from "./catalog";
import {
  sources,
  type Anime,
  type DetailData,
  type DetailResult,
  type Provider,
  type Source,
} from "./types";

type Locale = "en" | "zh";
const BGM_HEADERS = { "User-Agent": "AnimeHub/1.0 (anime catalog; Next.js)" };
const clip = (value: string, max = 700) =>
  value.length > max ? `${value.slice(0, max)}…` : value;
const empty = (): DetailData => ({
  backdrop: "",
  tagline: "",
  date: "",
  genres: [],
  runtime: "",
  credits: [],
  recommendations: [],
  similar: [],
  images: [],
  videos: [],
  providers: [],
  reviews: [],
});

export function parseDetailId(value: string): { source: Source; id: string } {
  const [source, id] = value.split(":");
  if (!source || !id || !Object.hasOwn(sources, source) || !/^\d+$/.test(id))
    throw new CatalogError("Invalid query. Please adjust the filters.", 400);
  return { source: source as Source, id };
}

/* ---------- TMDB ---------- */
type TmdbItem = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path?: string | null;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
};
type TmdbImage = { file_path: string };
type TmdbProvider = { provider_name: string; logo_path?: string };
type TmdbDetail = TmdbItem & {
  backdrop_path?: string | null;
  tagline?: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  genres?: { name: string }[];
  credits?: {
    cast?: {
      name: string;
      character?: string;
      profile_path?: string | null;
    }[];
    crew?: {
      name: string;
      job?: string;
      profile_path?: string | null;
    }[];
  };
  recommendations?: { results: TmdbItem[] };
  similar?: { results: TmdbItem[] };
  images?: { backdrops?: TmdbImage[] };
  videos?: { results: { key: string; name: string; site: string; type: string }[] };
  "watch/providers"?: {
    results?: Record<
      string,
      {
        link?: string;
        flatrate?: TmdbProvider[];
        rent?: TmdbProvider[];
        buy?: TmdbProvider[];
      }
    >;
  };
  reviews?: {
    results: {
      author: string;
      content: string;
      created_at: string;
      url: string;
      author_details?: { rating?: number | null };
    }[];
  };
};
async function tmdbDetail(
  source: "tmdb-tv" | "tmdb-movie",
  id: string,
  locale: Locale,
  env: CatalogEnv,
): Promise<DetailResult> {
  const token = env.TMDB_READ_TOKEN;
  const key = env.TMDB_API_KEY;
  if (!token && !key)
    throw new CatalogError(
      "TMDB is not configured. Add TMDB_READ_TOKEN or TMDB_API_KEY as a Cloudflare Pages secret and redeploy.",
      503,
    );
  const type = source === "tmdb-movie" ? "movie" : "tv";
  const params = new URLSearchParams({
    language: locale === "zh" ? "zh-CN" : "en-US",
    append_to_response:
      "credits,recommendations,similar,images,videos,watch/providers,reviews",
    include_image_language: "en,ja,zh,null",
    include_video_language: "en,ja,zh,null",
  });
  if (!token && key) params.set("api_key", key);
  const data = await request<TmdbDetail>(
    `https://api.themoviedb.org/3/${type}/${id}?${params}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  const toAnime = (item: TmdbItem): Anime => ({
    id: `${source}:${item.id}`,
    source,
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
  });
  const photo = (path?: string | null) =>
    path ? `https://image.tmdb.org/t/p/w185${path}` : "";
  const regions = data["watch/providers"]?.results || {};
  const region =
    regions[locale === "zh" ? "CN" : "US"] ||
    regions.US ||
    regions.JP ||
    Object.values(regions)[0];
  const providers: Provider[] = [];
  for (const [kind, list] of [
    ["flatrate", region?.flatrate],
    ["rent", region?.rent],
    ["buy", region?.buy],
  ] as const)
    for (const provider of list || [])
      providers.push({
        name: provider.provider_name,
        logo: provider.logo_path
          ? `https://image.tmdb.org/t/p/w92${provider.logo_path}`
          : "",
        kind,
        url: region?.link || "",
      });
  const runtime = data.runtime || data.episode_run_time?.[0] || 0;
  const directors = (data.credits?.crew || [])
    .filter((person) => person.job === "Director")
    .slice(0, 3)
    .map((person) => ({
      name: person.name,
      role: "Director",
      image: photo(person.profile_path),
    }));
  return {
    item: toAnime(data),
    detail: {
      backdrop: data.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
        : "",
      tagline: data.tagline || "",
      date: data.release_date || data.first_air_date || "",
      genres: (data.genres || []).map((genre) => genre.name),
      runtime: runtime ? `${runtime} min` : "",
      credits: [
        ...directors,
        ...(data.credits?.cast || []).slice(0, 18).map((person) => ({
          name: person.name,
          role: person.character || "",
          image: photo(person.profile_path),
        })),
      ],
      recommendations: (data.recommendations?.results || [])
        .slice(0, 18)
        .map(toAnime),
      similar: (data.similar?.results || []).slice(0, 18).map(toAnime),
      images: (data.images?.backdrops || [])
        .slice(0, 18)
        .map((image) => `https://image.tmdb.org/t/p/w780${image.file_path}`),
      videos: (data.videos?.results || [])
        .filter((video) => video.site === "YouTube")
        .slice(0, 12)
        .map((video) => ({ key: video.key, name: video.name, type: video.type })),
      providers,
      reviews: (data.reviews?.results || []).slice(0, 8).map((review) => ({
        author: review.author,
        rating: review.author_details?.rating ?? null,
        content: clip(plainText(review.content)),
        date: review.created_at?.slice(0, 10) || "",
        url: review.url,
      })),
    },
  };
}

/* ---------- Bangumi ---------- */
type BgmImages = { large?: string; common?: string; medium?: string };
async function bangumiDetail(id: string): Promise<DetailResult> {
  const base = `https://api.bgm.tv/v0/subjects/${id}`;
  const [subject, characters, persons, related] = await Promise.all([
    request<{
      name?: string;
      name_cn?: string;
      date?: string;
      platform?: string;
      summary?: string;
      images?: BgmImages;
      rating?: { score?: number; total?: number };
      tags?: { name: string }[];
      eps?: number;
    }>(base, { headers: BGM_HEADERS }),
    request<{ name: string; relation?: string; images?: BgmImages }[]>(
      `${base}/characters`,
      { headers: BGM_HEADERS },
    ).catch(() => []),
    request<{ name: string; relation?: string; images?: BgmImages }[]>(
      `${base}/persons`,
      { headers: BGM_HEADERS },
    ).catch(() => []),
    request<
      {
        id: number;
        name: string;
        name_cn?: string;
        relation?: string;
        type?: number;
        images?: BgmImages;
      }[]
    >(`${base}/subjects`, { headers: BGM_HEADERS }).catch(() => []),
  ]);
  const animeRelated = related.filter((item) => item.type === 2);
  return {
    item: {
      id: `bangumi:${id}`,
      source: "bangumi",
      title: subject.name_cn || subject.name || "Untitled",
      originalTitle: subject.name || "",
      image: safeImage(subject.images?.large || subject.images?.common),
      summary: plainText(subject.summary),
      score: score(subject.rating?.score),
      votes: subject.rating?.total ?? null,
      year: subject.date?.slice(0, 4) || "",
      format: subject.platform || "Animation",
      tags: (subject.tags || []).slice(0, 5).map((tag) => tag.name),
      url: `https://bgm.tv/subject/${id}`,
    },
    detail: {
      ...empty(),
      date: subject.date || "",
      genres: (subject.tags || []).slice(0, 6).map((tag) => tag.name),
      runtime: subject.eps ? `${subject.eps} eps` : "",
      credits: [...persons.slice(0, 8), ...characters.slice(0, 12)].map(
        (item) => ({
          name: item.name,
          role: item.relation || "",
          image: safeImage(item.images?.medium || item.images?.large),
        }),
      ),
      similar: (animeRelated.length ? animeRelated : related).slice(0, 18).map(
        (item): Anime => ({
          id: `bangumi:${item.id}`,
          source: "bangumi",
          title: item.name_cn || item.name,
          originalTitle: item.name,
          image: safeImage(item.images?.large || item.images?.common),
          summary: "",
          score: null,
          votes: null,
          year: "",
          format: item.relation || "Animation",
          tags: [],
          url: `https://bgm.tv/subject/${item.id}`,
        }),
      ),
    },
  };
}

/* ---------- Douban ---------- */
type DoubanSubject = {
  title?: string;
  original_title?: string;
  year?: string;
  intro?: string;
  rating?: { value?: number; count?: number };
  genres?: string[];
  durations?: string[];
  pic?: { large?: string; normal?: string };
  cover_url?: string;
  pubdate?: string[];
  release_date?: string;
  directors?: { name?: string }[];
  actors?: { name?: string }[];
};
async function doubanDetail(id: string): Promise<DetailResult> {
  const data = await request<DoubanSubject>(
    `https://m.douban.com/rexxar/api/v2/movie/${id}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
        Referer: "https://m.douban.com/",
      },
    },
  );
  return {
    item: {
      id: `douban:${id}`,
      source: "douban",
      title: data.title || "Untitled",
      originalTitle: data.original_title || "",
      image: safeImage(data.pic?.large || data.pic?.normal || data.cover_url),
      summary: plainText(data.intro),
      score: score(data.rating?.value),
      votes: data.rating?.count ?? null,
      year: data.year || "",
      format: "Animation",
      tags: (data.genres || []).slice(0, 5),
      url: `https://movie.douban.com/subject/${id}/`,
    },
    detail: {
      ...empty(),
      date: data.release_date || data.pubdate?.[0] || "",
      genres: (data.genres || []).slice(0, 6),
      runtime: data.durations?.[0] || "",
      credits: [
        ...(data.directors || []).map((person) => ({
          name: person.name || "",
          role: "导演",
          image: "",
        })),
        ...(data.actors || []).slice(0, 12).map((person) => ({
          name: person.name || "",
          role: "演员",
          image: "",
        })),
      ],
    },
  };
}

/* ---------- Kitsu ---------- */
async function kitsuDetail(id: string): Promise<DetailResult> {
  const response = await request<{
    data: {
      attributes: {
        canonicalTitle?: string;
        titles?: { en?: string; en_jp?: string; ja_jp?: string };
        synopsis?: string;
        averageRating?: string;
        subtype?: string;
        posterImage?: { large?: string; original?: string };
        coverImage?: { large?: string; original?: string };
        youtubeVideoId?: string;
        startDate?: string;
        episodeLength?: number;
      };
    };
    included?: { type: string; attributes: { name?: string } }[];
  }>(`https://kitsu.io/api/edge/anime/${id}?include=genres`, {
    headers: { Accept: "application/vnd.api+json" },
  });
  const attributes = response.data.attributes;
  const genres = (response.included || [])
    .filter((item) => item.type === "genres" && item.attributes.name)
    .map((item) => item.attributes.name as string);
  return {
    item: {
      id: `kitsu:${id}`,
      source: "kitsu",
      title:
        attributes.canonicalTitle ||
        attributes.titles?.en ||
        attributes.titles?.ja_jp ||
        "Untitled",
      originalTitle: attributes.titles?.ja_jp || "",
      image: safeImage(
        attributes.posterImage?.large || attributes.posterImage?.original,
      ),
      summary: plainText(attributes.synopsis),
      score: score(attributes.averageRating, 10),
      votes: null,
      year: attributes.startDate?.slice(0, 4) || "",
      format: attributes.subtype || "Animation",
      tags: genres.slice(0, 5),
      url: `https://kitsu.io/anime/${id}`,
    },
    detail: {
      ...empty(),
      backdrop: safeImage(
        attributes.coverImage?.large || attributes.coverImage?.original,
      ),
      date: attributes.startDate || "",
      runtime: attributes.episodeLength ? `${attributes.episodeLength} min` : "",
      genres,
      videos: attributes.youtubeVideoId
        ? [{ key: attributes.youtubeVideoId, name: "Trailer", type: "Trailer" }]
        : [],
    },
  };
}

export async function getDetail(
  value: string,
  locale: Locale,
  env: CatalogEnv = {},
): Promise<DetailResult> {
  const { source, id } = parseDetailId(value);
  if (source === "tmdb-tv" || source === "tmdb-movie")
    return tmdbDetail(source, id, locale, env);
  if (source === "bangumi") return bangumiDetail(id);
  if (source === "douban") return doubanDetail(id);
  return kitsuDetail(id);
}
