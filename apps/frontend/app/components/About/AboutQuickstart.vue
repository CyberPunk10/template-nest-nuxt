<script setup lang="ts">
import { quickstarts } from './about.data'

const copied = inject<Ref<string | null>>('copied')!
const copyCmd = inject<(cmd: string) => void>('copyCmd')!
const { t } = useI18n()

const activeQs = ref(0)
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t('about.quickstart.title') }}</h2>
    <div class="qs-tabs">
      <button
        v-for="(qs, i) in quickstarts"
        :key="qs.branch"
        class="qs-tab"
        :class="{ 'qs-tab--active': activeQs === i }"
        @click="activeQs = i"
      >
        <Icon name="lucide:git-branch" size="11" />
        {{ qs.branch }}
      </button>
    </div>
    <div class="quickstart">
      <div
        v-for="(step, i) in quickstarts[activeQs]?.steps"
        :key="i"
        class="qs-step"
        @click="copyCmd(step.cmd)"
      >
        <span class="qs-step__num">{{ i + 1 }}</span>
        <div class="qs-step__body">
          <p class="qs-step__label">{{ t(step.labelKey) }}</p>
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

<style scoped lang="scss">
.section__title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #334155;
  margin: 0 0 16px;
}

.qs-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.qs-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-family: monospace;
  cursor: pointer;
  background: transparent;
  border: 1px solid #1e293b;
  color: #475569;
  transition:
    border-color 0.15s,
    color 0.15s,
    background 0.15s;

  &:hover {
    border-color: #334155;
    color: #94a3b8;
  }

  &--active {
    border-color: rgba(0, 220, 130, 0.3);
    background: rgba(0, 220, 130, 0.05);
    color: #00dc82;
  }
}

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
  border-bottom: 1px solid #0f1e30;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &__num {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(0, 220, 130, 0.08);
    border: 1px solid rgba(0, 220, 130, 0.2);
    color: #00dc82;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: 13px;
    color: #cbd5e1;
    margin: 0;
  }

  &__cmd {
    font-family: monospace;
    font-size: 12px;
    color: #475569;
  }

  &__copy {
    margin-left: auto;
    margin-top: 2px;
    color: #1e293b;
    flex-shrink: 0;
    opacity: 0;
    transition: color 0.15s;
  }

  &:hover &__copy {
    opacity: 1;
    color: #475569;
  }

  &__copy--done {
    opacity: 1 !important;
    color: #00dc82 !important;
    transition: none;
  }
}
</style>
