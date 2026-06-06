<script setup lang="ts">
const { get } = useApi()
const { data: backendHealth, error: backendError } = await get<{ status: string }>('/health')
const backendOnline = computed(() => backendHealth.value?.status === 'ok' && !backendError.value)
</script>

<template>
  <div class="panel">
    <div class="panel__section">
      <h2 class="panel__heading">Сервисы</h2>
      <a class="service" href="http://localhost:3001/health" target="_blank">
        <span
          class="service__dot"
          :class="backendOnline ? 'service__dot--online' : 'service__dot--offline'"
        />
        <span class="service__name">Backend (NestJS)</span>
        <code class="service__url">:3001/health</code>
      </a>
      <a class="service" href="http://localhost:3000/api/health" target="_blank">
        <span class="service__dot service__dot--online" />
        <span class="service__name">Frontend (Nuxt)</span>
        <code class="service__url">:3000/api/health</code>
      </a>
    </div>

    <div class="panel__section">
      <h2 class="panel__heading">Стек</h2>
      <div class="badges">
        <span class="badge"
          ><span class="badge__name">Node.js</span
          ><span class="badge__version" style="background: #339933">24</span></span
        >
        <span class="badge"
          ><span class="badge__name">pnpm</span
          ><span class="badge__version" style="background: #f69220">11</span></span
        >
        <span class="badge"
          ><span class="badge__name">NestJS</span
          ><span class="badge__version" style="background: #e0234e">11</span></span
        >
        <span class="badge"
          ><span class="badge__name">Nuxt</span
          ><span class="badge__version" style="background: #00dc82; color: #003d24">4</span></span
        >
        <span class="badge"
          ><span class="badge__name">TypeScript</span
          ><span class="badge__version" style="background: #3178c6">6</span></span
        >
        <span class="badge"
          ><span class="badge__name">Docker</span
          ><span class="badge__version" style="background: #2496ed">✓</span></span
        >
      </div>
    </div>

    <div class="panel__section">
      <h2 class="panel__heading">Команды</h2>
      <p class="commands__label">Dev</p>
      <div class="commands">
        <div class="command">
          <code class="command__cmd">pnpm dev</code
          ><span class="command__desc">запустить приложения</span>
        </div>
        <div class="command">
          <code class="command__cmd">docker compose -f docker-compose.dev.yml up -d</code
          ><span class="command__desc">инфраструктура</span>
        </div>
      </div>
      <p class="commands__label">Prod</p>
      <div class="commands">
        <div class="command">
          <code class="command__cmd">pnpm build</code><span class="command__desc">собрать всё</span>
        </div>
        <div class="command">
          <code class="command__cmd">docker compose up --build</code
          ><span class="command__desc">все сервисы в Docker</span>
        </div>
        <div class="command">
          <code class="command__cmd">docker compose down</code
          ><span class="command__desc">остановить</span>
        </div>
      </div>
      <p class="commands__label">Утилиты</p>
      <div class="commands">
        <div class="command">
          <code class="command__cmd">pnpm lint</code
          ><span class="command__desc">проверить код</span>
        </div>
        <div class="command">
          <code class="command__cmd">pnpm type-check</code
          ><span class="command__desc">проверить типы</span>
        </div>
      </div>
    </div>

    <div class="panel__section">
      <h2 class="panel__heading">Структура</h2>
      <pre class="tree"><span class="tree__root">template-nest-nuxt/</span>
├── <span class="tree__dir">apps/</span>
│   ├── <span class="tree__app">backend/</span> <span class="tree__comment">← NestJS BFF</span>
│   │   └── src/
│   │       ├── app.module.ts
│   │       └── main.ts
│   └── <span class="tree__app">frontend/</span> <span class="tree__comment">← Nuxt 4</span>
│       ├── <span class="tree__key">app/</span>
│       │   ├── components/
│       │   ├── composables/
│       │   ├── layouts/
│       │   ├── pages/
│       │   └── app.vue
│       └── nuxt.config.ts
└── <span class="tree__dir">packages/</span>
    ├── <span class="tree__pkg">shared/</span> <span class="tree__comment">← типы, i18n</span>
    └── <span class="tree__pkg">ui/</span> <span class="tree__comment">← UiButton, UiBadge, UiCard</span></pre>
    </div>
  </div>
</template>

<style scoped>
.panel {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.panel__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel__heading {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888;
}

.service {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #1e293b;
  border-radius: 8px;
  text-decoration: none;
  color: #fff;
  font-size: 13px;
  transition: border-color 0.2s;
}

a.service:hover {
  border-color: #00dc82;
}

.service__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.service__dot--online {
  background: #00dc82;
  box-shadow: 0 0 6px #00dc82;
}

.service__dot--offline {
  background: #ef4444;
  box-shadow: 0 0 6px #ef4444;
}

.service__name {
  flex: 1;
}

.service__url {
  font-family: monospace;
  font-size: 11px;
  color: #888;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge {
  display: inline-flex;
  border-radius: 6px;
  overflow: hidden;
  font-size: 11px;
  font-weight: 500;
}

.badge__name {
  background: #1e293b;
  color: #94a3b8;
  padding: 4px 8px;
}

.badge__version {
  padding: 4px 8px;
  font-weight: 700;
  color: #fff;
}

.commands__label {
  font-size: 11px;
  color: #475569;
  margin: 0;
}

.commands {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.command {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-radius: 6px;
  background: #020420;
  font-size: 13px;
}

.command__cmd {
  font-family: monospace;
  font-size: 12px;
  color: #e2e8f0;
}

.command__desc {
  font-size: 12px;
  color: #888;
}

.tree {
  font-family: monospace;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.8;
  background: #020420;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 12px 14px;
  margin: 0;
}

.tree__root {
  color: #fff;
  font-weight: 600;
}
.tree__dir {
  color: #7dd3fc;
}
.tree__app {
  color: #00dc82;
  font-weight: 600;
}
.tree__pkg {
  color: #a78bfa;
  font-weight: 600;
}
.tree__key {
  color: #fbbf24;
}
.tree__comment {
  color: #475569;
  font-style: italic;
}
</style>
