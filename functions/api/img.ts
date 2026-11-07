// Pages supplies the Workers Response implementation at runtime.
declare const Response: typeof import("@cloudflare/workers-types").Response;
import type { PagesFunction } from "@cloudflare/workers-types";

const ALLOWED = ["doubanio.com", "douban.com"];

const allowed = (hostname: string) =>
  ALLOWED.some((host) => hostname === host || hostname.endsWith(`.${host}`));

export const onRequestGet: PagesFunction = async ({ request }) => {
  const raw = new URL(request.url).searchParams.get("u") || "";
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("bad image url", { status: 400 });
  }
  if (target.protocol !== "https:" || !allowed(target.hostname))
    return new Response("host not allowed", { status: 403 });

  const upstream = await fetch(target.toString(), {
    headers: {
      Referer: "https://m.douban.com/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
    },
  });
  if (!upstream.ok)
    return new Response(`upstream ${upstream.status}`, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
