<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { principles } from './home-data'

// Переводы стартовой страницы из themeConfig.home (реактивно к локали VitePress),
// без vue-i18n. theme меняется при смене языка — компонент перерисовывается.
const { theme } = useData()
const home = computed(() => theme.value.home!)
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ home.principles.title }}</h2>
    <div class="principles">
      <div
        v-for="p in principles"
        :key="p.id"
        class="home-card principle"
      >
        <div class="principle__icon">
          <Icon :name="p.icon" size="18" />
        </div>
        <div>
          <p class="principle__title">{{ home.principles[p.id].title }}</p>
          <p class="principle__desc">{{ home.principles[p.id].desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.principles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}
.principle__icon {
  width: 34px;
  height: 34px;
  border-radius: var(--home-radius-lg);
  background: rgba(0, 220, 130, 0.08);
  color: var(--home-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.principle__title {
  font-size: var(--home-text-lg);
  font-weight: 600;
  letter-spacing: var(--home-tracking-tight);
  color: var(--home-text-soft);
  margin: 0 0 6px;
}
.principle__desc {
  font-size: var(--home-text-sm);
  color: var(--home-text-muted);
  margin: 0;
  line-height: var(--home-leading-normal);
}
</style>
