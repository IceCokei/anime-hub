import type { Metadata } from "next";
import { Ranking } from "@/components/ranking";

export const metadata: Metadata = {
  title: "排行榜 · 映番",
  description: "按评分排列的动画排行榜，数据来自 Bangumi、豆瓣、Kitsu 和 TMDB。",
};

export default function RankingPage() {
  return <Ranking />;
}
