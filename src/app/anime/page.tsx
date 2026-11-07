import { Suspense } from "react";
import type { Metadata } from "next";
import { AnimeDetail } from "@/components/anime-detail";

export const metadata: Metadata = {
  title: "作品详情 · 映番",
  description: "动画的简介、演职员、推荐、图集与观看渠道。",
};

export default function AnimePage() {
  return (
    <Suspense
      fallback={<p className="site-shell detail-status">正在加载详情…</p>}
    >
      <AnimeDetail />
    </Suspense>
  );
}
