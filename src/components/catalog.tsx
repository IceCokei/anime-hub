"use client";

import { useEffect, useState, type ReactNode } from "react";
import { copy, type Locale } from "@/lib/i18n";
import {
  sources,
  type Anime,
  type CatalogResult,
  type DetailData,
  type Source,
} from "@/lib/types";

const SAVED_KEY = "anime-hub:watchlist:v1";
function readList(value: unknown): Anime[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Anime =>
      item &&
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.originalTitle === "string" &&
      typeof item.summary === "string" &&
      typeof item.image === "string" &&
      typeof item.format === "string" &&
      typeof item.year === "string" &&
      (item.score === null || typeof item.score === "number") &&
      (item.votes === null || typeof item.votes === "number") &&
      Array.isArray(item.tags) &&
      item.tags.every((tag: unknown) => typeof tag === "string") &&
      Object.hasOwn(sources, item.source) &&
      typeof item.url === "string" &&
      /^https:\/\/(bgm.tv|anilist.co|kitsu.io|www.themoviedb.org)\//.test(
        item.url,
      ),
  );
}

const ICONS: Record<string, ReactNode> = {
  film: (
    <>
      <path d="M4 8h16v11H4z" />
      <path d="m4 8 2-4 4 1-2 3M10 5l4 1-2 2M14 6l4 1-2 1" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  bookmark: <path d="M7 4h10v16l-5-4-5 4z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  sort: <path d="M4 6h10M4 12h7M4 18h4M17 5v14M14 16l3 3 3-3" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  spark: (
    <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7zM19 16c.2 1.6 1 2.4 2.5 2.5-1.5.2-2.3 1-2.5 2.5-.2-1.5-1-2.3-2.5-2.5 1.5-.1 2.3-.9 2.5-2.5z" />
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  filter: <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />,
  link: <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />,
  play: <path d="M8 5v14l11-7z" />,
};
function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

function Artwork({ item, fit = "cover" }: { item: Anime; fit?: string }) {
  const [failed, setFailed] = useState(false);
  return item.image.startsWith("https://") && !failed ? (
    <img
      src={item.image}
      alt={item.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      style={{ objectFit: fit as "cover" }}
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="artwork-placeholder" aria-hidden="true">
      <Icon name="film" size={34} />
    </div>
  );
}

type Text = (typeof copy)["en"];
const TAB_ORDER = [
  "reviews",
  "watch",
  "credits",
  "recommendations",
  "similar",
  "images",
  "videos",
] as const;
type TabKey = (typeof TAB_ORDER)[number];

function Poster({
  item,
  text,
  locale,
  saved,
  onOpen,
  onToggle,
}: {
  item: Anime;
  text: Text;
  locale: Locale;
  saved: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  return (
    <article className="card">
      <div className="poster">
        <button
          className="poster-open"
          aria-label={`${text.details}: ${item.title}`}
          onClick={onOpen}
        >
          <Artwork item={item} />
        </button>
        <span className="badge">
          {item.format === "Animation" ? text.animation : item.format}
        </span>
        <button
          className="bookmark"
          aria-pressed={saved}
          aria-label={saved ? text.remove : text.save}
          onClick={onToggle}
        >
          <Icon name={saved ? "check" : "bookmark"} size={16} />
        </button>
      </div>
      <div className="card-line">
        <button className="card-title" onClick={onOpen}>
          {item.title}
        </button>
        <span className="card-score">
          {item.score ? (
            <>
              <Icon name="star" size={13} />
              {item.score.toFixed(1)}
            </>
          ) : (
            "—"
          )}
        </span>
      </div>
      <div className="card-meta">
        <span>
          {item.year || "—"} · {item.format === "Animation" ? text.animation : item.format}
        </span>
        <span>
          {item.votes != null
            ? `${item.votes >= 10000 ? `${(item.votes / 10000).toFixed(1)}万` : item.votes.toLocaleString(locale)} ${text.votes}`
            : ""}
        </span>
      </div>
    </article>
  );
}

function DetailView({
  item,
  locale,
  saved,
  isSaved,
  toggle,
  open,
  back,
}: {
  item: Anime;
  locale: Locale;
  saved: Anime[];
  isSaved: boolean;
  toggle: (item: Anime) => void;
  open: (item: Anime) => void;
  back: () => void;
}) {
  const text = copy[locale];
  const [data, setData] = useState<DetailData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("recommendations");
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    window.scrollTo(0, 0);
    fetch(`/api/detail?${new URLSearchParams({ id: item.id, locale })}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || text.network);
        if (controller.signal.aborted) return;
        const next = body as DetailData;
        setData(next);
        const filled: Record<TabKey, number> = {
          reviews: next.reviews.length,
          watch: next.providers.length,
          credits: next.credits.length,
          recommendations: next.recommendations.length,
          similar: next.similar.length,
          images: next.images.length,
          videos: next.videos.length,
        };
        setTab(
          filled.recommendations
            ? "recommendations"
            : TAB_ORDER.find((key) => filled[key]) || "recommendations",
        );
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : text.network);
      });
    return () => controller.abort();
  }, [item.id, locale, text.network]);

  const empty = <p className="tab-empty">{text.notFound}</p>;
  const grid = (list: Anime[]) =>
    list.length ? (
      <div className="grid compact">
        {list.map((entry) => (
          <Poster
            key={entry.id}
            item={entry}
            text={text}
            locale={locale}
            saved={saved.some((value) => value.id === entry.id)}
            onOpen={() => open(entry)}
            onToggle={() => toggle(entry)}
          />
        ))}
      </div>
    ) : (
      empty
    );
  function panel(current: DetailData) {
    if (tab === "reviews")
      return current.reviews.length ? (
        <div className="reviews">
          {current.reviews.map((review, index) => (
            <article key={`${review.author}-${index}`}>
              <header>
                <strong>{review.author}</strong>
                {review.rating != null && (
                  <span className="card-score">
                    <Icon name="star" size={13} />
                    {review.rating.toFixed(1)}
                  </span>
                )}
                <small>{review.date}</small>
              </header>
              <p>{review.content}</p>
              {review.url.startsWith("https://") && (
                <a href={review.url} target="_blank" rel="noopener noreferrer">
                  {text.viewOnSource} <Icon name="link" size={12} />
                </a>
              )}
            </article>
          ))}
        </div>
      ) : (
        empty
      );
    if (tab === "watch")
      return current.providers.length ? (
        <div className="providers">
          {current.providers.map((provider, index) => {
            const content = (
              <>
                {provider.logo ? (
                  <img src={provider.logo} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <Icon name="play" size={16} />
                )}
                <span>{provider.name}</span>
                <small>
                  {text.kinds[provider.kind as keyof typeof text.kinds] ||
                    provider.kind}
                </small>
              </>
            );
            return provider.url.startsWith("https://") ? (
              <a
                key={`${provider.name}-${index}`}
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content}
              </a>
            ) : (
              <div key={`${provider.name}-${index}`}>{content}</div>
            );
          })}
        </div>
      ) : (
        empty
      );
    if (tab === "credits")
      return current.credits.length ? (
        <div className="people">
          {current.credits.map((person, index) => (
            <div key={`${person.name}-${index}`}>
              <span className="avatar">
                {person.image ? (
                  <img src={person.image} alt="" referrerPolicy="no-referrer" />
                ) : (
                  person.name.slice(0, 1)
                )}
              </span>
              <strong>{person.name}</strong>
              <small>{person.role}</small>
            </div>
          ))}
        </div>
      ) : (
        empty
      );
    if (tab === "recommendations") return grid(current.recommendations);
    if (tab === "similar") return grid(current.similar);
    if (tab === "images")
      return current.images.length ? (
        <div className="gallery">
          {current.images.map((src) => (
            <a key={src} href={src} target="_blank" rel="noopener noreferrer">
              <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />
            </a>
          ))}
        </div>
      ) : (
        empty
      );
    return current.videos.length ? (
      <div className="gallery videos">
        {current.videos.map((video) => (
          <a
            key={video.key}
            href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.key)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={`https://img.youtube.com/vi/${encodeURIComponent(video.key)}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <span className="play">
              <Icon name="play" size={20} />
            </span>
            <small>{video.name}</small>
          </a>
        ))}
      </div>
    ) : (
      empty
    );
  }
  const backdrop = data?.backdrop || item.image;
  const genres = data?.genres.length ? data.genres : item.tags;
  return (
    <div className="detail">
      <button className="ghost back" onClick={back}>
        <Icon name="back" size={16} /> {text.back}
      </button>
      <div className="banner">
        {backdrop.startsWith("https://") && (
          <img
            src={backdrop}
            alt=""
            referrerPolicy="no-referrer"
            className={data?.backdrop ? "" : "blur"}
          />
        )}
      </div>
      <div className="hero-row">
        <div className="detail-poster">
          <Artwork item={item} />
        </div>
        <div className="detail-info">
          <p className="date">
            {[data?.date || item.year, data?.runtime].filter(Boolean).join(" · ") ||
              text.unknownYear}
          </p>
          <h1>{item.title}</h1>
          {item.originalTitle && item.originalTitle !== item.title && (
            <p className="original">{item.originalTitle}</p>
          )}
          <div className="chips">
            {genres.slice(0, 6).map((genre, index) => (
              <span key={`${genre}-${index}`}>{genre}</span>
            ))}
            <span className="rating-chip">
              {sources[item.source].split(" ")[0]}
              <i />
              {item.score ? item.score.toFixed(1) : "—"}
            </span>
          </div>
          {data?.tagline && <p className="tagline">“{data.tagline}”</p>}
          <p className="summary">{item.summary || text.noSummary}</p>
          <div className="actions">
            <button
              className={isSaved ? "solid done" : "solid"}
              onClick={() => toggle(item)}
            >
              <Icon name={isSaved ? "check" : "plus"} size={16} />
              {isSaved ? text.inList : text.addToList}
            </button>
            <a
              className="ghost"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {text.visit} <Icon name="link" size={14} />
            </a>
          </div>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {TAB_ORDER.map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
          >
            {text.tabs[key]}
          </button>
        ))}
      </div>
      <div className="tab-panel" role="tabpanel">
        {error ? (
          <p className="tab-empty" role="alert">
            {error}
          </p>
        ) : data ? (
          panel(data)
        ) : (
          <p className="tab-empty" role="status">
            {text.detailLoading}
          </p>
        )}
      </div>
    </div>
  );
}

