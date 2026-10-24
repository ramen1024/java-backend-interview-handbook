# 站点构建与部署

Markdown 正文仍是唯一内容源（`docs/*.md` + 根目录 `README.md`），站点是它的一个构建产物。

## 本地

```bash
npm install
npm run dev      # 开发预览，改 md 自动刷新
npm run build    # 产出 .vitepress/dist
npm run preview  # 预览构建结果
```

`dev` / `build` 前会自动跑 `scripts/prepare.mjs`（对应 `npm run data`），它做四件事：

1. 给每章 H2 注入 `{#s1}`、每题 H3 注入 `{#q1}` 锚点，让题目可被单独分享；
2. 从「三、高频面试题清单」表格抽出 `questions.json` 数据；
3. 按 H1/H2 生成侧边栏；
4. 由 `README.md` 生成 `docs/index.md`（改写其中的 `docs/xx.md` 链接）。

因此 **`docs/index.md`、`.vitepress/data/` 是生成物，不要手改**，改 README 或脚本即可。

## 部署到 Cloudflare Pages（推荐）

1. Cloudflare 控制台 → Workers & Pages → Create → Pages → Connect to Git；
2. 选 `ramen1024/java-backend-interview-handbook`（私有仓库需授权一次，产物仍公开）；
3. 构建配置：
   - Framework preset：`None`
   - Build command：`npm run build`
   - Build output directory：`.vitepress/dist`
   - 环境变量：`NODE_VERSION=22`
4. 之后每次 push 到 `main` 自动重新构建；自定义域名在 Pages 的 Custom domains 里绑定，免备案。

`cleanUrls: true` 已开启，URL 形如 `/ch04-jvm`、`/questions`，Cloudflare Pages 默认支持。

## 备选：GitHub Pages

私有仓库发布 Pages 需要付费账户（Pro 及以上），且站点必然公开。在仓库根目录加 `.github/workflows/deploy.yml`：

```yaml
name: deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: .vitepress/dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
```

若部署在 `https://<user>.github.io/<repo>/` 这类子路径，需要在 `.vitepress/config.mts` 增加 `base: '/<repo>/'`，否则静态资源 404。

## 写作时的两个坑

- **正文里出现双花括号**（如 `{{ put("a", 1); }}`）会被 Vue 当成插值表达式导致构建失败，用 `<code v-pre>...</code>` 包住。
- **新增章节**要同时在 `scripts/prepare.mjs` 的 `CHAPTERS` 和 `.vitepress/config.mts` 的 `rewrites` 里加一条映射（中文文件名 → ASCII 路由），两处必须一致，否则构建报死链。

## 已知取舍

- 单章最长 154 KB（`04-JVM`），保留「一章一页 + 题目锚点」，没有拆成一题一页：拆分会让交叉引用与上下文断裂，收益不抵成本。
- 搜索用 VitePress 内置 minisearch，中文靠 `Intl.Segmenter` 分词（Safari 16.4+/Chrome 87+ 支持）。若目标读者浏览器过旧，改用 `vitepress-plugin-pagefind`。
