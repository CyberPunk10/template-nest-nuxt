<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { stackLogos } from './home-data'
import TechLogo from './TechLogo.vue'

// Переводы стартовой страницы из themeConfig.home (реактивно к локали VitePress),
// без vue-i18n. theme меняется при смене языка — компонент перерисовывается.
const { theme } = useData()
const home = computed(() => theme.value.home!.promo)
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ home.showcase.title }}</h2>
    <p class="showcase__lead">{{ home.showcase.lead }}</p>
    <div class="showcase">
      <a
        v-for="logo in stackLogos"
        :key="logo.id"
        :href="logo.url"
        target="_blank"
        rel="noopener noreferrer"
        class="showcase__item"
        :class="{ 'showcase__item--optional': logo.optional }"
        :style="{ '--logo-color': logo.color }"
      >
        <span v-if="logo.optional" class="showcase__badge">
          <Icon name="lucide:plus" size="11" />
          {{ home.showcase.optionalBadge }}
        </span>
        <div class="showcase__logo">
          <TechLogo :name="logo.id" :size="38" />
        </div>
        <p class="showcase__name">{{ home.showcase.items[logo.id].name }}</p>
        <p class="showcase__role">{{ home.showcase.items[logo.id].role }}</p>
      </a>
    </div>

    <p class="showcase__footnote">
      <span class="showcase__footnote-icon"><Icon name="lucide:plus" size="14" /></span>
      {{ home.showcase.optionalNote }}
    </p>
  </section>
</template>

<style scoped>
.showcase__lead {
  font-size: var(--home-text-md);
  line-height: var(--home-leading-relaxed);
  color: var(--home-text-muted);
  margin: -8px 0 20px;
  max-width: 68ch;
}

.showcase {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.showcase__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  padding: 20px 12px 18px;
  border: 1px solid var(--home-border-subtle);
  border-radius: 10px;
  background: var(--home-surface-2);
  color: inherit;
  text-decoration: none;
  transition:
    border-color 0.2s,
    background 0.2s,
    transform 0.2s;
}
.showcase__item:hover,
.showcase__item:focus-visible {
  /* color-mix даёт подложку и рамку в фирменном цвете технологии,
     не заводя по паре захардкоженных rgba на каждый логотип. */
  border-color: color-mix(in srgb, var(--logo-color) 45%, transparent);
  background: color-mix(in srgb, var(--logo-color) 7%, transparent);
  transform: translateY(-2px);
}

/* Логотип приглушён, пока карточка не в фокусе: восемь брендовых цветов
   одновременно спорят друг с другом и с акцентом витрины. */
.showcase__logo {
  color: var(--home-text-dim);
  transition: color 0.2s;
  margin-bottom: 6px;
}
.showcase__item:hover .showcase__logo,
.showcase__item:focus-visible .showcase__logo {
  color: var(--logo-color);
}

.showcase__name {
  font-size: var(--home-text-lg);
  font-weight: 700;
  letter-spacing: var(--home-tracking-tight);
  color: var(--home-text-primary);
  margin: 0;
}
.showcase__role {
  font-size: var(--home-text-sm);
  line-height: var(--home-leading-normal);
  color: var(--home-text-soft);
  margin: 0;
}
/* Опциональные модули: пунктир вместо сплошной рамки — визуальный сигнал
   «этого нет в базовом шаблоне». Цвет и hover остаются общими, чтобы
   карточки читались как часть той же витрины, а не как отключённые. */
.showcase__item--optional {
  border-style: dashed;
}
.showcase__badge {
  position: absolute;
  top: 7px;
  right: 7px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px 2px 5px;
  border-radius: 20px;
  background: var(--home-surface-badge);
  color: var(--home-text-soft);
  font-size: var(--home-text-xs);
  font-weight: 600;
  line-height: 1.4;
  transition:
    background 0.2s,
    color 0.2s;
}
.showcase__item--optional:hover .showcase__badge {
  background: color-mix(in srgb, var(--logo-color) 22%, transparent);
  color: var(--home-text-strong);
}

.showcase__footnote {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 0;
  font-size: var(--home-text-sm);
  line-height: var(--home-leading-normal);
  color: var(--home-text-muted);
}
.showcase__footnote-icon {
  line-height: 0;
  color: var(--home-text-dim);
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .showcase {
    gap: 8px;
  }
  .showcase__item {
    padding: 16px 8px 14px;
  }
}

/* Подъём карточки при наведении — декоративный. */
@media (prefers-reduced-motion: reduce) {
  .showcase__item {
    transition: border-color 0.2s, background 0.2s;
  }
  .showcase__item:hover {
    transform: none;
  }
}
</style>
