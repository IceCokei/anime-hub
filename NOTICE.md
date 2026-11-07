# UI 来源

UI 布局和视觉规范适配自 https://github.com/plotwist-app/plotwist ，参考提交 `5d15dc3e9702e3663d1e01d623430b938f849462`。

参考文件：
- apps/web/src/components/animes-list/anime-list-content.tsx（六列/移动网格）
- apps/web/src/components/poster-card/poster-card.tsx（2:3 海报、圆角边框、标题年份）
- apps/web/src/components/header/header.tsx（顶部导航）
- packages/ui/src/globals.css（黑白深浅主题）

新项目将这些视觉结构实现为独立组件，不依赖原站账号、数据库和付费服务。保留上游许可于 PLOTWIST-LICENSE。上游许可仅允许个人、学术、内部评估用途，不允许用于商业服务；商业发布前需另行取得许可。本项目未使用 Plotwist 商标作为站点品牌。

动画图片和资料属于对应来源及其权利人。TMDB: This product uses the TMDB API but is not endorsed or certified by TMDB.
