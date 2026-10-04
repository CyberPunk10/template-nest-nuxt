<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import HomeCopyCmd from './HomeCopyCmd.vue'

const { theme } = useData()
const t = computed(() => theme.value.home!.content.docsGuide)

const commands = computed(() => [
  { cmd: 'pnpm --filter @repo/docs dev', desc: t.value.commands.dev },
  { cmd: 'pnpm --filter @repo/docs build', desc: t.value.commands.build },
])
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t.title }}</h2>
    <div class="home-panel docs-guide">
      <ul class="docs-guide__list">
        <li v-for="(text, id) in t.items" :key="id">{{ text }}</li>
      </ul>
      <div class="docs-guide__commands">
        <div v-for="item in commands" :key="item.cmd" class="docs-guide__command">
          <span class="docs-guide__desc">{{ item.desc }}</span>
          <HomeCopyCmd :cmd="item.cmd" />
        </div>
      </div>
      <a class="docs-guide__more" href="guide/structure/apps/docs/">
        {{ t.more }}
        <Icon name="lucide:arrow-right" size="12" />
      </a>
    </div>
  </section>
</template>

<style scoped>
.docs-guide {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.docs-guide__list {
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
.docs-guide__list ::marker {
  color: var(--home-accent);
}
.docs-guide__commands {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.docs-guide__command {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.docs-guide__desc {
  font-size: var(--home-text-xs);
  color: var(--home-text-muted);
}
.docs-guide__more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  font-size: var(--home-text-sm);
  color: var(--home-accent);
  text-decoration: none;
}
.docs-guide__more:hover {
  text-decoration: underline;
}
</style>
