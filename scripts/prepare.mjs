/**
 * 把 docs/*.md 预处理成站点需要的数据：
 *   1. 为每章的 H2 注入 #sN 锚点、为每道题的 H3 注入 #qN 锚点（幂等）
 *   2. 从「三、高频面试题清单」表格抽取题库数据 -> .vitepress/data/questions.mjs
 *   3. 按 H1/H2 生成侧边栏 -> .vitepress/data/sidebar.mjs
 *   4. 由根目录 README.md 生成 docs/index.md，并改写其中的相对链接
 *
 * 由 package.json 的 predev / prebuild 自动调用，不手工运行也不会出错。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsDir = path.join(root, 'docs')
const dataDir = path.join(root, '.vitepress', 'data')

/** 中文文件名 -> URL 路由。改这里要同步改 .vitepress/config.mts 的 rewrites。 */
const CHAPTERS = [
  ['00-前置概念与术语.md', 'ch00-prereq'],
  ['01-Java基础.md', 'ch01-java-basics'],
  ['02-集合框架.md', 'ch02-collections'],
  ['03-并发与多线程.md', 'ch03-concurrency'],
  ['04-JVM.md', 'ch04-jvm'],
  ['05-设计模式.md', 'ch05-design-patterns'],
  ['06-数据结构与算法.md', 'ch06-dsa'],
  ['07-计算机网络与操作系统.md', 'ch07-network-os'],
  ['08-MySQL.md', 'ch08-mysql'],
  ['09-Redis.md', 'ch09-redis'],
  ['10-消息队列.md', 'ch10-mq'],
  ['11-Spring与SpringBoot.md', 'ch11-spring'],
  ['12-分布式与微服务.md', 'ch12-distributed'],
  ['13-系统设计.md', 'ch13-system-design'],
  ['99-附录-答题话术与冲刺计划.md', 'appendix']
]

const SLUG_BY_FILE = new Map(CHAPTERS)

