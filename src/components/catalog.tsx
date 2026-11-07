"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
} from "lucide-react";
import { Poster } from "./poster";
import { fetchJson } from "@/lib/client";
import { SiteFooter, SiteHeader } from "./site-chrome";
import { loadWatchlist, writeWatchlist } from "@/lib/watchlist";
import {
  sources,
  type Anime,
  type CatalogResult,
  type Source,
} from "@/lib/types";

const detailLink = (anime: Anime) => `/anime?id=${encodeURIComponent(anime.id)}`;

export function Catalog() {
  const [source, setSource] = useState<Source>("bangumi");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [sort, setSort] = useState("popular");
  const [minScore, setMinScore] = useState("0");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<CatalogResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [saved, setSaved] = useState<Anime[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  useEffect(() => {
    setSaved(loadWatchlist());
  }, []);
  useEffect(() => {
    if (showSaved) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setResult(null);
    const params = new URLSearchParams({
      source,
      search,
      country,
      sort,
      minScore,
      page: String(page),
      locale: "zh",
    });
    fetchJson<CatalogResult>(`/api/anime?${params}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) setResult(data);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause.message || "网络连接失败");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [source, search, country, sort, minScore, page, retry, showSaved]);
  function toggleSaved(anime: Anime) {
    const next = saved.some((item) => item.id === anime.id)
      ? saved.filter((item) => item.id !== anime.id)
      : [...saved, anime];
    setSaved(next);
    if (!writeWatchlist(next))
      setStorageMessage("无法保存到浏览器，片单仅在本次访问中保留。");
  }
  function changeSource(value: Source) {
    setSource(value);
    setPage(1);
    setShowSaved(false);
    if (value === "kitsu") setCountry("");
    if (value.startsWith("tmdb")) {
      setSearch("");
      setSearchInput("");
    }
  }
  const items = showSaved ? saved : result?.items || [];
  const busy = !showSaved && loading;
  return (
    <div className="site-shell">
      <SiteHeader
        active={showSaved ? "saved" : "discover"}
        savedCount={saved.length}
        onDiscover={() => setShowSaved(false)}
        onSaved={() => setShowSaved(true)}
      />
      <main>
        <section className="intro">
          <div>
            <div className="eyebrow">
              <span className="status-dot" /> YOUR NEXT GREAT STORY
            </div>
            <h1>{showSaved ? "留给下一次，心动。" : "好故事，值得被发现。"}</h1>
            <p>
              {showSaved
                ? "把想看的世界收进片单，随时回来继续探索。"
                : "从经典神作到新鲜国漫，找到属于你的下一部动画。"}
            </p>
          </div>
          <div className="intro-note">
            <Sparkles size={19} />
            <span>
              每一帧热爱
              <br />
              <strong>都有下一集</strong>
            </span>
          </div>
        </section>
        {!showSaved && (
          <>
            <div className="source-bar">
              <div className="source-label">
                <Globe2 size={15} />
                探索来源
              </div>
              <div className="source-tabs" role="group" aria-label="数据来源">
                {Object.entries(sources).map(([key, name]) => (
                  <button
                    className={source === key ? "active" : ""}
                    key={key}
                    onClick={() => changeSource(key as Source)}
                  >
                    {source === key && <span className="source-dot" />}
                    {name}
                  </button>
                ))}
              </div>
              <span className="source-hint">独立评分 · 自由探索</span>
            </div>
            <section className="toolbar" aria-label="搜索和筛选">
              <form
                className="search"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSearch(searchInput.trim());
                  setPage(1);
                }}
              >
                <Search size={18} />
                <input
                  aria-label="搜索动画"
                  placeholder={
                    source.startsWith("tmdb")
                      ? "TMDB 发现模式 · 使用右侧筛选"
                      : "搜索动画名称，开启一个新世界…"
                  }
                  value={searchInput}
                  disabled={source.startsWith("tmdb")}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
                <button
                  aria-label="提交搜索"
                  disabled={source.startsWith("tmdb")}
                >
                  <ArrowRight size={18} />
                </button>
              </form>
              <div className="filters">
                <label>
                  <Globe2 size={15} />
                  <select
                    aria-label="产地"
                    value={country}
                    disabled={source === "kitsu"}
                    onChange={(event) => {
                      setCountry(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">全部产地</option>
                    <option value="CN">中国 · 国漫</option>
                    <option value="JP">日本动画</option>
                  </select>
                </label>
                <label>
                  <Star size={15} />
                  <select
                    aria-label="最低评分"
                    value={minScore}
                    onChange={(event) => {
                      setMinScore(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="0">全部评分</option>
                    <option value="7">7 分以上</option>
                    <option value="8">8 分以上</option>
                    <option value="9">9 分以上</option>
                  </select>
                </label>
                <label>
                  <ArrowDownWideNarrow size={15} />
                  <select
                    aria-label="排序"
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="popular">最多人关注</option>
                    <option value="score">评分最高</option>
                  </select>
                </label>
              </div>
            </section>
          </>
        )}
        <div className="section-heading">
          <div>
            <h2>
              {showSaved
                ? "我的想看清单"
                : search
                  ? `“${search}” 的搜索结果`
                  : country === "CN"
                    ? "国漫，正在发光"
                    : sort === "score"
                      ? "经得起时间的好作品"
                      : "大家都在看"}
            </h2>
            <span>
              {showSaved
                ? `${items.length} 部已收藏`
                : `${sources[source]}${result?.total != null ? ` · ${result.total.toLocaleString()} 部作品` : " · 动画发现"}`}
            </span>
          </div>
          <span className="view-label">
            <SlidersHorizontal size={14} />
            {showSaved ? "保存在本机" : "精选动画目录"}
          </span>
        </div>
        {storageMessage && (
          <p role="status" className="notice">
            {storageMessage}
          </p>
        )}
        {busy ? (
          <div
            className="poster-grid"
            aria-label="正在加载动画"
            aria-busy="true"
          >
            {Array.from({ length: 16 }, (_, index) => (
              <div className="skeleton-card" key={index}>
                <div />
                <span />
                <small />
              </div>
            ))}
          </div>
        ) : error && !showSaved ? (
          <div className="empty" role="alert">
            <Globe2 size={32} />
            <h3>暂时没能抵达这个世界</h3>
            <p>{error}</p>
            <button
              className="primary"
              onClick={() => setRetry((value) => value + 1)}
            >
              重新加载
            </button>
          </div>
        ) : (
          <>
            {items.length === 0 ? (
              <div className="empty">
                <Bookmark size={32} />
                <h3>
                  {showSaved
                    ? "你的下一部好故事，还在路上"
                    : "没有找到匹配的动画"}
                </h3>
                <p>
                  {showSaved
                    ? "点击海报上的收藏按钮，把喜欢的动画加入想看。"
                    : "试试其他关键词、放宽筛选，或继续翻页。"}
                </p>
                {showSaved && (
                  <button
                    className="primary"
                    onClick={() => setShowSaved(false)}
                  >
                    去发现动画 <ArrowRight size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div className="poster-grid">
                {items.map((anime, index) => (
                  <article
                    className="anime-card"
                    key={anime.id}
                    style={{ animationDelay: `${Math.min(index, 11) * 25}ms` }}
                  >
                    <div className="poster-wrap">
                      <a
                        className="poster-open"
                        href={detailLink(anime)}
                        aria-label={`查看 ${anime.title}`}
                      >
                        <Poster anime={anime} priority={index < 8} />
                        <span className="poster-shade" />
                        <span className="poster-format">{anime.format}</span>
                        <span className="poster-detail">
                          查看详情 <ArrowRight size={15} />
                        </span>
                      </a>
                      <button
                        className={`save-button ${saved.some((item) => item.id === anime.id) ? "is-saved" : ""}`}
                        aria-label={`${saved.some((item) => item.id === anime.id) ? "取消收藏" : "收藏"} ${anime.title}`}
                        onClick={() => toggleSaved(anime)}
                      >
                        {saved.some((item) => item.id === anime.id) ? (
                          <Check size={17} />
                        ) : (
                          <Bookmark size={17} />
                        )}
                      </button>
                    </div>
                    <div className="card-title">
                      <a href={detailLink(anime)}>{anime.title}</a>
                      <span className="rating">
                        <Star size={11} fill="currentColor" />
                        {anime.score?.toFixed(1) || "—"}
                      </span>
                    </div>
                    <div className="card-meta">
                      <span>
                        {anime.year || "年份待定"} · {anime.format}
                      </span>
                      <span>
                        {anime.votes == null
                          ? sources[anime.source]
                          : `${anime.votes >= 10000 ? `${(anime.votes / 10000).toFixed(1)}万` : anime.votes} 人评分`}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {!showSaved && (
              <div className="pagination">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  <ChevronLeft size={16} />
                  上一页
                </button>
                <span>第 {page} 页</span>
                <button
                  disabled={!result?.hasNext}
                  onClick={() => setPage((value) => value + 1)}
                >
                  下一页
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
        {!showSaved && (
          <p className="data-note">
            {result?.note ||
              "评分来自当前数据源，统一显示为十分制；不同站点评分不直接比较。"}
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
