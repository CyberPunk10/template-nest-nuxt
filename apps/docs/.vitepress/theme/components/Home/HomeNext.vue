<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
const t = computed(() => theme.value.home!.content.next)

const nextLinks = [
  { id: 'architecture', icon: 'layers', doc: 'guide/architecture' },
  { id: 'auth', icon: 'shield-check', doc: 'guide/auth/' },
  { id: 'env', icon: 'key-round', doc: 'guide/env-variables' },
  { id: 'testing', icon: 'check-circle', doc: 'guide/testing/' },
  { id: 'docker', icon: 'boxes', doc: 'guide/docker/' },
  { id: 'proxy', icon: 'network', doc: 'guide/reverse-proxy' },
] as const
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t.title }}</h2>
    <div class="next">
      <a
        v-for="link in nextLinks"
        :key="link.id"
        class="home-card next__card"
        :href="link.doc"
      >
        <span class="next__head">
          <Icon :name="`lucide:${link.icon}`" size="16" class="next__icon" />
          <span class="next__title">{{ t.items[link.id].title }}</span>
        </span>
        <span class="next__desc">{{ t.items[link.id].desc }}</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.next {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.next__card {
  text-decoration: none;
}
.next__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.next__icon {
  color: var(--home-accent);
  flex-shrink: 0;
}
.next__title {
  font-size: var(--home-text-md);
  font-weight: 600;
  color: var(--home-text-primary);
}
.next__desc {
  font-size: var(--home-text-sm);
  color: var(--home-text-muted);
  line-height: var(--home-leading-normal);
}

@media (max-width: 900px) {
  .next {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .next {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
