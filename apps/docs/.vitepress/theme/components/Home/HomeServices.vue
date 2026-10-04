<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
const t = computed(() => theme.value.home!.content.services)

const services = [
  { id: 'frontend', url: 'http://localhost:3200' },
  { id: 'backend', url: 'http://localhost:3100' },
  { id: 'swagger', url: 'http://localhost:3100/api/docs' },
  { id: 'health', url: 'http://localhost:3100/health' },
  { id: 'docs', url: 'http://localhost:5173/dev/docs/' },
] as const
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t.title }}</h2>
    <div class="home-panel services">
      <ul class="services__list">
        <li v-for="service in services" :key="service.id" class="services__row">
          <span class="services__name">{{ t.items[service.id] }}</span>
          <!-- Адреса ведут в другие приложения — открываем рядом, не уходя из доков -->
          <a class="services__url" :href="service.url" target="_blank" rel="noopener">
            {{ service.url.replace('http://', '') }}
          </a>
        </li>
      </ul>
      <p class="services__note">{{ t.note }}</p>
    </div>
  </section>
</template>

<style scoped>
.services {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.services__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.services__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  column-gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--home-border-2);
}
.services__row:last-child {
  border-bottom: none;
}
.services__name {
  font-size: var(--home-text-sm);
  color: var(--home-text-soft);
}
.services__url {
  font-family: monospace;
  font-size: var(--home-text-xs);
  color: var(--home-accent);
  text-decoration: none;
  word-break: break-all;
}
.services__url:hover {
  text-decoration: underline;
}
.services__note {
  margin: 0;
  font-size: var(--home-text-xs);
  color: var(--home-text-muted);
  line-height: var(--home-leading-normal);
}
</style>
