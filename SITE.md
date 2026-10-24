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

## 部署到 GitHub Pages（当前方案）

仓库已公开，站点地址：`https://ramen1024.github.io/java-backend-interview-handbook/`。

- 工作流：`.github/workflows/deploy.yml`，push 到 `main` 自动构建并部署，也可在 Actions 页手动触发。
- 项目站点部署在 `/<repo>/` 子路径，工作流里通过 `DOCS_BASE` 注入 `base`；本地不设置时默认 `/`，所以本地预览地址仍是 `http://localhost:4173/`。
- 首次部署需在仓库 Settings → Pages 把 Source 设为 **GitHub Actions**（已通过 API 设置，换仓库时要注意）。
- `cleanUrls: true` 依赖 Pages 对 `/ch04-jvm` 映射到 `ch04-jvm.html`，GitHub Pages 支持；若哪天失效，去掉该项即可。

### 本地复现 CI 构建

Git Bash 会把 `/xxx/` 形式的环境变量当路径转换成 Windows 路径，必须关掉转换：

```bash
MSYS2_ENV_CONV_EXCL=DOCS_BASE DOCS_BASE=/java-backend-interview-handbook/ npm run build
```

CI 跑在 Ubuntu 上，没有这个问题。

## 备选：Cloudflare Pages

若之后想换国内访问更快的线路，Cloudflare 同样吃这个仓库：

- Build command：`npm run build`
- Build output directory：`.vitepress/dist`
- 环境变量：`NODE_VERSION=22`，且**不要**设 `DOCS_BASE`（根路径部署）

换到根路径部署时，记得移除或清空 `DOCS_BASE`，否则资源会去 `/java-backend-interview-handbook/assets/...` 找。

## 写作时的两个坑

- **正文里出现双花括号**（如 `{{ put("a", 1); }}`）会被 Vue 当成插值表达式导致构建失败，用 `<code v-pre>...</code>` 包住。
- **新增章节**要同时在 `scripts/prepare.mjs` 的 `CHAPTERS` 和 `.vitepress/config.mts` 的 `rewrites` 里加一条映射（中文文件名 → ASCII 路由），两处必须一致，否则构建报死链。

## 已知取舍

- 单章最长 154 KB（`04-JVM`），保留「一章一页 + 题目锚点」，没有拆成一题一页：拆分会让交叉引用与上下文断裂，收益不抵成本。
- 搜索用 VitePress 内置 minisearch，中文靠 `Intl.Segmenter` 分词（Safari 16.4+/Chrome 87+ 支持）。若目标读者浏览器过旧，改用 `vitepress-plugin-pagefind`。
