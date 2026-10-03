<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { branches } from './home-data'

// Переводы стартовой страницы из themeConfig.home (реактивно к локали VitePress),
// без vue-i18n. theme меняется при смене языка — компонент перерисовывается.
const { theme } = useData()
const home = computed(() => theme.value.home!)
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ home.branches.title }}</h2>
    <div class="branches">
      <div
        v-for="(b, bi) in branches"
        :key="b.name"
        class="home-card branch-card"
      >
        <div class="branch-card__header">
          <div class="branch-card__name-row">
            <Icon
              name="lucide:git-branch"
              size="12"
              class="branch-card__icon"
            />
            <code class="branch-card__name">{{ b.name }}</code>
          </div>
          <span class="branch-card__label">{{ home.branches[b.id].label }}</span>
        </div>
        <p class="branch-card__desc">{{ home.branches[b.id].desc }}</p>
        <div v-if="bi > 0" class="branch-card__base">
          <Icon name="lucide:layers" size="11" />
          {{ home.branches.basedOn }} <code>{{ branches[bi - 1]?.name }}</code>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.branches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.branch-card__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.branch-card__name-row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.branch-card__icon {
  color: var(--home-text-dim);
}
.branch-card__name {
  font-family: monospace;
  font-size: var(--home-text-sm);
  color: var(--home-accent);
}
.branch-card__label {
  font-size: var(--home-text-lg);
  font-weight: 700;
  letter-spacing: var(--home-tracking-tight);
  color: var(--home-text-primary);
}
.branch-card__desc {
  font-size: var(--home-text-sm);
  color: var(--home-text-soft);
  margin: 0;
  line-height: var(--home-leading-relaxed);
}
.branch-card__base {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--home-text-sm);
  color: var(--home-text-dim);
  margin-top: 2px;
}
.branch-card__base code {
  font-family: monospace;
  color: var(--home-text-muted);
}

@media (max-width: 900px) {
  .branches {
    grid-template-columns: 1fr;
  }
}
</style>
