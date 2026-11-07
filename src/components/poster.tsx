"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import type { Anime } from "@/lib/types";

export function Poster({
  anime,
  priority = false,
}: {
  anime: Anime;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return anime.image && !failed ? (
    <img
      src={anime.image}
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
