<script setup lang="ts">
import { principles } from './about.data'
const { t } = useI18n()
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t('about.principles.title') }}</h2>
    <div class="principles">
      <div v-for="p in principles" :key="p.titleKey" class="principle">
        <div class="principle__icon">
          <Icon :name="p.icon" size="18" />
        </div>
        <div>
          <p class="principle__title">{{ t(p.titleKey) }}</p>
          <p class="principle__desc">{{ t(p.descKey) }}</p>
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

.principles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.principle {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #0b1525;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 16px;
  transition:
    border-color 0.2s,
    background 0.2s;

  &:hover {
    border-color: rgba(0, 220, 130, 0.25);
    background: rgba(0, 220, 130, 0.03);
  }

  &__icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(0, 220, 130, 0.08);
    color: #00dc82;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #cbd5e1;
    margin: 0 0 4px;
  }

  &__desc {
    font-size: 12px;
    color: #475569;
    margin: 0;
    line-height: 1.5;
  }
}

@media (max-width: 900px) {
  .principles {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .principles {
    grid-template-columns: 1fr;
  }
}
</style>
