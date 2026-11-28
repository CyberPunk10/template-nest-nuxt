<script setup lang="ts">
defineProps<{
  avatar: string
  name: string | undefined
  email: string | undefined
  isAdmin: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <div class="hero">
    <div class="hero__bg" />
    <div class="hero__inner">
      <div class="hero__avatar">{{ avatar }}</div>
      <div class="hero__meta">
        <h1 class="hero__name">{{ name }}</h1>
        <p class="hero__email">{{ email }}</p>
        <span v-if="isAdmin" class="hero__role">{{ t('profile.roles.admin') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$green-dark: #00b368;
$bg-page: #080f1a;
$text-primary: #f1f5f9;

.hero {
  position: relative;
  overflow: hidden;
  padding: 40px 32px 32px;
  border-bottom: 1px solid var(--border-subtle);

  &__bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 80% at 10% 50%, rgba(0, 220, 130, 0.07) 0%, transparent 70%),
      linear-gradient(180deg, var(--surface-card) 0%, $bg-page 100%);
  }

  &__inner {
    position: relative;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &__avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent) 0%, $green-dark 100%);
    color: var(--surface-card);
    font-size: 28px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow:
      0 0 0 3px rgba(0, 220, 130, 0.15),
      0 8px 24px rgba(0, 0, 0, 0.4);
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__name {
    font-size: 22px;
    font-weight: 700;
    color: $text-primary;
    margin: 0;
    line-height: 1;
  }

  &__email {
    font-size: var(--text-sm);
    color: var(--text-muted);
    margin: 0;
  }

  &__role {
    display: inline-flex;
    align-items: center;
    background: rgba(0, 220, 130, 0.1);
    border: 1px solid rgba(0, 220, 130, 0.25);
    color: var(--accent);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border-radius: 20px;
    margin-top: 2px;
    width: fit-content;
  }
}
</style>
