<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import { useData } from 'vitepress'
import { quickstartSteps } from './home-data'

// Переводы стартовой страницы из themeConfig.home (реактивно к локали VitePress),
// без vue-i18n. theme меняется при смене языка — компонент перерисовывается.
const { theme } = useData()
const home = computed(() => theme.value.home!)

const copied = inject<Ref<string | null>>('copied')!
const copyCmd = inject<(cmd: string) => void>('copyCmd')!
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ home.quickstart.title }}</h2>
    <div class="quickstart">
      <div
        v-for="(step, i) in quickstartSteps"
        :key="i"
        class="qs-step"
        @click="copyCmd(step.cmd)"
      >
        <span class="qs-step__num">{{ i + 1 }}</span>
        <div class="qs-step__body">
          <p class="qs-step__label">{{ home.quickstart.steps[step.id] }}</p>
          <code class="qs-step__cmd">{{ step.cmd }}</code>
        </div>
        <Icon
          :name="copied === step.cmd ? 'lucide:check' : 'lucide:copy'"
          size="13"
          class="qs-step__copy"
          :class="{ 'qs-step__copy--done': copied === step.cmd }"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.quickstart {
  display: flex;
  flex-direction: column;
  max-width: 640px;
}

.qs-step {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--home-border-2);
  cursor: pointer;
}
.qs-step:last-child {
  border-bottom: none;
}
.qs-step__num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 220, 130, 0.08);
  border: 1px solid rgba(0, 220, 130, 0.2);
  color: var(--home-accent);
  font-size: var(--home-text-xs);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.qs-step__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.qs-step__label {
  font-size: var(--home-text-md);
  color: var(--home-text-soft);
  margin: 0;
}
.qs-step__cmd {
  font-family: monospace;
  font-size: var(--home-text-sm);
  color: var(--home-text-muted);
}
.qs-step__copy {
  margin-left: auto;
  margin-top: 2px;
  color: var(--home-border-subtle);
  flex-shrink: 0;
  opacity: 0;
  transition: color 0.15s;
}
.qs-step:hover .qs-step__copy {
  opacity: 1;
  color: var(--home-text-muted);
}
.qs-step__copy--done {
  opacity: 1 !important;
  color: var(--home-accent) !important;
  transition: none;
}
</style>
