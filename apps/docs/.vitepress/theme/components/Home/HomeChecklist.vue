<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
const t = computed(() => theme.value.home!.content.checklist)
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t.title }}</h2>
    <div class="home-panel checklist">
      <p class="checklist__intro">{{ t.intro }}</p>
      <ul class="checklist__list">
        <li v-for="(text, id) in t.items" :key="id">{{ text }}</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.checklist {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.checklist__intro {
  margin: 0;
  font-size: var(--home-text-sm);
  color: var(--home-text-muted);
}
.checklist__list {
  margin: 0;
  padding-left: 18px;
  list-style: disc;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: var(--home-text-sm);
  color: var(--home-text-soft);
  line-height: var(--home-leading-normal);
}
.checklist__list ::marker {
  color: var(--home-accent);
}
</style>
