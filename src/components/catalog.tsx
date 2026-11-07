"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Compass,
  ExternalLink,
  Film,
  Globe2,
  Moon,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  X,
} from "lucide-react";
import {
  sources,
  type Anime,
  type CatalogResult,
  type DetailData,
  type Source,
} from "@/lib/types";

const STORAGE_KEY = "anime-hub:watchlist:v1";
function Poster({ anime }: { anime: Anime }) {
  const [failed, setFailed] = useState(false);
  return anime.image && !failed ? (
    <img
      src={anime.image}
      alt={anime.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="poster-fallback">
      <Film size={30} />
      <span>{anime.title}</span>
    </div>
  );
}
function CreditRow({ person }: { person: DetailData["credits"][number] }) {
  return (
    <li>
      <span className="credit-avatar">
        {person.image ? (
          <img
            src={person.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          person.name.slice(0, 1)
        )}
      </span>
      <span className="credit-name">{person.name}</span>
      <span className="credit-role">{person.role}</span>
    </li>
  );
}

function RelatedGrid({
  items,
  onPick,
}: {
  items: Anime[];
  onPick: (item: Anime) => void;
}) {
  return (
    <div className="related-grid">
      {items.map((item) => (
        <button key={item.id} onClick={() => onPick(item)}>
          <span className="related-poster">
            <Poster anime={item} />
          </span>
          <span className="related-title">{item.title}</span>
          <span className="related-meta">
            {item.score?.toFixed(1) || "—"} · {item.year || "—"}
          </span>
        </button>
      ))}
    </div>
  );
}

const PROVIDER_KINDS = [
  { key: "flatrate", label: "订阅" },
  { key: "rent", label: "租借" },
  { key: "buy", label: "购买" },
] as const;

function Detail({
  anime,
  saved,
  toggle,
  close,
  onPick,
}: {
  anime: Anime;
  saved: boolean;
  toggle: () => void;
  close: () => void;
  onPick: (item: Anime) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("reviews");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setDetail(null);
    setError("");
    setTab("reviews");
    dialog.current?.scrollTo({ top: 0 });
    fetch(`/api/detail?id=${encodeURIComponent(anime.id)}&locale=zh`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "详情加载失败");
        if (!controller.signal.aborted) setDetail(data as DetailData);
      })
      .catch((cause) => {
        if (!controller.signal.aborted && cause.name !== "AbortError")
          setError(cause.message || "详情加载失败");
      });
    return () => controller.abort();
  }, [anime.id]);
  const tabs = detail
    ? [
        { key: "reviews", label: "评论", count: detail.reviews.length },
        { key: "watch", label: "观看渠道", count: detail.providers.length },
        { key: "credits", label: "演职员", count: detail.credits.length },
        {
          key: "recommendations",
          label: "推荐",
          count: detail.recommendations.length,
        },
        { key: "similar", label: "相似", count: detail.similar.length },
        { key: "images", label: "图集", count: detail.images.length },
        { key: "videos", label: "视频", count: detail.videos.length },
      ].filter((item) => item.count > 0)
    : [];
  const active = tabs.some((item) => item.key === tab)
    ? tab
    : tabs[0]?.key || "";
  const genres = detail?.genres.length ? detail.genres : anime.tags;
  return (
    <dialog
      ref={dialog}
      className="detail-dialog"
      onCancel={close}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
      aria-labelledby="detail-title"
    >
      <button
        className="icon-button close"
        aria-label="关闭详情"
        onClick={close}
      >
        <X size={20} />
      </button>
      <div className={`detail-banner${detail?.backdrop ? "" : " is-poster"}`}>
        <img
          src={detail?.backdrop || anime.image}
          alt=""
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="detail-body">
        <aside className="detail-poster-lg">
          <Poster anime={anime} />
        </aside>
        <article>
          <span className="eyebrow">
            {sources[anime.source]} · {anime.format}
            {anime.year ? ` · ${anime.year}` : ""}
          </span>
          <h2 id="detail-title">{anime.title}</h2>
          {anime.originalTitle && (
            <p className="detail-original">{anime.originalTitle}</p>
          )}
          <div className="detail-badges">
            <span className="rating-badge">
              <Star size={12} fill="currentColor" />
              {anime.score?.toFixed(1) || "暂无评分"}
            </span>
            <span className="muted">
              {anime.votes == null
                ? "评分人数未提供"
                : `${anime.votes.toLocaleString()} 人评分`}
            </span>
            {detail?.date && <span className="muted">{detail.date}</span>}
            {detail?.runtime && <span className="muted">{detail.runtime}</span>}
          </div>
          {genres.length > 0 && (
            <div className="tags">
              {genres.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
          {detail?.tagline && <p className="tagline">{detail.tagline}</p>}
          <p className="synopsis">{anime.summary || "数据源暂未提供简介。"}</p>
          <div className="detail-actions">
            <button className="primary" onClick={toggle}>
              {saved ? <Check size={16} /> : <Bookmark size={16} />}
              {saved ? "已加入片单" : "加入想看"}
            </button>
            <a
              className="button"
              href={anime.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              来源条目 <ExternalLink size={15} />
            </a>
          </div>
        </article>
      </div>
      {error && (
        <p className="detail-status error" role="alert">
          {error}
        </p>
      )}
      {!detail && !error && (
        <p className="detail-status" aria-busy="true">
          正在加载详情…
        </p>
      )}
      {detail && tabs.length > 0 && (
        <>
          <div className="detail-tabs" role="tablist" aria-label="详情分区">
            {tabs.map((item) => (
              <button
                key={item.key}
                id={`detail-tab-${item.key}`}
                role="tab"
                aria-selected={active === item.key}
                onClick={() => setTab(item.key)}
              >
                {item.label}
                <span className="tab-count">{item.count}</span>
              </button>
            ))}
          </div>
          <div
            className="detail-panel"
            role="tabpanel"
            aria-labelledby={`detail-tab-${active}`}
          >
            {active === "reviews" && (
              <ul className="review-list">
                {detail.reviews.map((review, index) => (
                  <li key={`${review.author}-${index}`}>
                    <div className="review-head">
                      <strong>{review.author}</strong>
                      {review.rating != null && (
                        <span className="rating-badge">
                          <Star size={11} fill="currentColor" />
                          {review.rating.toFixed(1)}
                        </span>
                      )}
                      <span className="muted">{review.date}</span>
                    </div>
                    <p>{review.content}</p>
                    {review.url && (
                      <a
                        className="review-link"
                        href={review.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        查看原文 <ExternalLink size={12} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {active === "watch" && (
              <div className="provider-columns">
                {PROVIDER_KINDS.map((kind) => {
                  const list = detail.providers.filter(
                    (provider) => provider.kind === kind.key,
                  );
                  return (
                    <section key={kind.key}>
                      <h3>{kind.label}</h3>
                      {list.length === 0 ? (
                        <p className="detail-unavailable">
                          <X size={13} /> 暂不可用
                        </p>
                      ) : (
                        <ul className="provider-list">
                          {list.map((provider) => (
                            <li key={`${kind.key}-${provider.name}`}>
                              {provider.logo ? (
                                <img
                                  src={provider.logo}
                                  alt=""
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="provider-dot">
                                  {provider.name.slice(0, 1)}
                                </span>
                              )}
                              {provider.url ? (
                                <a
                                  href={provider.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {provider.name}
                                </a>
                              ) : (
                                provider.name
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
            {active === "credits" && (
              <ul className="credit-list">
                {detail.credits.map((person, index) => (
                  <CreditRow key={`${person.name}-${index}`} person={person} />
                ))}
              </ul>
            )}
            {active === "recommendations" && (
              <RelatedGrid items={detail.recommendations} onPick={onPick} />
            )}
            {active === "similar" && (
              <RelatedGrid items={detail.similar} onPick={onPick} />
            )}
            {active === "images" && (
              <div className="image-grid">
                {detail.images.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
            )}
            {active === "videos" && (
              <div className="video-grid">
                {detail.videos.map((video) => (
                  <figure key={video.key}>
                    <iframe
                      src={`https://www.youtube.com/embed/${video.key}?rel=0&modestbranding=1`}
                      title={video.name}
                      loading="lazy"
                      allowFullScreen
                    />
                    <figcaption>
                      {video.name}
                      {video.name === video.type ? "" : ` · ${video.type}`}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </dialog>
  );
}
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
  const [selected, setSelected] = useState<Anime | null>(null);
  const [saved, setSaved] = useState<Anime[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [dark, setDark] = useState(true);
  const [storageMessage, setStorageMessage] = useState("");
  useEffect(() => {
    try {
      const list: unknown = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]",
      );
      if (Array.isArray(list))
        setSaved(
          list.filter(
            (item): item is Anime =>
              item &&
              typeof item.id === "string" &&
              typeof item.title === "string" &&
              Object.hasOwn(sources, item.source) &&
              Array.isArray(item.tags) &&
              typeof item.url === "string" &&
              item.url.startsWith("https://"),
          ),
        );
      const theme = localStorage.getItem("anime-hub:theme");
      if (theme === "light") setDark(false);
    } catch {
      setStorageMessage("浏览器存储不可用，片单仅在本次访问中保留。");
    }
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
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
    fetch(`/api/anime?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "加载失败");
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setStorageMessage("无法保存到浏览器，片单仅在本次访问中保留。");
    }
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
      <header className="header">
        <a href="/" className="brand" aria-label="映番首页">
          <span className="brand-mark">
            <Clapperboard size={23} />
          </span>
          映番
          <span className="brand-divider" />
          <span className="brand-sub">ANIME JOURNAL</span>
        </a>
        <nav aria-label="主导航">
          <button
            className={!showSaved ? "nav-active" : ""}
            onClick={() => setShowSaved(false)}
          >
            <Compass size={16} />
            发现
          </button>
          <button
            className={showSaved ? "nav-active" : ""}
            onClick={() => setShowSaved(true)}
          >
            <Bookmark size={16} />
            我的片单<span className="count">{saved.length}</span>
          </button>
        </nav>
        <button
          className="icon-button theme-button"
          aria-label={dark ? "切换浅色主题" : "切换深色主题"}
          onClick={() => {
            setDark(!dark);
            try {
              localStorage.setItem("anime-hub:theme", dark ? "light" : "dark");
            } catch {}
          }}
        >
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </header>
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
            {Array.from({ length: 24 }, (_, index) => (
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
                      <button
                        className="poster-open"
                        onClick={() => setSelected(anime)}
                        aria-label={`查看 ${anime.title}`}
                      >
                        <Poster anime={anime} />
                        <span className="poster-shade" />
                        <span className="poster-format">{anime.format}</span>
                        <span className="poster-detail">
                          查看详情 <ArrowRight size={15} />
                        </span>
                      </button>
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
                      <button onClick={() => setSelected(anime)}>
                        {anime.title}
                      </button>
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
      <footer>
        <span className="footer-brand">
          <Clapperboard size={16} />
          映番 <span>记录热爱，发现故事。</span>
        </span>
        <span>资料来自 Bangumi · AniList · TMDB · Kitsu</span>
        <a
          href="https://github.com/plotwist-app/plotwist"
          target="_blank"
          rel="noopener noreferrer"
        >
          UI adapted from Plotwist <ExternalLink size={12} />
        </a>
      </footer>
      {selected && (
        <Detail
          anime={selected}
          saved={saved.some((item) => item.id === selected.id)}
          toggle={() => toggleSaved(selected)}
          close={() => setSelected(null)}
          onPick={setSelected}
        />
      )}
    </div>
  );
}
