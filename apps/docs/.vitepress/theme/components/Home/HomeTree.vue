<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

// Переводы стартовой страницы из themeConfig.home (реактивно к локали VitePress),
// без vue-i18n. theme меняется при смене языка — компонент перерисовывается.
const { theme } = useData()
const home = computed(() => theme.value.home!)
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ home.tree.title }}</h2>
    <pre class="tree"><span class="tree__root">template-nest-nuxt/</span>
├── <span class="tree__dir">apps/</span>
│   ├── <span class="tree__app">backend/</span> <span class="tree__comment">← NestJS BFF</span>
│   │   ├── <span class="tree__docker">Dockerfile</span>
│   │   └── src/
│   │       ├── app.module.ts
│   │       └── main.ts
│   ├── <span class="tree__app">frontend/</span> <span class="tree__comment">← Nuxt 4</span>
│   │   ├── <span class="tree__docker">Dockerfile</span>
│   │   ├── <span class="tree__key">app/</span>
│   │   │   ├── components/
│   │   │   └── app.vue
│   │   └── nuxt.config.ts
│   └── <span class="tree__app">docs/</span> <span class="tree__comment">← VitePress</span>
│       ├── <span class="tree__docker">Dockerfile</span>
│       ├── <span class="tree__key">guide/</span>
│       └── .vitepress/
├── <span class="tree__dir">packages/</span>
│   ├── <span class="tree__pkg">shared/</span> <span class="tree__comment">← типы, i18n</span>
│   └── <span class="tree__pkg">ui/</span> <span class="tree__comment">← UiButton, UiBadge, UiCard</span>
└── <span class="tree__docker">docker-compose.yml</span> <span class="tree__comment">← PostgreSQL + профиль app</span></pre>
  </section>
</template>

<style scoped>
.tree {
  font-family: monospace;
  font-size: var(--text-sm);
  color: var(--home-text-dim);
  /* Не из шкалы: дерево файлов — моноширинный блок, интервал здесь
     структурный (высота строки = шаг вложенности), а не текстовый. */
  line-height: 1.8;
  background: linear-gradient(
    135deg,
    rgba(0, 220, 130, 0.04) 0%,
    rgba(0, 220, 130, 0.01) 50%,
    transparent 100%
  );
  border: 1px solid rgba(0, 220, 130, 0.1);
  border-radius: 10px;
  padding: 16px 18px;
  margin: 0;
  overflow-x: auto;
  flex: 1;
}
.tree__root {
  color: var(--home-text-strong);
  font-weight: 600;
}
.tree__dir {
  color: var(--home-tree-dir);
}
.tree__app {
  color: var(--home-accent);
  font-weight: 600;
}
.tree__pkg {
  color: var(--home-tree-pkg);
  font-weight: 600;
}
.tree__key {
  color: var(--home-tree-key);
}
.tree__comment {
  color: var(--home-text-dim);
  font-style: italic;
}
.tree__docker {
  color: var(--home-tree-docker);
}
</style>
