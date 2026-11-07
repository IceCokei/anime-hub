# 映番 Anime Hub

[English](#anime-hub) · [简体中文](#简体中文)

A small Chinese-language animation catalogue (映番) built with Next.js, React and Cloudflare Pages Functions.

- Browse Bangumi, Douban, Kitsu, TMDB TV and TMDB Movies.
- Search, filter by country and score, and paginate through results.
- Read title details and keep a watchlist in your browser.
- Switch between light and dark themes.
- Keep optional API credentials in Cloudflare runtime secrets, outside the browser bundle.

## Run locally

Use **Node.js 22 or newer**.

```sh
npm ci
npm run dev
```

Open http://localhost:8788. This builds the static Next.js frontend and starts the actual Pages Functions runtime. To rebuild after editing frontend code, stop and run the command again.

For optional local TMDB access, create an **untracked** `.dev.vars` file containing `TMDB_READ_TOKEN` or `TMDB_API_KEY`. Never commit credentials. No credentials are required for Bangumi, Douban or Kitsu.

## Deploy from GitHub to Cloudflare Pages

1. In Cloudflare **Workers & Pages**, create a **Pages** project and connect this GitHub repository.
2. Choose the `main` production branch and the **None** framework preset.
3. Set the build command to `npm run build`, output directory to `out`, and leave the root directory empty.
4. Set `NODE_VERSION=22` in build environment variables if the build image does not already use Node.js 22+.
5. Under the Pages project's **Settings → Variables and Secrets**, add `TMDB_READ_TOKEN` as an encrypted secret. Alternatively, use `TMDB_API_KEY`. Configure production and preview separately as needed, then redeploy.

`functions/api/anime.ts` handles `/api/anime`. It reads credentials from `context.env` at request time. The frontend is a static export and requires **no API keys during compilation**. Do not prefix secrets with `NEXT_PUBLIC_` and do not place values in `wrangler.jsonc`.

`wrangler.jsonc` contains only public build settings. Cloudflare automatically compiles the root `functions/` directory when building from Git. Use Git integration or Wrangler to deploy; a static-only drag-and-drop upload does not install the API function.

An optional CLI deployment is available after authenticating Wrangler and creating/selecting a Pages project:

```sh
npm run build
npm run deploy
```

## Checks

```sh
npm run typecheck
npm run build
npm run check:pages
npm audit
```

`check:pages` compiles the function bundle locally without deploying. Generated output, local test files, caches, credentials, editor settings and macOS metadata are excluded from Git. `package-lock.json`, `tsconfig.json`, `next.config.ts` and `wrangler.jsonc` are intentionally retained to make builds reproducible.

## Data-source behavior

| Source | Search | Country filter | Notes |
| --- | --- | --- | --- |
| Bangumi | Keywords | Community tags | Country tags are approximate; source titles may remain Japanese/Chinese. |
| Douban | Keywords (suggestions only) | Unavailable | Uses the 豆瓣 动画 tag feed; suggestions carry no rating, and the feed may block datacenter IPs. |
| TMDB TV / Movies | Discover filters only | Country code | Requires a secret; score ordering requires at least 50 ratings. |
| Kitsu | Keywords | Unavailable | Minimum score filters each fetched page, so an empty page may still have a next page. |

Each source has its own catalogue and rating system; results are not merged. Provider descriptions and tags are not machine-translated. Upstream quotas and network availability apply. No video playback, account system or cross-device watchlist sync is included.

## License and credits

The application code is licensed under [MIT](LICENSE).

**The visual layer is not MIT.** The layout and stylesheet are adapted from [Plotwist](https://github.com/plotwist-app/plotwist) and remain under the Plotwist Source Available License, kept here as [PLOTWIST-LICENSE](PLOTWIST-LICENSE); see [NOTICE.md](NOTICE.md) for the adapted files. That licence allows personal, academic and internal evaluation use only and does not permit commercial services; obtain separate permission before any commercial use. The project does not claim rights to provider data or artwork and does not use Plotwist trademarks as its brand.

Next.js and React are used under their respective MIT licenses; their license notices are distributed with installed packages. Metadata and artwork remain subject to each provider's terms and their rights holders' permissions. This product uses the TMDB API but is not endorsed or certified by TMDB.

Cloudflare references: [Next.js static export](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/), [Functions bindings and secrets](https://developers.cloudflare.com/pages/functions/bindings/).

## 简体中文

映番是一个中文动漫目录，使用 Next.js 静态导出与 Cloudflare Pages Functions。支持多个来源、搜索、产地与评分筛选、分页、详情、本地想看片单和深浅主题。

**运行：** Node.js 22+，执行 `npm ci && npm run dev`，访问 http://localhost:8788。前端修改后重新执行命令构建。

**Cloudflare Pages：** 关联 GitHub 仓库，选择 `main`，框架预设 `None`，构建命令 `npm run build`，输出目录 `out`，根目录留空。需要时设置构建变量 `NODE_VERSION=22`。

**密钥：** 在 Pages 项目的 Variables and Secrets 中添加加密的 `TMDB_READ_TOKEN` 或 `TMDB_API_KEY`，并重新部署。密钥由 Functions 在运行时读取，编译前端无需密钥。生产与预览环境分别设置。Bangumi、豆瓣、Kitsu 无需密钥。本地可使用被 Git 排除的 `.dev.vars`。

**许可：** 应用代码采用 MIT。**视觉层不属于 MIT**：布局与样式适配自 Plotwist，仍受其 Source Available 许可约束（见 `PLOTWIST-LICENSE` 与 `NOTICE.md`），仅限个人、学术和内部评估用途，商业化前须另行取得许可。动画资料和海报的权利不属于本项目，仍需遵守对应来源的条款。
