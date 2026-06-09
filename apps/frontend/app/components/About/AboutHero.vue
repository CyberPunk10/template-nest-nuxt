<script setup lang="ts">
const { t, locale } = useI18n()

const locales = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'th', label: 'TH' },
]
</script>

<template>
  <div class="hero">
    <div class="hero__glow" />
    <div class="hero__content">
      <div class="hero__lang">
        <button
          v-for="l in locales"
          :key="l.code"
          class="hero__lang-btn"
          :class="{ 'hero__lang-btn--active': locale === l.code }"
          @click="locale = l.code as 'ru' | 'en' | 'th'"
        >
          {{ l.label }}
        </button>
      </div>
      <div class="hero__inner">
        <span class="hero__badge">{{ t('about.hero.badge') }}</span>
        <h1 class="hero__title">
          {{ t('about.hero.title') }}<br /><span class="hero__title-accent">{{
            t('about.hero.titleAccent')
          }}</span>
        </h1>
        <p class="hero__subtitle">
          <template v-for="(line, i) in t('about.hero.subtitle').split('\n')" :key="i">
            <br v-if="i > 0" />{{ line }}
          </template>
        </p>
        <div class="hero__actions">
          <a
            class="hero__btn hero__btn--ghost"
            href="https://github.com/CyberPunk10/template-nest-nuxt-docker"
            target="_blank"
            rel="noopener"
          >
            <Icon name="lucide:github" size="15" />
            {{ t('about.hero.github') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hero {
  position: relative;
  overflow: hidden;
  padding: 72px 48px 56px;
  border-bottom: 1px solid #1e293b;

  &__lang {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
    margin-bottom: 32px;
  }

  &__lang-btn {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    cursor: pointer;
    background: transparent;
    border: 1px solid #1e293b;
    color: #475569;
    transition:
      border-color 0.15s,
      color 0.15s;

    &:hover {
      border-color: #334155;
      color: #94a3b8;
    }
    &--active {
      border-color: rgba(0, 220, 130, 0.3);
      color: #00dc82;
    }
  }

  &__glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 50% 100% at 50% 0%,
      rgba(0, 220, 130, 0.08) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  &__content {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
  }

  &__inner {
    max-width: 600px;
  }

  &__badge {
    display: inline-flex;
    background: rgba(0, 220, 130, 0.08);
    border: 1px solid rgba(0, 220, 130, 0.2);
    color: #00dc82;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 4px 12px;
    border-radius: 20px;
    margin-bottom: 20px;
  }

  &__title {
    font-size: 42px;
    font-weight: 800;
    color: #f1f5f9;
    margin: 0 0 16px;
    line-height: 1.15;
  }

  &__title-accent {
    color: #00dc82;
  }

  &__subtitle {
    font-size: 16px;
    color: #475569;
    margin: 0 0 32px;
    line-height: 1.7;
  }

  &__actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition:
      opacity 0.15s,
      background 0.15s,
      border-color 0.15s,
      color 0.15s;

    &--primary {
      background: #00dc82;
      color: #0f172a;
      &:hover {
        opacity: 0.88;
      }
    }

    &--ghost {
      background: transparent;
      border: 1px solid #1e293b;
      color: #64748b;
      &:hover {
        border-color: #334155;
        color: #94a3b8;
      }
    }
  }
}

@media (max-width: 900px) {
  .hero {
    padding: 48px 24px 40px;
  }
  .hero__title {
    font-size: 28px;
  }
}

@media (max-width: 600px) {
  .hero {
    padding: 36px 16px 32px;
  }
  .hero__title {
    font-size: 22px;
  }
  .hero__subtitle {
    font-size: 14px;
  }
  .hero__actions {
    flex-direction: column;
  }
  .hero__btn {
    justify-content: center;
  }
}
</style>
