<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { projectMap } from './body-data'

const { theme } = useData()
const t = computed(() => theme.value.home!.content.map)
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t.title }}</h2>
    <div class="home-panel map">
      <a
        v-for="item in projectMap"
        :key="item.id"
        class="map__row"
        :href="item.doc"
      >
        <code class="map__path">{{ item.path }}/</code>
        <span class="map__desc">{{ t.items[item.id] }}</span>
        <Icon name="lucide:arrow-right" size="12" class="map__arrow" />
      </a>
    </div>
  </section>
</template>

<style scoped>
.map {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.map__row {
  display: grid;
  grid-template-columns: 12em minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 12px;
  padding: 8px 10px;
  border-radius: var(--home-radius-md);
  text-decoration: none;
  transition: background 0.15s;
}
.map__row:hover {
  background: var(--home-surface-2);
}
.map__path {
  font-family: monospace;
  font-size: var(--home-text-xs);
  color: var(--home-accent);
  background: none;
  padding: 0;
}
.map__desc {
  font-size: var(--home-text-sm);
  color: var(--home-text-soft);
}
.map__arrow {
  color: var(--home-text-muted);
  opacity: 0;
  transition: opacity 0.15s;
}
.map__row:hover .map__arrow {
  opacity: 1;
}

@media (max-width: 600px) {
  .map__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }
  .map__arrow {
    display: none;
  }
}
</style>
