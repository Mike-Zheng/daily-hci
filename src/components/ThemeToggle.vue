<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(false)

onMounted(() => {
  isDark.value =
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  applyTheme()
})

function toggle() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>

<template>
  <button
    @click="toggle"
    class="rounded-lg p-2 text-xl transition-colors hover:opacity-80"
    :title="isDark ? '切換亮色模式' : '切換暗色模式'"
  >
    {{ isDark ? '☀️' : '🌙' }}
  </button>
</template>
