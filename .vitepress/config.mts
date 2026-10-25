import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import sidebar from './data/sidebar.mjs'

/** 中文文件名 -> ASCII 路由，需与 scripts/prepare.mjs 的 CHAPTERS 保持一致 */
const rewrites = {
  '00-前置概念与术语.md': 'ch00-prereq.md',
  '01-Java基础.md': 'ch01-java-basics.md',
  '02-集合框架.md': 'ch02-collections.md',
  '03-并发与多线程.md': 'ch03-concurrency.md',
  '04-JVM.md': 'ch04-jvm.md',
  '05-设计模式.md': 'ch05-design-patterns.md',
  '06-数据结构与算法.md': 'ch06-dsa.md',
  '07-计算机网络与操作系统.md': 'ch07-network-os.md',
  '08-MySQL.md': 'ch08-mysql.md',
  '09-Redis.md': 'ch09-redis.md',
  '10-消息队列.md': 'ch10-mq.md',
  '11-Spring与SpringBoot.md': 'ch11-spring.md',
  '12-分布式与微服务.md': 'ch12-distributed.md',
  '13-系统设计.md': 'ch13-system-design.md',
  '99-附录-答题话术与冲刺计划.md': 'appendix.md'
}

/**
 * GitHub Pages 是项目站点，部署在 /<repo>/ 子路径下，构建时必须带上 base。
 * 本地 dev / preview 走 '/'，由 CI 里的 DOCS_BASE 覆盖。
 */
const base = process.env.DOCS_BASE ?? '/'

/** 分享卡片里的 og:image 必须是绝对地址，这里写死线上域名 */
const SITE_URL = 'https://ramen1024.github.io/java-backend-interview-handbook/'

export default withMermaid(
  defineConfig({
    base,
    lang: 'zh-CN',
    title: 'Java 后端面试系统化复习手册',
    description:
      '13 章正文、261 道题，按「结论 → 原理 → 取舍 → 追问」四层组织的 Java 后端面试复习手册。',
    srcDir: './docs',
    outDir: './.vitepress/dist',
    cleanUrls: true,
    lastUpdated: true,
    rewrites,
    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
      ['link', { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` }],
      ['meta', { name: 'theme-color', content: '#0b1120' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: 'Java 后端面试系统化复习手册' }],
      [
        'meta',
        {
          property: 'og:description',
          content: '13 章正文、261 道题，按「结论 → 原理 → 取舍」组织的 Java 后端面试复习手册。'
        }
      ],
      ['meta', { property: 'og:url', content: SITE_URL }],
      ['meta', { property: 'og:image', content: `${SITE_URL}og.png` }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:image', content: `${SITE_URL}og.png` }],
      /**
       * 平板（1280 CSS 宽，如 2560×1600 的安卓板）会同时触发左侧栏 960 与右侧大纲 1280 两条线，
       * 正文被挤到 660 出头。把「大纲常驻」这条判定推迟到 1440，1280 档改回顶部下拉。
       * 必须在任何模块脚本之前执行，所以放 head 内联，且要早于 Vue 应用初始化。
       */
      [
        'script',
        {},
        `(() => {
  const orig = window.matchMedia.bind(window)
  const map = { '(min-width: 1280px)': '(min-width: 1440px)' }
  window.matchMedia = (q) => orig(map[q] || q)
})()`
      ]
    ],
    markdown: {
      lineNumbers: true,
      image: { lazyLoading: true }
    },
    mermaid: {
      // 用 SVG text 渲染标签：HTML 标签按西文字体测量高度，
      // 中文回退字体更高，三行以上的节点会被裁掉最后一行。
      htmlLabels: false,
      flowchart: { htmlLabels: false },
      themeVariables: { fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif' }
    },
    themeConfig: {
      logo: '/favicon.svg',
      nav: [
        { text: '首页', link: '/' },
        { text: '题库速查', link: '/questions' }
      ],
      sidebar,
      outline: { level: [2, 3], label: '本页目录' },
      docFooter: { prev: '上一章', next: '下一章' },
      lastUpdated: { text: '最后更新' },
      returnToTopLabel: '回到顶部',
      sidebarMenuLabel: '目录',
      darkModeSwitchLabel: '主题',
      lightModeSwitchTitle: '切换到浅色模式',
      darkModeSwitchTitle: '切换到深色模式',
      search: {
        provider: 'local',
        options: {
          detailedView: true,
          translations: {
            button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
            modal: {
              displayDetails: '显示详细列表',
              resetButtonTitle: '重置搜索',
              backButtonTitle: '关闭搜索',
              noResultsText: '没有结果',
              footer: {
                selectText: '选择',
                navigateText: '导航',
                closeText: '关闭'
              }
            }
          }
        }
      },
      footer: {
        message: '内容基于 JDK 8 / MySQL 8.0 / Redis 7 口径整理，仅供个人复习使用。',
        copyright: '转载或引用请注明出处'
      }
    }
  })
)
