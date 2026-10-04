<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
const home = computed(() => theme.value.home!)
</script>

<!-- Подвал страницы для разработчика: без поддержки шаблона, контактов автора
     и копирайта — проект уже принадлежит разработчику. -->
<template>
  <footer class="footer">
    <div class="footer__glow" />
    <div class="footer__bottom">
      <span>{{ home.footer.poweredBy }} NestJS · Nuxt · VitePress</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  overflow: hidden;
  border-top: 1px solid var(--home-border-2);
  background: var(--home-surface-app);
}
/* Свечение как в hero, но развёрнутое на 180° — из нижнего центра */
.footer__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 50% 100% at 50% 100%,
    rgba(0, 220, 130, 0.08) 0%,
    transparent 70%
  );
  pointer-events: none;
}
.footer__bottom {
  position: relative;
  max-width: var(--home-content-width);
  margin: 0 auto;
  padding: 20px 48px;
  font-size: var(--home-text-sm);
  color: var(--home-text-dim);
}

@media (max-width: 600px) {
  .footer__bottom {
    padding: 20px 16px;
  }
}
</style>
