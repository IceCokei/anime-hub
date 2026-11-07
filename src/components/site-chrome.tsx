"use client";

import { useEffect, useState } from "react";
import {
  Bookmark,
  Clapperboard,
  Compass,
  ExternalLink,
  Moon,
  Sun,
  Trophy,
} from "lucide-react";
import { THEME_KEY } from "@/lib/watchlist";

type HeaderProps = {
  active: "discover" | "ranking" | "saved";
  savedCount?: number;
  onDiscover?: () => void;
  onSaved?: () => void;
};

export function SiteHeader({
  active,
  savedCount = 0,
  onDiscover,
  onSaved,
}: HeaderProps) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem(THEME_KEY) === "light") setDark(false);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  return (
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
        {onDiscover ? (
          <button
            className={active === "discover" ? "nav-active" : ""}
            onClick={onDiscover}
          >
            <Compass size={16} />
            发现
          </button>
        ) : (
          <a className={active === "discover" ? "nav-active" : ""} href="/">
            <Compass size={16} />
            发现
          </a>
        )}
        <a className={active === "ranking" ? "nav-active" : ""} href="/ranking">
          <Trophy size={16} />
          排行榜
        </a>
        {onSaved && (
          <button
            className={active === "saved" ? "nav-active" : ""}
            onClick={onSaved}
          >
            <Bookmark size={16} />
            我的片单<span className="count">{savedCount}</span>
          </button>
        )}
      </nav>
      <button
        className="icon-button theme-button"
        aria-label={dark ? "切换浅色主题" : "切换深色主题"}
        onClick={() => {
          setDark(!dark);
          try {
            localStorage.setItem(THEME_KEY, dark ? "light" : "dark");
          } catch {}
        }}
      >
        {dark ? <Sun size={19} /> : <Moon size={19} />}
      </button>
    </header>
  );
}

export function SiteFooter() {
  return (
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
  );
}