/** 侧边栏显示的短标题：优先取 H1 冒号前，过短则用全称 */
function shortTitle(h1) {
  const head = h1.replace(/^#\s*/, '').trim()
  const beforeColon = head.split('：')[0].trim()
  return beforeColon.length >= 6 ? beforeColon : head
}

/** 解析一行表格为单元格数组 */
function parseRow(line) {
  const cells = line.split('|')
  cells.shift()
  if (cells.length && cells[cells.length - 1].trim() === '') cells.pop()
  return cells.map((c) => c.replace(/\\\|/g, '|').trim())
}

function prepareChapter(file) {
  const abs = path.join(docsDir, file)
  const raw = fs.readFileSync(abs, 'utf8')
  const lines = raw.split(/\r?\n/)

  const h1Line = lines.find((l) => /^#\s/.test(l)) || ''
  const h1 = h1Line.replace(/^#\s*/, '').trim()

  const sections = []
  const questions = []
  let sectionIndex = 0
  let inQuestionTable = false

  const out = lines.map((line) => {
    const h2 = line.match(/^##\s+(.+?)\s*$/)
    if (h2) {
      sectionIndex += 1
      const text = h2[1].replace(/\s*\{#[^}]*\}\s*$/, '').trim()
      sections.push({ text, anchor: `s${sectionIndex}` })
      inQuestionTable = /高频面试题清单/.test(text)
      return `## ${text} {#s${sectionIndex}}`
    }

    const h3 = line.match(/^###\s+(Q(\d+)\.\s*.+?)\s*$/)
    if (h3) {
      const text = h3[1].replace(/\s*\{#[^}]*\}\s*$/, '').trim()
      return `### ${text} {#q${h3[2]}}`
    }

    if (inQuestionTable && line.startsWith('|')) {
      const cells = parseRow(line)
      if (cells.length >= 6 && /^Q\d+$/.test(cells[0])) {
        questions.push({
          id: cells[0],
          title: cells[1],
          difficulty: cells[2],
          threshold: cells[3],
          priority: cells[4],
          answer: cells[5]
        })
      }
    }

    return line
  })

  const next = out.join('\n')
  if (next !== raw) fs.writeFileSync(abs, next, 'utf8')

  return { file, h1, short: shortTitle(h1), sections, questions }
}

function buildSidebar(chapters) {
  return [
    {
      text: '开始',
      items: [
        { text: '首页与阅读路线', link: '/' },
        { text: '题库速查（261 题）', link: '/questions' }
      ]
    },
    {
      text: '正文',
      items: chapters.map((c) => ({
        text: c.short,
        link: `/${SLUG_BY_FILE.get(c.file)}`,
        collapsed: true,
        items: c.sections.map((s) => ({
          text: s.text,
          link: `/${SLUG_BY_FILE.get(c.file)}#${s.anchor}`
        }))
      }))
    }
  ]
}

/** 统计全书某类标记的数量，供首页数据卡使用（数字不写死，跟着正文变） */
function countInDocs(pattern) {
  let n = 0
  for (const [file] of CHAPTERS) {
    const text = fs.readFileSync(path.join(docsDir, file), 'utf8')
    n += (text.match(pattern) || []).length
  }
  return n
}

/** 解析 README 的「二、目录」表格，转成首页的章节卡片 */
function buildChapterCards(readme) {
  const lines = readme.split(/\r?\n/)
  const start = lines.findIndex((l) => /^\|\s*章节\s*\|/.test(l))
  if (start < 0) return null
  let end = start
  while (end < lines.length && lines[end].startsWith('|')) end += 1

  const rows = lines.slice(start + 2, end).map(parseRow).filter((cells) => cells.length >= 5)
  const html = rows
    .map((cells) => {
      const [no, fileCell, summary, count, weight, duration] = cells
      const matched = fileCell.match(/\(docs\/([^)]+?\.md)\)/)
      const slug = matched ? SLUG_BY_FILE.get(decodeURI(matched[1])) : null
      const name = fileCell.replace(/^\[([^\]]+)\]\([^)]*\)$/, '$1')
      const dot = weight === '极高' ? 'is-top' : weight === '高' ? 'is-high' : 'is-mid'
      // 第 0 章与附录没有题量，退化成「前置 · 0.5 天」「建议 0.5 天」
      const meta =
        count && count !== '—'
          ? `${count} 题 · ${weight}`
          : weight && weight !== '—'
            ? `${weight} · ${duration}`
            : `建议 ${duration}`
      return [
        `<a class="ch-card" href="${slug ? `./${slug}` : '#'}">`,
        `  <span class="ch-card-head"><span class="ch-card-no">${no}</span><span class="ch-card-name">${name}</span></span>`,
        `  <span class="ch-card-desc">${summary}</span>`,
        `  <span class="ch-card-meta"><i class="ch-dot ${dot}"></i>${meta}</span>`,
        '</a>'
      ].join('\n')
    })
    .join('\n')

  return { html: `<div class="ch-grid">\n${html}\n</div>`, rows, start, end }
}

/** 首屏快捷入口：把「面试权重极高」的几章提到最前面，省掉滚到目录的功夫 */
function buildQuickLinks(rows) {
  const chips = rows
    .filter((cells) => cells[4] === '极高')
    .map((cells) => {
      const matched = cells[1].match(/\(docs\/([^)]+?\.md)\)/)
      const slug = matched ? SLUG_BY_FILE.get(decodeURI(matched[1])) : null
      const name = cells[1].replace(/^\[([^\]]+)\]\([^)]*\)$/, '$1')
      return `<a class="home-chip" href="${slug ? `./${slug}` : '#'}">${name} · ${cells[3]} 题</a>`
    })
  chips.push('<a class="home-chip" href="./questions">题库速查 · 261 题</a>')
  return `<div class="home-quick">\n  <span class="home-quick-label">面试权重最高</span>\n  ${chips.join('\n  ')}\n</div>`
}

function buildIndex(allQuestions) {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8')
  const lines = readme.split(/\r?\n/)

  // 首页用 hero 承载书名与定位，正文里重复的 H1 与开篇两段去掉（从第一处分隔线开始截）
  const divider = lines.findIndex((l, i) => i < 12 && l.trim() === '---')
  let body = lines.slice(divider >= 0 ? divider + 1 : 0)

  // 目录表格 15 行 6 列在窄屏会挤成一团，换成卡片
  const cards = buildChapterCards(readme)
  if (cards) {
    const offset = lines.length - body.length
    body = [
      ...body.slice(0, cards.start - offset),
      cards.html,
      '',
      ...body.slice(cards.end - offset)
    ]
  }

  const rewritten = body
    .join('\n')
    .replace(/\]\(docs\/([^)]+?\.md)\)/g, (m, file) => {
      const slug = SLUG_BY_FILE.get(decodeURI(file))
      if (!slug) {
        console.warn(`[prepare] README 里的链接没有对应路由: ${file}`)
        return m
      }
      // 用相对路径而非 /slug：GitHub Pages 部署在子路径下，相对链接会自动带上 base
      return `](./${slug})`
    })

  const stats = [
    [allQuestions.length, '道面试题'],
    [allQuestions.filter((q) => q.priority === 'P0').length, '道 P0 必背'],
    [countInDocs(/^- 追问：/gm), '条面试追问'],
    [countInDocs(/```mermaid/g), '张原理图示']
  ]
  const statsHtml = [
    '<div class="home-stats">',
    ...stats.map(
      ([num, label]) =>
        `  <div class="home-stat"><span class="home-stat-num">${num}</span><span class="home-stat-label">${label}</span></div>`
    ),
    '</div>'
  ].join('\n')

  const frontmatter = [
    '---',
    'layout: home',
    'sidebar: false',
    'outline: false',
    'hero:',
    '  name: Java 后端面试',
    '  text: 系统化复习手册',
    '  tagline: 13 章正文 · 261 道题 · 按「结论 → 原理 → 取舍」组织，面试现场能把一道题讲圆',
    '  actions:',
    '    - theme: brand',
    '      text: 从第 1 章开始',
    '      link: ./ch01-java-basics',
    '    - theme: alt',
    '      text: 题库速查',
    '      link: ./questions',
    '---',
    ''
  ].join('\n')

  fs.writeFileSync(
    path.join(docsDir, 'index.md'),
    `${frontmatter}${statsHtml}\n\n${cards ? buildQuickLinks(cards.rows) : ''}\n\n${rewritten}`,
    'utf8'
  )
}

function main() {
  fs.mkdirSync(dataDir, { recursive: true })

  const chapters = []
  const allQuestions = []
  for (const [file] of CHAPTERS) {
    const meta = prepareChapter(file)
    const slug = SLUG_BY_FILE.get(file)
    chapters.push(meta)
    for (const q of meta.questions) {
      allQuestions.push({
        ...q,
        chapter: slug,
        chapterTitle: meta.short,
        link: `/${slug}#q${q.id.slice(1)}`
      })
    }
    const headingCount = (fs.readFileSync(path.join(docsDir, file), 'utf8').match(/^###\s+Q\d+\./gm) || []).length
    if (headingCount !== meta.questions.length) {
      console.warn(`[prepare] ${file} 题表 ${meta.questions.length} 行，但标题 ${headingCount} 个，请检查`)
    }
  }

  fs.writeFileSync(
    path.join(dataDir, 'sidebar.mjs'),
    `// 由 scripts/prepare.mjs 生成，请勿手改\nexport default ${JSON.stringify(buildSidebar(chapters), null, 2)}\n`,
    'utf8'
  )
  fs.writeFileSync(
    path.join(dataDir, 'questions.mjs'),
    `// 由 scripts/prepare.mjs 生成，请勿手改\nexport default ${JSON.stringify(allQuestions, null, 2)}\n`,
    'utf8'
  )

  buildIndex(allQuestions)

  console.log(`[prepare] ${chapters.length} 章 / ${allQuestions.length} 题 / 索引已生成`)
}

main()
