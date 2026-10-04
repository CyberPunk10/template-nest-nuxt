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
        <li v-for="(text, id) in t.items" :key="id" class="checklist__item">
          <span class="checklist__box" aria-hidden="true" />
          {{ text }}
        </li>
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
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.checklist__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: var(--home-text-sm);
  color: var(--home-text-soft);
  line-height: var(--home-leading-normal);
}
/* Квадрат-чекбокс без состояния: список — памятка, а не трекер */
.checklist__box {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-top: 3px;
  border: 1.5px solid var(--home-border-strong);
  border-radius: 3px;
}
</style>
