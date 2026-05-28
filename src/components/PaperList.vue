<script setup lang="ts">
import type { Paper } from '../types/paper'
import PaperCard from './PaperCard.vue'
import { computed } from 'vue'

const props = defineProps<{
  papers: Paper[]
  sortBy: 'date' | 'citations' | 'title'
}>()

const groupedByDate = computed(() => {
  const groups = new Map<string, Paper[]>()
  for (const paper of props.papers) {
    const dateKey = paper.date.slice(0, 10)
    if (!groups.has(dateKey)) groups.set(dateKey, [])
    groups.get(dateKey)!.push(paper)
  }
  return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))
})

const showDateGroups = computed(() => props.sortBy === 'date')

function formatDateHeader(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
    const dateLabel = d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })
    if (diff === 0) return `今天 · ${dateLabel}`
    if (diff === 1) return `昨天 · ${dateLabel}`
    return dateLabel
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div v-if="papers.length === 0" class="py-12 text-center" style="color: var(--text-muted)">
    <p class="text-sm">沒有找到符合條件的論文</p>
  </div>

  <!-- Grouped by date -->
  <div v-else-if="showDateGroups" class="space-y-5">
    <section v-for="[date, group] in groupedByDate" :key="date">
      <div class="mb-2 flex items-center gap-2">
        <h2 class="text-xs font-semibold uppercase tracking-wide" style="color: var(--text-muted)">
          {{ formatDateHeader(date) }}
        </h2>
        <span class="rounded-full px-1.5 py-px text-[10px]" style="background-color: var(--tag-bg); color: var(--text-muted)">
          {{ group.length }}
        </span>
        <div class="h-px flex-1" style="background-color: var(--border)"></div>
      </div>
      <div class="space-y-2">
        <PaperCard v-for="paper in group" :key="paper.id" :paper="paper" />
      </div>
    </section>
  </div>

  <!-- Flat list (non-date sort) -->
  <div v-else class="space-y-2">
    <PaperCard v-for="paper in papers" :key="paper.id" :paper="paper" />
  </div>
</template>
