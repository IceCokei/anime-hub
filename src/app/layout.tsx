import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Anime Hub · Explore animation",
  description:
    "An English and Chinese animation catalogue powered by Bangumi, AniList, TMDB and Kitsu.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
