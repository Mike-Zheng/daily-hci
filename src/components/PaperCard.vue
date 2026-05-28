<script setup lang="ts">
import type { Paper } from '../types/paper'
import { ref, computed } from 'vue'

const props = defineProps<{ paper: Paper }>()

const expanded = ref(false)
const bookmarked = ref(false)

const bookmarkKey = `bookmark:${props.paper.id}`
bookmarked.value = localStorage.getItem(bookmarkKey) === '1'

function toggleBookmark() {
  bookmarked.value = !bookmarked.value
  if (bookmarked.value) {
    localStorage.setItem(bookmarkKey, '1')
  } else {
    localStorage.removeItem(bookmarkKey)
  }
}

const sourceLabel = computed(() => {
  const map: Record<string, string> = {
    'arxiv': 'arXiv', 'dblp': 'DBLP', 'semantic-scholar': 'S2',
    'openalex': 'OpenAlex', 'crossref': 'CrossRef', 'core': 'CORE',
  }
  return map[props.paper.source] || props.paper.source
})

const sourceColor = computed(() => {
  const map: Record<string, string> = {
    'arxiv': 'var(--source-arxiv)', 'dblp': 'var(--source-dblp)',
    'semantic-scholar': 'var(--source-s2)', 'openalex': 'var(--source-openalex)',
    'crossref': 'var(--source-crossref)', 'core': 'var(--source-core)',
  }
  return map[props.paper.source] || 'var(--accent)'
})

const shortAbstract = computed(() => {
  const abs = props.paper.abstract
  if (abs.length <= 180) return abs
  return abs.slice(0, 180) + '…'
})

const formattedDate = computed(() => {
  try {
    return new Date(props.paper.date).toLocaleDateString('zh-TW', {
      month: 'numeric', day: 'numeric',
    })
  } catch {
    return props.paper.date
  }
})
</script>

<template>
  <article
    class="rounded-md border px-4 py-3 transition-colors hover:border-[var(--accent)]/30"
    style="background-color: var(--bg-card); border-color: var(--border)"
  >
    <!-- Row 1: source badge + title + bookmark -->
    <div class="flex items-start gap-2">
      <span
        class="mt-0.5 shrink-0 rounded px-1.5 py-px text-[10px] font-semibold text-white"
        :style="{ backgroundColor: sourceColor }"
      >{{ sourceLabel }}</span>
      <a
        :href="paper.url"
        target="_blank"
        rel="noopener"
        class="min-w-0 flex-1 text-sm font-semibold leading-snug hover:underline"
        style="color: var(--text-primary)"
      >{{ paper.title }}</a>
      <button
        @click="toggleBookmark"
        class="shrink-0 text-sm opacity-40 transition-opacity hover:opacity-100"
        :class="{ '!opacity-100': bookmarked }"
        :title="bookmarked ? '取消收藏' : '收藏'"
      >{{ bookmarked ? '★' : '☆' }}</button>
    </div>

    <!-- Row 2: meta line -->
    <div class="mt-1 flex items-center gap-1.5 text-[11px]" style="color: var(--text-muted)">
      <span>{{ formattedDate }}</span>
      <span v-if="paper.venue" class="truncate">· {{ paper.venue }}</span>
      <span v-if="paper.citationCount != null && paper.citationCount > 0">· {{ paper.citationCount }} cites</span>
      <span class="truncate">· {{ paper.authors.slice(0, 3).join(', ') }}<template v-if="paper.authors.length > 3"> +{{ paper.authors.length - 3 }}</template></span>
    </div>

    <!-- TLDR (if available, show instead of abstract by default) -->
    <p v-if="paper.tldr" class="mt-1.5 rounded px-2 py-1 text-xs leading-relaxed" style="background-color: var(--accent-light); color: var(--accent)">
      {{ paper.tldr }}
    </p>

    <!-- Abstract -->
    <div v-if="paper.abstract" class="mt-1.5">
      <p class="text-xs leading-relaxed" style="color: var(--text-secondary)">
        {{ expanded ? paper.abstract : shortAbstract }}
      </p>
      <button
        v-if="paper.abstract.length > 180"
        @click="expanded = !expanded"
        class="mt-0.5 text-[11px] font-medium hover:underline"
        style="color: var(--accent)"
      >{{ expanded ? '收起' : '更多' }}</button>
    </div>

    <!-- Row 3: tags + actions -->
    <div class="mt-2 flex items-center justify-between gap-2">
      <div v-if="paper.tags.length > 0" class="flex min-w-0 flex-wrap gap-1">
        <span
          v-for="tag in paper.tags.slice(0, 5)"
          :key="tag"
          class="rounded px-1.5 py-px text-[10px] font-medium"
          style="background-color: var(--tag-bg); color: var(--tag-text)"
        >{{ tag }}</span>
        <span v-if="paper.tags.length > 5" class="text-[10px]" style="color: var(--text-muted)">+{{ paper.tags.length - 5 }}</span>
      </div>
      <div class="flex shrink-0 gap-2 text-[11px]">
        <a
          v-if="paper.pdfUrl"
          :href="paper.pdfUrl"
          target="_blank"
          rel="noopener"
          class="font-medium hover:underline"
          style="color: var(--accent)"
        >PDF</a>
        <a
          :href="paper.url"
          target="_blank"
          rel="noopener"
          class="font-medium hover:underline"
          style="color: var(--accent)"
        >原文</a>
      </div>
    </div>
  </article>
</template>
