"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import type { Anime } from "@/lib/types";

export function Poster({ anime }: { anime: Anime }) {
  const [failed, setFailed] = useState(false);
  return anime.image && !failed ? (
    <img
      src={anime.image}
      alt={anime.title}
      loading="lazy"
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
