<script setup lang="ts">
import { UiBadge } from '@repo/ui'

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
      <div class="stack">
        <div class="stack__item">
          <span class="stack__name">Node.js</span><UiBadge color="green">v24.13.0</UiBadge>
        </div>
        <div class="stack__item">
          <span class="stack__name">pnpm</span><UiBadge color="green">8.15.5</UiBadge>
        </div>
        <div class="stack__item">
          <span class="stack__name">NestJS</span><UiBadge color="green">11</UiBadge>
        </div>
        <div class="stack__item">
          <span class="stack__name">Nuxt</span><UiBadge color="green">4.4.7</UiBadge>
        </div>
        <div class="stack__item">
          <span class="stack__name">TypeScript</span><UiBadge color="green">6.0.3</UiBadge>
        </div>
      </div>
    </div>

    <div class="panel__section">
      <h2 class="panel__heading">Команды</h2>
      <div class="commands">
        <div class="command">
          <code class="command__cmd">pnpm dev</code><span class="command__desc">запустить всё</span>
        </div>
        <div class="command">
          <code class="command__cmd">pnpm build</code><span class="command__desc">собрать всё</span>
        </div>
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
      <div class="tree">
        <div class="tree__line"><span class="tree__root">template-nest-nuxt/</span></div>
        <div class="tree__line">├── <span class="tree__dir">apps/</span></div>
        <div class="tree__line">
          │&nbsp;&nbsp; ├── <span class="tree__app">backend/</span>
          <span class="tree__comment">← NestJS BFF</span>
        </div>
        <div class="tree__line">│&nbsp;&nbsp; │&nbsp;&nbsp; └── src/</div>
        <div class="tree__line">
          │&nbsp;&nbsp; │&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; ├── app.module.ts
        </div>
        <div class="tree__line">│&nbsp;&nbsp; │&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; └── main.ts</div>
        <div class="tree__line">
          │&nbsp;&nbsp; └── <span class="tree__app">frontend/</span>
          <span class="tree__comment">← Nuxt 4</span>
        </div>
        <div class="tree__line">
          │&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; ├── <span class="tree__key">app/</span>
        </div>
        <div class="tree__line">│&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; │&nbsp;&nbsp; ├── components/</div>
        <div class="tree__line">
          │&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; │&nbsp;&nbsp; ├── composables/
        </div>
        <div class="tree__line">│&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; │&nbsp;&nbsp; ├── layouts/</div>
        <div class="tree__line">│&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; │&nbsp;&nbsp; ├── pages/</div>
        <div class="tree__line">│&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; │&nbsp;&nbsp; └── app.vue</div>
        <div class="tree__line">│&nbsp;&nbsp; &nbsp;&nbsp;&nbsp; └── nuxt.config.ts</div>
        <div class="tree__line">└── <span class="tree__dir">packages/</span></div>
        <div class="tree__line">
          &nbsp;&nbsp;&nbsp; ├── <span class="tree__pkg">shared/</span>
          <span class="tree__comment">← типы, i18n</span>
        </div>
        <div class="tree__line">
          &nbsp;&nbsp;&nbsp; └── <span class="tree__pkg">ui/</span>
          <span class="tree__comment">← UiButton, UiBadge, UiCard</span>
        </div>
      </div>
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

.stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stack__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-radius: 6px;
  background: #020420;
  font-size: 13px;
}

.stack__name {
  color: #94a3b8;
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
}

.tree__line {
  white-space: pre;
  letter-spacing: 0;
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
