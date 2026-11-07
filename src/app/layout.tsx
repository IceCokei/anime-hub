import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "映番 · 发现下一部好动画",
  description: "从 Bangumi、豆瓣、TMDB 和 Kitsu 发现值得收藏的动画。",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <link rel="preconnect" href="https://lain.bgm.tv" crossOrigin="" />
        <link rel="preconnect" href="https://img3.doubanio.com" crossOrigin="" />
        <link rel="preconnect" href="https://m.douban.com" crossOrigin="" />
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="" />
        <link rel="preconnect" href="https://media.kitsu.app" crossOrigin="" />
        <link rel="dns-prefetch" href="https://lain.bgm.tv" />
        <link rel="dns-prefetch" href="https://img3.doubanio.com" />
        {children}
      </body>
    </html>
  );
}
