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

function buildIndex() {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8')
  const rewritten = readme.replace(/\]\(docs\/([^)]+?\.md)\)/g, (m, file) => {
    const slug = SLUG_BY_FILE.get(decodeURI(file))
    if (!slug) {
      console.warn(`[prepare] README 里的链接没有对应路由: ${file}`)
      return m
    }
    return `](/${slug})`
  })

  const frontmatter = ['---', 'layout: doc', 'sidebar: false', 'outline: false', '---', ''].join('\n')
  fs.writeFileSync(path.join(docsDir, 'index.md'), frontmatter + rewritten, 'utf8')
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

  buildIndex()

  console.log(`[prepare] ${chapters.length} 章 / ${allQuestions.length} 题 / 索引已生成`)
}

main()
