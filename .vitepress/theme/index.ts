import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import QuestionBank from './components/QuestionBank.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('QuestionBank', QuestionBank)
  }
} satisfies Theme
