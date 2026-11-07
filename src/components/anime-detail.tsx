"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ExternalLink,
  Star,
  X,
} from "lucide-react";
import { Poster } from "./poster";
import { fetchJson } from "@/lib/client";
import { SiteFooter, SiteHeader } from "./site-chrome";
import { loadWatchlist, writeWatchlist } from "@/lib/watchlist";
import {
  sources,
  type Anime,
  type DetailData,
  type DetailResult,
} from "@/lib/types";

const PROVIDER_KINDS = [
  { key: "flatrate", label: "订阅" },
  { key: "rent", label: "租借" },
  { key: "buy", label: "购买" },
] as const;

type Origin = "discover" | "ranking";
const detailLink = (item: Anime, from: Origin) =>
  `/anime?id=${encodeURIComponent(item.id)}${from === "ranking" ? "&from=ranking" : ""}`;

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

function RelatedGrid({ items, from }: { items: Anime[]; from: Origin }) {
  return (
    <div className="related-grid">
      {items.map((item) => (
        <a key={item.id} href={detailLink(item, from)}>
          <span className="related-poster">
            <Poster anime={item} />
          </span>
          <span className="related-title">{item.title}</span>
          <span className="related-meta">
            {item.score?.toFixed(1) || "—"} · {item.year || "—"}
          </span>
        </a>
      ))}
    </div>
  );
}

export function AnimeDetail() {
  const params = useSearchParams();
  const id = params.get("id") || "";
  const from: Origin = params.get("from") === "ranking" ? "ranking" : "discover";
  const [data, setData] = useState<DetailResult | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("reviews");
  const [saved, setSaved] = useState<Anime[]>([]);

  useEffect(() => {
    setSaved(loadWatchlist());
  }, []);

  useEffect(() => {
    if (!id) {
      setError("缺少作品 ID，请返回目录重新选择。");
      return;
    }
    const controller = new AbortController();
    setData(null);
    setError("");
    setTab("reviews");
    fetchJson<DetailResult>(
      `/api/detail?id=${encodeURIComponent(id)}&locale=zh`,
      { signal: controller.signal },
    )
      .then((payload) => {
        if (!controller.signal.aborted) setData(payload);
      })
      .catch((cause) => {
        if (!controller.signal.aborted && cause.name !== "AbortError")
          setError(cause.message || "详情加载失败");
      });
    return () => controller.abort();
  }, [id]);

  const item = data?.item;
  const detail = data?.detail;

  useEffect(() => {
    if (item) document.title = `${item.title} · 映番`;
  }, [item]);

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
      ].filter((entry) => entry.count > 0)
    : [];
  const active = tabs.some((entry) => entry.key === tab)
    ? tab
    : tabs[0]?.key || "";
  const genres = detail?.genres.length ? detail.genres : item?.tags || [];
  const isSaved = Boolean(item && saved.some((entry) => entry.id === item.id));

  function toggleSaved(target: Anime) {
    const next = saved.some((entry) => entry.id === target.id)
      ? saved.filter((entry) => entry.id !== target.id)
      : [...saved, target];
    setSaved(next);
    writeWatchlist(next);
  }

  return (
    <div className="site-shell">
      <SiteHeader active={from} savedCount={saved.length} />
      <main className="detail-page">
        <a
          className="detail-back"
          href={from === "ranking" ? "/ranking" : "/"}
        >
          <ArrowLeft size={15} />
          {from === "ranking" ? "返回排行榜" : "返回目录"}
        </a>
        {!item ? (
          <p className={error ? "detail-status error" : "detail-status"}>
            {error || "正在加载详情…"}
          </p>
        ) : (
          <>
            <div
              className={`detail-banner${detail?.backdrop ? "" : " is-poster"}`}
            >
              <img
                src={detail?.backdrop || item.image}
                alt=""
                fetchPriority="high"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
            <section className="detail-wrap">
              <div className="detail-head">
                <aside className="detail-poster-lg">
                  <Poster anime={item} priority />
                </aside>
                <article>
                  <span className="eyebrow">
                    {sources[item.source]} · {item.format}
                    {item.year ? ` · ${item.year}` : ""}
                  </span>
                  <h1>{item.title}</h1>
                  {item.originalTitle && (
                    <p className="detail-original">{item.originalTitle}</p>
                  )}
                  <div className="detail-badges">
                    <span className="rating-badge">
                      <Star size={12} fill="currentColor" />
                      {item.score?.toFixed(1) || "暂无评分"}
                    </span>
                    <span className="muted">
                      {item.votes == null
                        ? "评分人数未提供"
                        : `${item.votes.toLocaleString()} 人评分`}
                    </span>
                    {detail?.date && (
                      <span className="muted">{detail.date}</span>
                    )}
                    {detail?.runtime && (
                      <span className="muted">{detail.runtime}</span>
                    )}
                  </div>
                  {genres.length > 0 && (
                    <div className="tags">
                      {genres.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                  {detail?.tagline && (
                    <p className="tagline">{detail.tagline}</p>
                  )}
                  <p className="synopsis">
                    {item.summary || "数据源暂未提供简介。"}
                  </p>
                  <div className="detail-actions">
                    <button
                      className="primary"
                      onClick={() => toggleSaved(item)}
                    >
                      {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
                      {isSaved ? "已加入片单" : "加入想看"}
                    </button>
                    <a
                      className="button"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      来源条目 <ExternalLink size={15} />
                    </a>
                  </div>
                </article>
              </div>
              {detail && tabs.length > 0 && (
                <>
                  <div
                    className="detail-tabs"
                    role="tablist"
                    aria-label="详情分区"
                  >
                    {tabs.map((entry) => (
                      <button
                        key={entry.key}
                        id={`detail-tab-${entry.key}`}
                        role="tab"
                        aria-selected={active === entry.key}
                        onClick={() => setTab(entry.key)}
                      >
                        {entry.label}
                        <span className="tab-count">{entry.count}</span>
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
                          <CreditRow
                            key={`${person.name}-${index}`}
                            person={person}
                          />
                        ))}
                      </ul>
                    )}
                    {active === "recommendations" && (
                      <RelatedGrid items={detail.recommendations} from={from} />
                    )}
                    {active === "similar" && (
                      <RelatedGrid items={detail.similar} from={from} />
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
                              {video.name === video.type
                                ? ""
                                : ` · ${video.type}`}
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
