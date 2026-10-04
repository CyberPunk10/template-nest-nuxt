<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
const t = computed(() => theme.value.home!.content.troubleshoot)

const troubles = [
  { id: 'predev', doc: 'guide/structure/scripts/predev' },
  { id: 'port', doc: 'guide/getting-started/run-pnpm' },
  { id: 'stale', doc: 'guide/getting-started/run-docker' },
  { id: 'network', doc: 'guide/getting-started/run-docker' },
] as const
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t.title }}</h2>
    <div class="troubles">
      <div v-for="item in troubles" :key="item.id" class="home-panel trouble">
        <p class="trouble__q">
          <Icon name="lucide:alert-circle" size="14" class="trouble__icon" />
          {{ t.items[item.id].q }}
        </p>
        <p class="trouble__a">{{ t.items[item.id].a }}</p>
        <a class="trouble__more" :href="item.doc">{{ t.more }}</a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.troubles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.trouble {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.trouble__q {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: var(--home-text-sm);
  font-weight: 600;
  color: var(--home-text-primary);
}
.trouble__icon {
  flex-shrink: 0;
  color: var(--home-text-muted);
}
.trouble__a {
  margin: 0;
  font-size: var(--home-text-sm);
  color: var(--home-text-muted);
  line-height: var(--home-leading-normal);
}
.trouble__more {
  margin-top: auto;
  font-size: var(--home-text-xs);
  color: var(--home-accent);
  text-decoration: none;
}
.trouble__more:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .troubles {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
