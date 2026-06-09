<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t('about.tree.title') }}</h2>
    <pre class="tree"><span class="tree__root">template-nest-nuxt/</span>
├── <span class="tree__dir">apps/</span>
│   ├── <span class="tree__app">backend/</span> <span class="tree__comment">← NestJS BFF</span>
│   │   ├── <span class="tree__docker">Dockerfile</span>
│   │   └── src/
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── <span class="tree__app">frontend/</span> <span class="tree__comment">← Nuxt 4</span>
│       ├── <span class="tree__docker">Dockerfile</span>
│       ├── <span class="tree__key">app/</span>
│       │   ├── components/
│       │   ├── composables/
│       │   ├── layouts/
│       │   ├── pages/
│       │   └── app.vue
│       └── nuxt.config.ts
├── <span class="tree__dir">packages/</span>
│   ├── <span class="tree__pkg">shared/</span> <span class="tree__comment">← типы, i18n</span>
│   └── <span class="tree__pkg">ui/</span> <span class="tree__comment">← UiButton, UiBadge, UiCard</span>
├── <span class="tree__docker">docker-compose.yml</span> <span class="tree__comment">← prod</span>
└── <span class="tree__docker">docker-compose.dev.yml</span> <span class="tree__comment">← dev (PostgreSQL)</span></pre>
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

.tree {
  font-family: monospace;
  font-size: 12px;
  color: #94a3b8;
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

  &__root {
    color: #f1f5f9;
    font-weight: 600;
  }
  &__dir {
    color: #7dd3fc;
  }
  &__app {
    color: #00dc82;
    font-weight: 600;
  }
  &__pkg {
    color: #a78bfa;
    font-weight: 600;
  }
  &__key {
    color: #fbbf24;
  }
  &__comment {
    color: #334155;
    font-style: italic;
  }
  &__docker {
    color: #2496ed;
  }
}
</style>
