<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import HomeCopyCmd from './HomeCopyCmd.vue'
import { projectMeta } from './project-meta'
import { installCmd, repoUrl } from './site-data'

const { theme } = useData()
const t = computed(() => theme.value.home!.content.origin)

const meta = computed(() => [
  { label: t.value.meta.variant, value: projectMeta.variant },
  { label: t.value.meta.version, value: projectMeta.templateVersion },
  { label: t.value.meta.created, value: projectMeta.createdAt },
])

const originLinks = [
  { id: 'generator', url: 'https://www.npmjs.com/package/create-nest-nuxt' },
  { id: 'template', url: repoUrl },
  { id: 'releases', url: `${repoUrl}/releases` },
] as const
</script>

<template>
  <section class="origin">
    <div class="origin__main">
      <h2 class="origin__title">
        <Icon name="lucide:rocket" size="18" class="origin__icon" />
        {{ t.title }}
      </h2>
      <p class="origin__text">{{ t.text }}</p>
      <HomeCopyCmd :cmd="installCmd" />
      <ul class="origin__links">
        <li v-for="link in originLinks" :key="link.id">
          <a :href="link.url" target="_blank" rel="noopener">{{ t.links[link.id] }}</a>
        </li>
      </ul>
    </div>
    <div class="origin__meta">
      <p class="origin__meta-title">{{ t.meta.title }}</p>
      <dl class="origin__meta-list">
        <div v-for="row in meta" :key="row.label" class="origin__meta-row">
          <dt>{{ row.label }}</dt>
          <dd :class="{ 'origin__meta-empty': !row.value }">{{ row.value ?? t.meta.empty }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<style scoped>
.origin {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 280px);
  gap: 32px;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--home-accent) 30%, transparent);
  background: color-mix(in srgb, var(--home-accent) 5%, transparent);
}
.origin__main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}
.origin__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: var(--home-text-lg);
  font-weight: 700;
  color: var(--home-text-primary);
}
.origin__icon {
  color: var(--home-accent);
  flex-shrink: 0;
}
.origin__text {
  margin: 0;
  font-size: var(--home-text-sm);
  color: var(--home-text-soft);
  line-height: var(--home-leading-relaxed);
}
.origin__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--home-text-sm);
}
.origin__links a {
  color: var(--home-accent);
  text-decoration: none;
}
.origin__links a:hover {
  text-decoration: underline;
}
.origin__meta {
  padding-left: 24px;
  border-left: 1px solid var(--home-border-subtle);
}
.origin__meta-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}
.origin__meta-title {
  margin: 0 0 4px;
  font-size: var(--home-text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--home-text-muted);
}
.origin__meta-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.origin__meta dt {
  font-size: var(--home-text-xs);
  color: var(--home-text-muted);
}
.origin__meta dd {
  margin: 0;
  font-family: monospace;
  font-size: var(--home-text-sm);
  color: var(--home-text-primary);
}
.origin__meta dd.origin__meta-empty {
  font-family: inherit;
  font-style: italic;
  color: var(--home-text-muted);
}

@media (max-width: 900px) {
  .origin {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
  .origin__meta {
    padding-left: 0;
    padding-top: 16px;
    border-left: none;
    border-top: 1px solid var(--home-border-subtle);
  }
}
</style>