export function Catalog() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState<"explore" | "saved">("explore");
  const [source, setSource] = useState<Source>("bangumi");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [minScore, setMinScore] = useState("0");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CatalogResult | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Anime[]>([]);
  const [storageError, setStorageError] = useState(false);
  const [detail, setDetail] = useState<Anime | null>(null);
  const text = copy[locale];
  const tmdb = source.startsWith("tmdb");
  useEffect(() => {
    try {
      setSaved(readList(JSON.parse(localStorage.getItem(SAVED_KEY) || "[]")));
      if (localStorage.getItem("anime-hub:locale") === "en") setLocale("en");
      setDark(localStorage.getItem("anime-hub:theme") !== "light");
    } catch {
      setStorageError(true);
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = `${text.brand} · ${text.explore}`;
  }, [locale, text]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    const onPop = () => setDetail(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (tab === "saved") return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setResult(null);
    fetch(
      `/api/anime?${new URLSearchParams({ source, locale, search, country, minScore, sort, page: String(page) })}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || text.network);
        if (!controller.signal.aborted) setResult(data);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : text.network);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [
    source,
    locale,
    search,
    country,
    minScore,
    sort,
    page,
    tab,
    attempt,
    text.network,
  ]);
  function persist(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      setStorageError(true);
    }
  }
  function toggle(item: Anime) {
    const next = saved.some((entry) => entry.id === item.id)
      ? saved.filter((entry) => entry.id !== item.id)
      : [...saved, item];
    setSaved(next);
    persist(SAVED_KEY, JSON.stringify(next));
  }
  function openDetail(item: Anime) {
    if (!detail) history.pushState({ detail: true }, "");
    setDetail(item);
  }
  function closeDetail() {
    if (history.state?.detail) history.back();
    else setDetail(null);
  }
  function selectSource(value: Source) {
    setSource(value);
    setPage(1);
    if (value === "kitsu") setCountry("");
    if (value.startsWith("tmdb")) {
      setSearch("");
      setDraft("");
    }
  }
  const sourceLabel = (value: string, label: string) =>
    locale === "zh" && value === "tmdb-tv"
      ? "TMDB 剧集"
      : locale === "zh" && value === "tmdb-movie"
        ? "TMDB 电影"
        : label;
  const items = tab === "saved" ? saved : result?.items || [];
  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="logo">
            <Icon name="film" size={22} />
          </span>
          <strong>{text.brand}</strong>
          <span className="brand-sub">ANIME JOURNAL</span>
        </a>
        <nav aria-label={locale === "zh" ? "主导航" : "Main navigation"}>
          <button
            aria-current={tab === "explore"}
            onClick={() => {
              setTab("explore");
              setDetail(null);
            }}
          >
            <Icon name="compass" size={17} />
            {text.explore}
          </button>
          <button
            aria-current={tab === "saved"}
            onClick={() => {
              setTab("saved");
              setDetail(null);
            }}
          >
            <Icon name="bookmark" size={17} />
            {text.saved}
            <b>{saved.length}</b>
          </button>
        </nav>
        <div className="tools">
          <label className="lang">
            <Icon name="globe" size={16} />
            <select
              aria-label="Language / 语言"
              value={locale}
              onChange={(event) => {
                const next = event.target.value as Locale;
                setLocale(next);
                persist("anime-hub:locale", next);
              }}
            >
              <option value="zh">简体中文</option>
              <option value="en">English</option>
            </select>
          </label>
          <button
            className="icon-button"
            aria-label={text.theme}
            onClick={() => {
              setDark(!dark);
              persist("anime-hub:theme", dark ? "light" : "dark");
            }}
          >
            <Icon name={dark ? "sun" : "moon"} size={18} />
          </button>
        </div>
      </header>
      <main>
        {detail ? (
          <DetailView
            item={detail}
            locale={locale}
            saved={saved}
            isSaved={saved.some((entry) => entry.id === detail.id)}
            toggle={toggle}
            open={openDetail}
            back={closeDetail}
          />
        ) : (
          <>
            <section className="hero">
              <div>
                <p className="eyebrow">
                  <i />
                  {tab === "saved" ? text.local : text.eyebrow}
                </p>
                <h1>{tab === "saved" ? text.savedHeading : text.heading}</h1>
                <p className="hero-sub">{text.heroSub}</p>
              </div>
              <aside className="hero-side">
                <Icon name="spark" size={30} />
                <p>
                  <small>{text.heroSide1}</small>
                  {text.heroSide2}
                </p>
              </aside>
            </section>
            {tab === "explore" && (
              <>
                <section className="sources" aria-label={text.source}>
                  <span className="sources-label">
                    <Icon name="globe" size={18} />
                    {text.sources}
                  </span>
                  <div role="group" aria-label={text.source}>
                    {Object.entries(sources).map(([value, label]) => (
                      <button
                        key={value}
                        aria-pressed={source === value}
                        onClick={() => selectSource(value as Source)}
                      >
                        {source === value && <i />}
                        {sourceLabel(value, label)}
                      </button>
                    ))}
                  </div>
                  <span className="sources-hint">{text.sourceHint}</span>
                </section>
                <section className="filters" aria-label={text.search}>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      setSearch(draft.trim());
                      setPage(1);
                    }}
                  >
                    <Icon name="search" size={19} />
                    <input
                      aria-label={text.search}
                      value={draft}
                      maxLength={100}
                      disabled={tmdb}
                      placeholder={
                        tmdb ? text.discoverOnly : text.searchPlaceholder
                      }
                      onChange={(event) => setDraft(event.target.value)}
                    />
                    <button aria-label={text.searchButton} disabled={tmdb}>
                      <Icon name="arrow" size={18} />
                    </button>
                  </form>
                  <label className="select">
                    <Icon name="globe" size={17} />
                    <select
                      aria-label={text.country}
                      value={country}
                      disabled={source === "kitsu"}
                      onChange={(event) => {
                        setCountry(event.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">{text.allCountries}</option>
                      <option value="CN">{text.china}</option>
                      <option value="JP">{text.japan}</option>
                    </select>
                    <Icon name="chevron" size={15} />
                  </label>
                  <label className="select">
                    <Icon name="star" size={17} />
                    <select
                      aria-label={text.score}
                      value={minScore}
                      onChange={(event) => {
                        setMinScore(event.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="0">{text.allScores}</option>
                      {[7, 8, 9].map((score) => (
                        <option key={score} value={score}>
                          {score}+
                        </option>
                      ))}
                    </select>
                    <Icon name="chevron" size={15} />
                  </label>
                  <label className="select">
                    <Icon name="sort" size={17} />
                    <select
                      aria-label={text.sort}
                      value={sort}
                      onChange={(event) => {
                        setSort(event.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="popular">{text.popular}</option>
                      <option value="score">{text.highest}</option>
                    </select>
                    <Icon name="chevron" size={15} />
                  </label>
                </section>
              </>
            )}
            <div className="result-heading">
              <h2>{tab === "saved" ? text.saved : search || text.popular}</h2>
              <span>
                {tab === "saved"
                  ? `${saved.length} ${text.titles}`
                  : `${sourceLabel(source, sources[source])}${result?.total != null ? ` · ${result.total.toLocaleString(locale)} ${text.titles}` : ""}`}
              </span>
              <em>
                <Icon name="filter" size={16} />
                {text.featured}
              </em>
            </div>
            {storageError && (
              <p role="status" className="notice">
                {text.storage}
              </p>
            )}
            {tab === "explore" && loading ? (
              <div className="loading" role="status">
                {text.loading}
                <div className="loading-line" />
              </div>
            ) : tab === "explore" && error ? (
              <section className="message" role="alert">
                <h3>{text.error}</h3>
                <p>{error}</p>
                <button
                  className="solid"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  {text.retry}
                </button>
              </section>
            ) : (
              <>
                {!items.length ? (
                  <section className="message">
                    <h3>{text.empty}</h3>
                    <p>{text.emptyHint}</p>
                  </section>
                ) : (
                  <div className="grid">
                    {items.map((item) => (
                      <Poster
                        key={item.id}
                        item={item}
                        text={text}
                        locale={locale}
                        saved={saved.some((entry) => entry.id === item.id)}
                        onOpen={() => openDetail(item)}
                        onToggle={() => toggle(item)}
                      />
                    ))}
                  </div>
                )}
                {tab === "explore" && (
                  <div className="pager">
                    <button
                      className="ghost"
                      disabled={page === 1}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      ← {text.previous}
                    </button>
                    <span>
                      {text.page} {page}
                    </span>
                    <button
                      className="ghost"
                      disabled={!result?.hasNext}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      {text.next} →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
      <footer>
        <p>{tab === "explore" && !detail ? result?.note || text.note : text.local}</p>
        <p>{text.attribution}</p>
        <span>Bangumi / AniList / TMDB / Kitsu</span>
        <p className="tmdb-credit">
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
      </footer>
    </div>
  );
}
