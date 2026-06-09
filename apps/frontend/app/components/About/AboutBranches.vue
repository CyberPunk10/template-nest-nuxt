<script setup lang="ts">
import { branches } from './about.data'
const { t } = useI18n()
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t('about.branches.title') }}</h2>
    <div class="branches">
      <div
        v-for="(b, bi) in branches"
        :key="b.name"
        class="branch-card"
        :class="{ 'branch-card--current': b.current }"
      >
        <div class="branch-card__header">
          <div class="branch-card__name-row">
            <Icon name="lucide:git-branch" size="12" class="branch-card__icon" />
            <code class="branch-card__name">{{ b.name }}</code>
            <span v-if="b.current" class="branch-card__badge">{{
              t('about.branches.current')
            }}</span>
          </div>
          <span class="branch-card__label">{{ t(b.labelKey) }}</span>
        </div>
        <p class="branch-card__desc">{{ t(b.descKey) }}</p>
        <div v-if="bi > 0" class="branch-card__base">
          <Icon name="lucide:layers" size="11" />
          {{ t('about.branches.basedOn') }} <code>{{ branches[bi - 1]?.name }}</code>
        </div>
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

.branches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.branch-card {
  background: #0b1525;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition:
    border-color 0.2s,
    background 0.2s;

  &:hover {
    border-color: rgba(0, 220, 130, 0.2);
    background: rgba(0, 220, 130, 0.025);
  }

  &--current {
    border-color: rgba(0, 220, 130, 0.3);
    background: rgba(0, 220, 130, 0.03);

    &:hover {
      border-color: rgba(0, 220, 130, 0.45);
      background: rgba(0, 220, 130, 0.06);
    }
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  &__icon {
    color: #334155;
  }

  &__name {
    font-family: monospace;
    font-size: 12px;
    color: #00dc82;
  }

  &__badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: rgba(0, 220, 130, 0.12);
    color: #00dc82;
    border-radius: 4px;
    padding: 2px 5px;
  }

  &__label {
    font-size: 15px;
    font-weight: 700;
    color: #e2e8f0;
  }

  &__desc {
    font-size: 12px;
    color: #475569;
    margin: 0;
    line-height: 1.5;
  }

  &__base {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: #334155;
    margin-top: 2px;

    code {
      font-family: monospace;
      color: #475569;
    }
  }
}

@media (max-width: 900px) {
  .branches {
    grid-template-columns: 1fr;
  }
}
</style>
