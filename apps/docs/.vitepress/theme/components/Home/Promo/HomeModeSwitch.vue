<script setup lang="ts">
import { onMounted, watch } from 'vue'

// Переключатель для мейнтейнера шаблона: промо или стартовая страница
// для разработчика. create-nest-nuxt удаляет его вместе с промо.
const mode = defineModel<'promo' | 'dev'>({ required: true })

const STORAGE_KEY = 'home:mode'

// Выбор помним между перезагрузками. Читаем после монтирования —
// при SSR localStorage нет, и первая отрисовка всегда промо.
onMounted(() => {
  try {
    if (localStorage.getItem(STORAGE_KEY) === 'dev') mode.value = 'dev'
  }
  catch {}
})

watch(mode, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  }
  catch {}
})
</script>

<template>
  <div class="mode-switch" role="group" aria-label="Home page">
    <button
      v-for="option in (['promo', 'dev'] as const)"
      :key="option"
      type="button"
      class="mode-switch__option"
      :class="{ 'mode-switch__option--active': mode === option }"
      :aria-pressed="mode === option"
      @click="mode = option"
    >
      {{ option === 'promo' ? 'Promo' : 'Dev' }}
    </button>
  </div>
</template>

<style scoped>
.mode-switch {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 30;
  display: flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--home-border-strong);
  border-radius: 999px;
  background: var(--home-surface-card);
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
}
.mode-switch__option {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: var(--home-text-xs);
  font-weight: 600;
  color: var(--home-text-hover);
  transition: color 0.2s, background 0.2s;
}
.mode-switch__option:hover {
  color: var(--home-text-primary);
}
.mode-switch__option--active {
  background: var(--home-accent);
  color: var(--home-surface-deep);
}
.mode-switch__option--active:hover {
  color: var(--home-surface-deep);
}
</style>
