<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Paper, DailyData } from './types/paper'
import PaperList from './components/PaperList.vue'
import SearchBar from './components/SearchBar.vue'
import ThemeToggle from './components/ThemeToggle.vue'

const papers = ref<Paper[]>([])
const fetchedAt = ref('')
const loading = ref(true)
const error = ref('')

const searchQuery = ref('')
const selectedTags = ref<string[]>([])
const selectedSources = ref<string[]>([])
const sortBy = ref<'date' | 'citations' | 'title'>('date')

const allTags = computed(() => {
  const tags = new Set<string>()
  papers.value.forEach((p) => p.tags.forEach((t) => tags.add(t)))
  return [...tags].sort()
})

const allSources = computed(() => {
  const sources = new Set<string>()
  papers.value.forEach((p) => sources.add(p.source))
  return [...sources].sort()
})

const filteredPapers = computed(() => {
  let result = papers.value.filter((p) => {
    const q = searchQuery.value.toLowerCase()
    if (q) {
      const haystack = `${p.title} ${p.authors.join(' ')} ${p.abstract}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    if (selectedTags.value.length > 0) {
      if (!selectedTags.value.some((t) => p.tags.includes(t))) return false
    }
    if (selectedSources.value.length > 0) {
      if (!selectedSources.value.includes(p.source)) return false
    }
    return true
  })

  result = [...result]
  if (sortBy.value === 'date') {
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } else if (sortBy.value === 'citations') {
    result.sort((a, b) => (b.citationCount ?? 0) - (a.citationCount ?? 0))
  } else if (sortBy.value === 'title') {
    result.sort((a, b) => a.title.localeCompare(b.title))
  }

  return result
})

const stats = computed(() => ({
  total: papers.value.length,
  filtered: filteredPapers.value.length,
  sources: allSources.value.length,
}))

onMounted(async () => {
  try {
    const res = await fetch('/data/latest.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: DailyData = await res.json()
    papers.value = data.papers
    fetchedAt.value = data.fetchedAt
  } catch (e: any) {
    error.value = e.message || 'Failed to load data'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen" style="background-color: var(--bg-primary); color: var(--text-primary)">
    <!-- Header -->
    <header
      class="sticky top-0 z-10 border-b backdrop-blur-lg"
      style="background-color: color-mix(in srgb, var(--bg-primary) 85%, transparent); border-color: var(--border)"
    >
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div class="min-w-0">
          <h1 class="text-xl font-bold tracking-tight" style="color: var(--accent)">Daily HCI</h1>
          <p class="text-xs" style="color: var(--text-muted)">
            {{ stats.total }} papers · {{ stats.sources }} sources
            <span v-if="fetchedAt"> · {{ new Date(fetchedAt).toLocaleDateString('zh-TW') }}</span>
          </p>
        </div>
        <ThemeToggle />
      </div>
    </header>

    <!-- Main -->
    <main class="mx-auto max-w-4xl px-4 py-4">
      <SearchBar
        v-model:query="searchQuery"
        v-model:selectedTags="selectedTags"
        v-model:selectedSources="selectedSources"
        v-model:sortBy="sortBy"
        :tags="allTags"
        :sources="allSources"
      />

      <div v-if="!loading && !error" class="mb-3 flex items-center justify-between">
        <p class="text-xs" style="color: var(--text-muted)">
          {{ filteredPapers.length }} / {{ papers.length }} 篇
        </p>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div
          class="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
          style="border-color: var(--border); border-top-color: var(--accent)"
        ></div>
      </div>

      <div v-else-if="error" class="rounded-lg border p-6 text-center" style="border-color: var(--border)">
        <p class="text-sm font-medium">無法載入資料</p>
        <p class="mt-1 text-xs" style="color: var(--text-muted)">{{ error }}</p>
        <p class="mt-3 text-xs" style="color: var(--text-muted)">
          請先執行 <code class="rounded px-1 py-0.5 text-xs" style="background-color: var(--tag-bg)">npm run fetch</code>
        </p>
      </div>

      <PaperList v-else :papers="filteredPapers" :sort-by="sortBy" />
    </main>
  </div>
</template>
