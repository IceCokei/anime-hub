const NETWORK = "网络连接失败，请重试。";

/**
 * Reads JSON without ever letting a non-JSON body surface as a parser error.
 * Retries once when the failure looks transient (network / HTML body).
 */
export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  let message = "加载失败";
  for (let attempt = 0; attempt < 2; attempt++) {
    let retry = true;
    try {
      const target =
        attempt === 0
          ? url
          : `${url}${url.includes("?") ? "&" : "?"}_r=${Date.now()}`;
      const response = await fetch(target, init);
      const text = await response.text();
      let payload: unknown = null;
      let parsed = false;
      try {
        payload = JSON.parse(text);
        parsed = true;
      } catch {}
      if (!response.ok) {
        retry = response.status === 429 || response.status >= 500;
        const detail = parsed ? (payload as { error?: string })?.error : "";
        throw new Error(
          detail || `加载失败（HTTP ${response.status}），请稍后重试。`,
        );
      }
      if (!parsed)
        throw new Error("服务器返回了非 JSON 内容，请重新加载或稍后再试。");
      return payload as T;
    } catch (cause) {
      const error = cause as Error;
      if (error?.name === "AbortError") throw cause;
      message = error?.message || NETWORK;
      if (!retry || attempt === 1) break;
    }
  }
  throw new Error(message);
}
