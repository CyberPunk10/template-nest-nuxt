<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import HomeCopyCmd from './HomeCopyCmd.vue'

const { theme } = useData()
const t = computed(() => theme.value.home!.content.start)

const steps = computed(() => [
  { cmd: 'pnpm install', desc: t.value.steps.install },
  { cmd: 'pnpm dev', desc: t.value.steps.dev },
  { cmd: 'pnpm docker:up --build', desc: t.value.steps.docker },
])
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t.title }}</h2>
    <div class="home-panel start">
      <p class="start__setup">
        {{ t.setup }}
        <a href="guide/getting-started/setup">{{ t.setupLink }}</a>
      </p>
      <ol class="start__steps">
        <li v-for="step in steps" :key="step.cmd" class="start__step">
          <span class="start__desc">{{ step.desc }}</span>
          <HomeCopyCmd :cmd="step.cmd" />
        </li>
      </ol>
      <p class="start__more">
        {{ t.more }}
        <a href="guide/getting-started/run-pnpm">{{ t.runPnpm }}</a>,
        <a href="guide/getting-started/run-docker">{{ t.runDocker }}</a>
      </p>
    </div>
  </section>
</template>

<style scoped>
.start {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.start__setup,
.start__more {
  margin: 0;
  font-size: var(--home-text-sm);
  color: var(--home-text-muted);
}
.start a {
  color: var(--home-accent);
  text-decoration: none;
}
.start a:hover {
  text-decoration: underline;
}
.start__steps {
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.start__step {
  counter-increment: step;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.start__desc {
  font-size: var(--home-text-sm);
  color: var(--home-text-soft);
}
.start__desc::before {
  content: counter(step) '. ';
  color: var(--home-accent);
  font-weight: 600;
}
</style>
