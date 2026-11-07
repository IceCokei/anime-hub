import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "映番 · 发现下一部好动画",
  description: "从 Bangumi、AniList、TMDB 和 Kitsu 发现值得收藏的动画。",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
