"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { imageUrl } from "@/lib/image";
import type { Anime } from "@/lib/types";

export function Poster({
  anime,
  priority = false,
}: {
  anime: Anime;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl(anime.image);
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
