<script setup lang="ts">
import { ref, provide } from 'vue'
import HomeHero from './Home/HomeHero.vue'
import HomeBodyPromo from './Home/Promo/HomeBodyPromo.vue'
import HomeHeroPromo from './Home/Promo/HomeHero.vue'
import HomeBody from './Home/HomeBody.vue'
import HomeModeSwitch from './Home/Promo/HomeModeSwitch.vue'
import HomeFooter from './Home/HomeFooter.vue'

const mode = ref<'promo' | 'dev'>('promo')

const copied = ref<string | null>(null)

async function copyCmd(cmd: string) {
  await navigator.clipboard.writeText(cmd)
  copied.value = cmd
  setTimeout(() => {
    copied.value = null
  }, 1500)
}

provide('copied', copied)
provide('copyCmd', copyCmd)
</script>

<template>
  <div class="home">
    <HomeHeroPromo v-if="mode === 'promo'" />
    <HomeHero v-else />
    <div class="home__nav-line" />
    <HomeBodyPromo v-if="mode === 'promo'" />
    <HomeBody v-else />
    <HomeFooter />
    <HomeModeSwitch v-model="mode" />
  </div>
</template>

<style>
.home {
  background: var(--home-surface-app);
  color: var(--home-text-primary);
  font-family: system-ui, sans-serif;
}
/* плашка, которая липнет при скролле, создавая эффект
незаметного оформления фиксированной шапки (только desktop) */
.home__nav-line {
  position: sticky;
  top: 0;
  margin-top: calc(-1 * var(--vp-nav-height));
  height: var(--vp-nav-height);
  border-bottom: 1px solid var(--home-border-subtle);
  background-color: var(--home-surface-app);
  z-index: 1;
}
.home__body {
  max-width: var(--home-content-width);
  margin: 0 auto;
  padding: 40px 48px 64px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}
.home__bottom {
  display: grid;
  grid-template-columns: minmax(0, 420px) minmax(0, 420px);
  gap: 24px;
  align-items: stretch;
}
.home__bottom > :deep(.section) {
  display: flex;
  flex-direction: column;
}
.home-card {
  display: flex;
  flex-direction: column;
  gap: var(--home-space-2);
  background: var(--home-surface-2);
  border: 1px solid var(--home-border-subtle);
  border-radius: 10px;
  padding: 16px;
  transition:
    border-color 0.2s,
    background 0.2s,
    transform 0.2s;
}
.home-card:hover {
  border-color: rgba(0, 220, 130, 0.25);
  background: rgba(0, 220, 130, 0.03);
  /* Тот же подъём, что у карточек витрины стека — иначе секции ниже
     выглядят неинтерактивными рядом с ней. */
  transform: translateY(-2px);
}

/* Подъём карточки при наведении — декоративный. */
@media (prefers-reduced-motion: reduce) {
  .home-card {
    transition:
      border-color 0.2s,
      background 0.2s;
  }
  .home-card:hover {
    transform: none;
  }
}
/* Заголовок-метка секции: uppercase с разрядкой уже даёт достаточный вес,
   поэтому ступень берём среднюю — на 2xl метка начинает спорить с hero. */
.section__title {
  font-size: var(--home-text-lg);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--home-text-dim);
  margin: 0 0 16px;
}

@media (max-width: 900px) {
  .home__body {
    padding: 32px 24px 48px;
    gap: 36px;
  }

  .home__bottom {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 600px) {
  .home__body {
    padding: 24px 16px 40px;
    gap: 28px;
  }
}

/* <960px: навбар VitePress в потоке (relative), занимает 64px (--vp-nav-height)
   сверху отдельной полосой. Затягиваем hero под навбар отрицательным margin.
   Фон и glow hero заполняют область под навбаром → прозрачный навбар визуально сливается с hero.
   Sticky-линию отключаем — навбар в потоке. */
@media (max-width: 959px) {
  .home .hero {
    margin-top: calc(-1 * var(--vp-nav-height));
  }
  .home__nav-line {
    position: static;
  }
}
</style>
