"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Poster } from "./poster";
import { fetchJson } from "@/lib/client";
import { byNewest } from "@/lib/sort";
import { SiteFooter, SiteHeader } from "./site-chrome";
import {
  sources,
  type CatalogResult,
  type Source,
} from "@/lib/types";

const PAGE_SIZE = 20;

export function Ranking() {
  const [source, setSource] = useState<Source>("bangumi");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<CatalogResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("src");
    if (requested && Object.hasOwn(sources, requested))
      setSource(requested as Source);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setResult(null);
    const params = new URLSearchParams({
      source,
      sort: "newest",
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
  }, [ready, source, page]);

  const items = byNewest(result?.items || []);
  const offset = (page - 1) * (items.length || PAGE_SIZE);

  return (
    <div className="site-shell">
      <SiteHeader active="ranking" />
      <main className="rank-page">
        <header className="rank-head">
          <h1>排行榜</h1>
          <p>
            按上映时间从新到旧排列，不跨来源合并。评分标准不同，不建议直接横向比较。
          </p>
        </header>
        <div className="source-bar">
          <div className="source-label">数据来源</div>
          <div className="source-tabs" role="group" aria-label="数据来源">
            {Object.entries(sources).map(([key, name]) => (
              <button
                className={source === key ? "active" : ""}
                key={key}
                onClick={() => {
                  setSource(key as Source);
                  setPage(1);
                }}
              >
                {source === key && <span className="source-dot" />}
                {name}
              </button>
            ))}
          </div>
          <span className="source-hint">
            {result?.total != null
              ? `${result.total.toLocaleString()} 部作品`
              : "评分排序"}
          </span>
        </div>
        {loading ? (
          <div className="rank-list" aria-busy="true" aria-label="正在加载排行榜">
            {Array.from({ length: 10 }, (_, index) => (
              <div className="rank-row rank-skeleton" key={index}>
                <div />
                <span />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="detail-status error" role="alert">
            {error}
          </p>
        ) : items.length === 0 ? (
          <p className="detail-status" role="status">
            这个来源暂时没有可排行的作品。
          </p>
        ) : (
          <ol className="rank-list">
            {items.map((item, index) => (
              <li key={item.id}>
                <a
                  className="rank-row"
                  href={`/anime?id=${encodeURIComponent(item.id)}&from=ranking&src=${item.source}`}
                >
                  <span className="rank-no">{offset + index + 1}</span>
                  <span className="rank-poster">
                    <Poster anime={item} priority={index < 8} />
                  </span>
                  <span className="rank-main">
                    <span className="rank-title">{item.title}</span>
                    <span className="rank-sub">
                      {[
                        item.originalTitle,
                        item.year,
                        item.format,
                        item.tags.slice(0, 3).join(" · "),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="rank-score">
                    <span className="rating-badge">
                      <Star size={11} fill="currentColor" />
                      {item.score?.toFixed(1) || "—"}
                    </span>
                    <small>
                      {item.votes == null
                        ? "人数未提供"
                        : `${item.votes.toLocaleString()} 人`}
                    </small>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        )}
        <div className="pagination">
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft size={16} />
            上一页
          </button>
          <span>第 {page} 页</span>
          <button
            disabled={!result?.hasNext || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            下一页
            <ChevronRight size={16} />
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
