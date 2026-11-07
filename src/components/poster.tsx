"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import type { Anime } from "@/lib/types";

// Bangumi ships several sizes; the list only needs the small one.
const thumbUrl = (url: string) => url.replace("/pic/cover/l/", "/pic/cover/c/");

export function Poster({
  anime,
  priority = false,
  thumb = false,
}: {
  anime: Anime;
  priority?: boolean;
  thumb?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = thumb ? thumbUrl(anime.image) : anime.image;
  return src && !failed ? (
    <img
      src={src}
      alt={anime.title}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
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
