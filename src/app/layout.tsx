import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "映番 · 发现下一部好动画",
  description:
    "An English and Chinese animation catalogue powered by Bangumi, AniList, TMDB and Kitsu.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
