"use client";

import { useEffect, useRef, useState } from "react";
import { copy, type Locale } from "@/lib/i18n";
import {
  sources,
  type Anime,
  type CatalogResult,
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
function Artwork({ item }: { item: Anime }) {
  const [failed, setFailed] = useState(false);
  return item.image.startsWith("https://") && !failed ? (
    <img
      src={item.image}
      alt={item.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="artwork-placeholder" aria-hidden="true">
      AH
    </div>
  );
}
function Details({
  item,
  locale,
  saved,
  toggle,
  close,
}: {
  item: Anime;
  locale: Locale;
  saved: boolean;
  toggle: () => void;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const text = copy[locale];
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="detail-title"
      onCancel={close}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
    >
      <button className="dialog-close" aria-label={text.close} onClick={close}>
        ×
      </button>
      <div className="detail-grid">
        <div className="detail-art">
          <Artwork item={item} />
        </div>
        <section>
          <p className="overline">
            {sources[item.source]} / {item.year || text.unknownYear}
          </p>
          <h2 id="detail-title">{item.title}</h2>
          <p className="secondary">
            {text.original}: {item.originalTitle}
          </p>
          <p className="detail-rating">
            ★ {item.score?.toFixed(1) || text.noRating}{" "}
            <small>
              {item.votes === null
                ? text.noVotes
                : `${item.votes.toLocaleString(locale)} ${text.votes}`}
            </small>
          </p>
          <div className="tag-list">
            {item.tags.map((tag, index) => (
              <span key={`${tag}-${index}`}>{tag}</span>
            ))}
          </div>
          <p className="synopsis">{item.summary || text.noSummary}</p>
          <div className="actions">
            <button className="solid" onClick={toggle}>
              {saved ? text.remove : text.save}
            </button>
            <a
              className="outline"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {text.visit} ↗
            </a>
          </div>
        </section>
      </div>
    </dialog>
  );
}
export function Catalog() {
  const [locale, setLocale] = useState<Locale>("en");
  const [dark, setDark] = useState(false);
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
      if (localStorage.getItem("anime-hub:locale") === "zh") setLocale("zh");
      setDark(localStorage.getItem("anime-hub:theme") === "dark");
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
  function selectSource(value: Source) {
    setSource(value);
    setPage(1);
    if (value === "kitsu") setCountry("");
    if (value.startsWith("tmdb")) {
      setSearch("");
      setDraft("");
    }
  }
  const items = tab === "saved" ? saved : result?.items || [];
  return (
    <div className="workspace">
      <aside className="rail">
        <a className="identity" href="/">
          <span className="monogram">
            ah<span>●</span>
          </span>
          <strong>{text.brand}</strong>
        </a>
        <p className="rail-caption">{text.tagline}</p>
        <nav aria-label={locale === "zh" ? "主导航" : "Main navigation"}>
          <button
            className={tab === "explore" ? "selected" : ""}
            onClick={() => setTab("explore")}
          >
            <span>01</span>
            {text.explore}
            <b>↗</b>
          </button>
          <button
            className={tab === "saved" ? "selected" : ""}
            onClick={() => setTab("saved")}
          >
            <span>02</span>
            {text.saved}
            <b>{saved.length}</b>
          </button>
        </nav>
        <div className="rail-bottom">
          <label>
            {text.language}
            <select
              aria-label="Language / 语言"
              value={locale}
              onChange={(event) => {
                const next = event.target.value as Locale;
                setLocale(next);
                persist("anime-hub:locale", next);
              }}
            >
              <option value="en">English</option>
              <option value="zh">简体中文</option>
            </select>
          </label>
          <button
            className="outline"
            aria-label={text.theme}
            onClick={() => {
              setDark(!dark);
              persist("anime-hub:theme", dark ? "light" : "dark");
            }}
          >
            <span aria-hidden="true">{dark ? "☀" : "◐"}</span>
            <span className="theme-label"> {text.theme}</span>
          </button>
          <small>OPEN CATALOGUE / 01</small>
        </div>
      </aside>
      <main className="content">
        <header className="masthead">
          <span className="overline">ANIMATION, WITHOUT BORDERS</span>
          <span className="edition">THE DISCOVERY EDITION</span>
        </header>
        <section className="introduction">
          <p className="overline">
            {tab === "saved" ? text.local : text.explore}
          </p>
          <h1>{tab === "saved" ? text.savedHeading : text.heading}</h1>
          <p>{text.intro}</p>
        </section>
        {tab === "explore" && (
          <section className="controls" aria-label={text.search}>
            <div className="source-select">
              <span className="control-label">{text.source}</span>
              <div role="group" aria-label={text.source}>
                {Object.entries(sources).map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={source === value}
                    onClick={() => selectSource(value as Source)}
                  >
                    {locale === "zh" && value === "tmdb-tv"
                      ? "TMDB 剧集"
                      : locale === "zh" && value === "tmdb-movie"
                        ? "TMDB 电影"
                        : label}
                  </button>
                ))}
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(draft.trim());
                setPage(1);
              }}
            >
              <label className="search-box">
                <span className="sr-only">{text.search}</span>
                <input
                  value={draft}
                  maxLength={100}
                  disabled={tmdb}
                  placeholder={
                    tmdb ? text.discoverOnly : text.searchPlaceholder
                  }
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
              <button className="solid" disabled={tmdb}>
                {text.searchButton} ↗
              </button>
            </form>
            <div className="filter-row">
              <label>
                {text.country}
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
              </label>
              <label>
                {text.score}
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
              </label>
              <label>
                {text.sort}
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
              </label>
            </div>
          </section>
        )}
        <div className="result-heading">
          <h2>{tab === "saved" ? text.saved : search || sources[source]}</h2>
          <span>
            {tab === "saved"
              ? `${saved.length} ${text.titles}`
              : result?.total != null
                ? `${result.total.toLocaleString(locale)} ${text.titles}`
                : text.explore}
          </span>
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
              <div className="collection">
                {items.map((item) => (
                  <article className="entry" key={item.id}>
                    <button
                      className="artwork"
                      aria-label={`${text.details}: ${item.title}`}
                      onClick={() => setDetail(item)}
                    >
                      <Artwork item={item} />
                      <span className="score-chip">
                        {item.score ? `★ ${item.score.toFixed(1)}` : "—"}
                      </span>
                    </button>
                    <div className="entry-copy">
                      <p className="entry-meta">
                        {item.year || "—"} /{" "}
                        {item.format === "Animation"
                          ? text.animation
                          : item.format}
                      </p>
                      <button
                        className="entry-title"
                        onClick={() => setDetail(item)}
                      >
                        {item.title}
                      </button>
                      <button
                        className="save-link"
                        aria-pressed={saved.some(
                          (entry) => entry.id === item.id,
                        )}
                        onClick={() => toggle(item)}
                      >
                        {saved.some((entry) => entry.id === item.id)
                          ? `✓ ${text.remove}`
                          : `+ ${text.save}`}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {tab === "explore" && (
              <div className="pager">
                <button
                  className="outline"
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  ← {text.previous}
                </button>
                <span>
                  {text.page} {page}
                </span>
                <button
                  className="outline"
                  disabled={!result?.hasNext}
                  onClick={() => setPage((value) => value + 1)}
                >
                  {text.next} →
                </button>
              </div>
            )}
          </>
        )}
        <footer>
          <p>{tab === "explore" ? result?.note || text.note : text.local}</p>
          <p>{text.attribution}</p>
          <span>Bangumi / AniList / TMDB / Kitsu</span>
          <p className="tmdb-credit">
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </p>
        </footer>
      </main>
      {detail && (
        <Details
          item={detail}
          locale={locale}
          saved={saved.some((item) => item.id === detail.id)}
          toggle={() => toggle(detail)}
          close={() => setDetail(null)}
        />
      )}
    </div>
  );
}
