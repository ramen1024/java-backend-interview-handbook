import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import QuestionBank from './components/QuestionBank.vue'
import './custom.css'

/**
 * VitePress 给每个代码块都插了复制按钮，但 title 写死成英文 "Copy Code"。
 * 构建期拿不到配置项，只能在客户端改；顺便补上 aria-label 供读屏使用。
 */
function localizeCopyButtons() {
  document.querySelectorAll<HTMLButtonElement>('button.copy').forEach((btn) => {
    if (btn.dataset.localized === '1') return
    btn.dataset.localized = '1'
    btn.title = '复制代码'
    btn.setAttribute('aria-label', '复制代码')
  })
}

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    app.component('QuestionBank', QuestionBank)

    if (typeof window === 'undefined') return

    router.onAfterRouteChanged = () => {
      localizeCopyButtons()
      // 代码块是异步高亮渲染的，再兜一次
      window.setTimeout(localizeCopyButtons, 120)
    }
    window.addEventListener('load', localizeCopyButtons)
  }
} satisfies Theme
