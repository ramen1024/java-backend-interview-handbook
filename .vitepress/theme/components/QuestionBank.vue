<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import questions from '../../data/questions.mjs'

type Question = {
  id: string
  title: string
  difficulty: string
  threshold: string
  priority: string
  answer: string
  chapter: string
  chapterTitle: string
  link: string
}

const all = questions as Question[]

const keyword = ref('')
const chapter = ref('all')
const difficulty = ref('all')
const priority = ref('all')
const threshold = ref('all')

const chapterOptions = computed(() => {
  const seen = new Map<string, string>()
  for (const q of all) seen.set(q.chapter, q.chapterTitle)
  return [...seen.entries()]
})

const DIFFICULTIES = ['初级', '中级', '高级']
const PRIORITIES = ['P0', 'P1', 'P2']
const THRESHOLDS = ['低', '中', '高']

const filtered = computed(() =>
  all.filter((q) => {
    if (chapter.value !== 'all' && q.chapter !== chapter.value) return false
    if (difficulty.value !== 'all' && q.difficulty !== difficulty.value) return false
    if (priority.value !== 'all' && q.priority !== priority.value) return false
    if (threshold.value !== 'all' && q.threshold !== threshold.value) return false
    const k = keyword.value.trim()
    if (k && !(q.title + q.answer).toLowerCase().includes(k.toLowerCase())) return false
    return true
  })
)

const isFiltered = computed(
  () =>
    keyword.value !== '' ||
    chapter.value !== 'all' ||
    difficulty.value !== 'all' ||
    priority.value !== 'all' ||
    threshold.value !== 'all'
)

function reset() {
  keyword.value = ''
  chapter.value = 'all'
  difficulty.value = 'all'
  priority.value = 'all'
  threshold.value = 'all'
}

function randomPick() {
  const pool = filtered.value.length ? filtered.value : all
  const picked = pool[Math.floor(Math.random() * pool.length)]
  window.location.href = withBase(picked.link)
}
</script>

<template>
  <div class="qb">
    <div class="qb-toolbar">
      <input
        v-model="keyword"
        class="qb-input"
        type="search"
        placeholder="搜题目或答案，例如：MVCC、双亲委派、限流、CAS"
        aria-label="搜索题目"
      />
      <button class="qb-random" type="button" @click="randomPick">随机一题</button>
    </div>

    <div class="qb-filters">
      <div class="qb-row">
        <span class="qb-label">章节</span>
        <select v-model="chapter" class="qb-select" aria-label="按章节筛选">
          <option value="all">全部章节</option>
          <option v-for="[slug, title] in chapterOptions" :key="slug" :value="slug">
            {{ title }}
          </option>
        </select>
      </div>

      <div class="qb-row">
        <span class="qb-label">难度</span>
        <button
          v-for="d in DIFFICULTIES"
          :key="d"
          type="button"
          class="qb-chip"
          :class="{ active: difficulty === d }"
          @click="difficulty = difficulty === d ? 'all' : d"
        >
          {{ d }}
        </button>
      </div>

      <div class="qb-row">
        <span class="qb-label">优先级</span>
        <button
          v-for="p in PRIORITIES"
          :key="p"
          type="button"
          class="qb-chip"
          :class="{ active: priority === p }"
          @click="priority = priority === p ? 'all' : p"
        >
          {{ p }}
        </button>
      </div>

      <div class="qb-row">
        <span class="qb-label">门槛</span>
        <button
          v-for="t in THRESHOLDS"
          :key="t"
          type="button"
          class="qb-chip"
          :class="{ active: threshold === t }"
          @click="threshold = threshold === t ? 'all' : t"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <div class="qb-count">
      命中 <strong>{{ filtered.length }}</strong> / {{ all.length }} 题
      <button v-if="isFiltered" class="qb-reset" type="button" @click="reset">重置筛选</button>
    </div>

    <ul class="qb-list">
      <li v-for="q in filtered" :key="q.link" class="qb-item">
        <a class="qb-title" :href="withBase(q.link)">
          <span class="qb-id">{{ q.id }}</span>
          <span>{{ q.title }}</span>
        </a>
        <div class="qb-meta">
          <span class="tag" :class="`lv-${q.difficulty}`">{{ q.difficulty }}</span>
          <span class="tag" :class="`p-${q.priority}`">{{ q.priority }}</span>
          <span class="tag tag-plain">门槛 {{ q.threshold }}</span>
          <span class="qb-chapter">{{ q.chapterTitle }}</span>
        </div>
        <p class="qb-answer">{{ q.answer }}</p>
      </li>
    </ul>

    <p v-if="!filtered.length" class="qb-empty">没有匹配的题，换个关键词或清空筛选。</p>
  </div>
</template>

<style scoped>
.qb {
  margin-top: 8px;
}

.qb-toolbar {
  display: flex;
  gap: 10px;
}

.qb-input {
  flex: 1;
  min-width: 0;
  padding: 9px 13px;
  font-size: 14px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}

.qb-input:focus {
  border-color: var(--vp-c-brand-1);
}

.qb-random,
.qb-reset {
  flex-shrink: 0;
  padding: 9px 15px;
  font-size: 14px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.qb-random:hover,
.qb-reset:hover {
  border-color: var(--vp-c-brand-1);
}

.qb-reset {
  padding: 2px 9px;
  margin-left: 10px;
  font-size: 12px;
}

.qb-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin-top: 14px;
}

.qb-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qb-label {
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.qb-select {
  padding: 4px 8px;
  font-size: 13px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  outline: none;
}

.qb-chip {
  padding: 3px 11px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s;
}

.qb-chip:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-3);
}

.qb-chip.active {
  color: var(--vp-c-bg);
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.qb-count {
  margin: 18px 0 10px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.qb-count strong {
  color: var(--vp-c-text-1);
}

.qb-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.qb-item {
  padding: 14px 0;
  border-top: 1px solid var(--vp-c-divider);
}

.qb-title {
  display: flex;
  gap: 9px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.55;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.qb-title:hover {
  color: var(--vp-c-brand-1);
}

.qb-id {
  flex-shrink: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-brand-1);
}

.qb-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 7px 0 0 0;
}

.tag {
  padding: 1px 8px;
  font-size: 12px;
  line-height: 1.6;
  border-radius: 5px;
  border: 1px solid transparent;
}

.tag-plain {
  color: var(--vp-c-text-3);
  border-color: var(--vp-c-divider);
}

.lv-初级 {
  color: #1d9e75;
  background: rgba(29, 158, 117, 0.12);
}

.lv-中级 {
  color: #378add;
  background: rgba(55, 138, 221, 0.12);
}

.lv-高级 {
  color: #7f77dd;
  background: rgba(127, 119, 221, 0.14);
}

.p-P0 {
  color: #e24b4a;
  background: rgba(226, 75, 74, 0.12);
}

.p-P1 {
  color: #ba7517;
  background: rgba(186, 117, 23, 0.12);
}

.p-P2 {
  color: var(--vp-c-text-3);
  background: transparent;
  border-color: var(--vp-c-divider);
}

.qb-chapter {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.qb-answer {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.qb-empty {
  padding: 24px 0;
  font-size: 14px;
  color: var(--vp-c-text-3);
}
</style>
