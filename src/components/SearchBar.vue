<script setup lang="ts">
import { ref } from 'vue'

const query = defineModel<string>('query', { required: true })
const selectedTags = defineModel<string[]>('selectedTags', { required: true })
const selectedSources = defineModel<string[]>('selectedSources', { required: true })
const sortBy = defineModel<'date' | 'citations' | 'title'>('sortBy', { required: true })

defineProps<{
  tags: string[]
  sources: string[]
}>()

const showFilters = ref(false)

function toggleTag(tag: string) {
  const idx = selectedTags.value.indexOf(tag)
  if (idx >= 0) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag)
  } else {
    selectedTags.value = [...selectedTags.value, tag]
  }
}

function toggleSource(source: string) {
  const idx = selectedSources.value.indexOf(source)
  if (idx >= 0) {
    selectedSources.value = selectedSources.value.filter((s) => s !== source)
  } else {
    selectedSources.value = [...selectedSources.value, source]
  }
}

function clearAll() {
  query.value = ''
  selectedTags.value = []
  selectedSources.value = []
  sortBy.value = 'date'
}

const sourceLabels: Record<string, string> = {
  'arxiv': 'arXiv',
  'dblp': 'DBLP',
  'semantic-scholar': 'S2',
  'openalex': 'OpenAlex',
  'crossref': 'CrossRef',
  'core': 'CORE',
}

const sourceColors: Record<string, string> = {
  'arxiv': 'var(--source-arxiv)',
  'dblp': 'var(--source-dblp)',
  'semantic-scholar': 'var(--source-s2)',
  'openalex': 'var(--source-openalex)',
  'crossref': 'var(--source-crossref)',
  'core': 'var(--source-core)',
}
</script>

<template>
  <div class="mb-4 space-y-2.5">
    <!-- Row 1: Search + Sort + Filter toggle -->
    <div class="flex gap-2">
      <div class="relative flex-1">
        <svg class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style="color: var(--text-muted)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="query"
          type="text"
          placeholder="搜尋標題、作者或摘要..."
          class="w-full rounded-md border py-1.5 pl-8 pr-3 text-xs outline-none transition-colors focus:ring-1"
          :style="{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
            '--tw-ring-color': 'var(--accent)',
          }"
        />
      </div>

      <!-- Sort -->
      <select
        v-model="sortBy"
        class="rounded-md border px-2 py-1.5 text-xs outline-none"
        :style="{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }"
      >
        <option value="date">按日期</option>
        <option value="citations">按引用</option>
        <option value="title">按標題</option>
      </select>

      <!-- Filter toggle -->
      <button
        @click="showFilters = !showFilters"
        class="rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors"
        :style="{
          backgroundColor: showFilters ? 'var(--accent)' : 'var(--bg-secondary)',
          borderColor: showFilters ? 'var(--accent)' : 'var(--border)',
          color: showFilters ? 'white' : 'var(--text-secondary)',
        }"
      >
        <span>篩選</span>
        <span v-if="selectedTags.length + selectedSources.length > 0" class="ml-0.5">({{ selectedTags.length + selectedSources.length }})</span>
      </button>

      <!-- Clear -->
      <button
        v-if="query || selectedTags.length > 0 || selectedSources.length > 0 || sortBy !== 'date'"
        @click="clearAll"
        class="rounded-md border px-2 py-1.5 text-xs transition-colors hover:opacity-80"
        :style="{ borderColor: 'var(--border)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)' }"
      >
        清除
      </button>
    </div>

    <!-- Filters panel (collapsible) -->
    <div v-if="showFilters" class="space-y-2 rounded-md border p-3" style="border-color: var(--border); background-color: var(--bg-secondary)">
      <!-- Source filters -->
      <div v-if="sources.length > 0" class="flex flex-wrap items-center gap-1.5">
        <span class="mr-1 text-[10px] font-semibold uppercase tracking-wider" style="color: var(--text-muted)">來源</span>
        <button
          v-for="source in sources"
          :key="source"
          @click="toggleSource(source)"
          class="rounded px-2 py-0.5 text-[11px] font-medium transition-colors"
          :style="{
            backgroundColor: selectedSources.includes(source) ? sourceColors[source] || 'var(--accent)' : 'var(--tag-bg)',
            color: selectedSources.includes(source) ? 'white' : 'var(--tag-text)',
          }"
        >
          {{ sourceLabels[source] || source }}
        </button>
      </div>

      <!-- Tag filters -->
      <div v-if="tags.length > 0" class="flex flex-wrap items-center gap-1">
        <span class="mr-1 text-[10px] font-semibold uppercase tracking-wider" style="color: var(--text-muted)">標籤</span>
        <button
          v-for="tag in tags"
          :key="tag"
          @click="toggleTag(tag)"
          class="rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors"
          :style="{
            backgroundColor: selectedTags.includes(tag) ? 'var(--accent)' : 'var(--tag-bg)',
            color: selectedTags.includes(tag) ? 'white' : 'var(--tag-text)',
          }"
        >
          {{ tag }}
        </button>
      </div>
    </div>
  </div>
</template>
