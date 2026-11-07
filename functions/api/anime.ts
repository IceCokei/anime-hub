// Pages supplies the Workers Response implementation at runtime.
declare const Response: typeof import("@cloudflare/workers-types").Response;
import type { PagesFunction } from "@cloudflare/workers-types";
import {
  CatalogError,
  getCatalog,
  parseQuery,
  type CatalogEnv,
} from "../../src/lib/catalog";
import { translateApi } from "../../src/lib/i18n";

export const onRequestGet: PagesFunction<CatalogEnv> = async ({
  request,
  env,
}) => {
  const params = new URL(request.url).searchParams;
  const locale = params.get("locale") === "zh" ? "zh" : "en";
  try {
    const result = await getCatalog(parseQuery(params), env);
    return Response.json(
      {
        ...result,
        note: result.note ? translateApi(result.note, locale) : undefined,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof CatalogError
        ? error.message
        : "Unexpected source response. Please retry.";
    return Response.json(
      { error: translateApi(message, locale) },
      {
        status: error instanceof CatalogError ? error.status : 502,
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
};
