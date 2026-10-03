<script setup lang="ts">
import DevPanelViewport from './DevPanelViewport.vue'
import { useDevLinks } from './composables/useDevLinks'

// меняется вручную при переключении на другую ветку шаблона
const appBranch = 'auth-session'

const { t } = useI18n()

const {
  public: { appEnv, docsUrl, appVersion },
} = useRuntimeConfig()

const frontendUrl = useRequestURL().origin

// Адреса сервисов приходят от самого бэкенда — фронтенду не нужно знать
// ни его порт, ни способ развёртывания.
const {
  backendHealthUrl,
  backendOnline,
  swaggerEnabled,
  swaggerUrl,
} = useDevLinks()

const route = useRoute()
const router = useRouter()

type RouteMeta = { public?: boolean, guestOnly?: boolean }

function isPublicRoute(meta: RouteMeta) {
  return !!(meta?.public || meta?.guestOnly)
}

const routes = computed(() =>
  router
    .getRoutes()
    .filter(r => r.path && !r.path.includes(':') && !r.name?.toString().startsWith('_'))
    .sort((a, b) => {
      const aPublic = isPublicRoute(a.meta as RouteMeta)
      const bPublic = isPublicRoute(b.meta as RouteMeta)
      if (aPublic !== bPublic) return aPublic ? 1 : -1
      return a.path.localeCompare(b.path)
    }),
)

const currentLayout = computed(() => {
  const meta = route.meta as { layout?: string }
  return meta.layout ?? 'default'
})

function isPublic(r: ReturnType<typeof router.getRoutes>[number]): boolean {
  return isPublicRoute(r.meta as RouteMeta)
}

// Схему и хост в списке отбрасываем: в dev это всегда localhost, в проде —
// один и тот же домен у всех ссылок, различает их только порт и путь.
// Полный адрес остаётся в href и виден в статусной строке браузера.
//
// База для new URL нужна только для разбора относительных адресов (в проде
// publicUrl пустой, и ссылка выглядит как /api/health). Порт при этом берём
// исключительно из самого url: иначе относительный адрес унаследовал бы порт
// фронтенда и показывал бы :3200 там, где никакого порта нет.
function shortUrl(url: string): string {
  try {
    const { pathname, search } = new URL(url, frontendUrl)
    const port = url.match(/^\w+:\/\/[^/]*?(:\d+)/)?.[1] ?? ''
    return `${port}${pathname}${search}`
  } catch {
    return url
  }
}
</script>

<template>
  <div class="panel">
    <div class="panel__section">
      <h2 class="panel__heading">{{ t('devPanel.about') }}</h2>
      <div class="nav-meta">
        <span class="nav-meta__label">{{ t('devPanel.version') }}</span>
        <code class="nav-meta__value">{{ appVersion }}</code>
      </div>
      <div class="nav-meta">
        <span class="nav-meta__label">{{ t('devPanel.branch') }}</span>
        <code class="nav-meta__value">{{ appBranch }}</code>
      </div>
    </div>

    <div class="panel__section">
      <h2 class="panel__heading">{{ t('devPanel.environment') }}</h2>
      <div class="env-row">
        <span class="env-row__key">APP_ENV</span>
        <code class="env-row__value" :class="`env-row__value--${appEnv}`">{{ appEnv }}</code>
      </div>
    </div>

    <div class="panel__section">
      <h2 class="panel__heading">{{ t('devPanel.services') }}</h2>
      <a
        class="service"
        :href="backendHealthUrl"
        target="_blank"
      >
        <span
          class="service__dot"
          :class="backendOnline ? 'service__dot--online' : 'service__dot--offline'"
        />
        <span class="service__name">Backend (NestJS)</span>
        <code class="service__url">{{ shortUrl(backendHealthUrl) }}</code>
        <Icon class="service__ext" name="lucide:external-link" size="12" />
      </a>
      <a
        class="service"
        :href="`${frontendUrl}/api/health`"
        target="_blank"
      >
        <span class="service__dot service__dot--online" />
        <span class="service__name">Frontend (Nuxt)</span>
        <code class="service__url">{{ shortUrl(`${frontendUrl}/api/health`) }}</code>
        <Icon class="service__ext" name="lucide:external-link" size="12" />
      </a>
    </div>

    <div class="panel__section">
      <h2 class="panel__heading">{{ t('devPanel.tools') }}</h2>
      <a
        class="service"
        :class="{ 'service--muted': !swaggerEnabled }"
        :href="swaggerEnabled ? swaggerUrl : undefined"
        :target="swaggerEnabled ? '_blank' : undefined"
      >
        <span
          class="service__dot service__dot--static"
          :style="swaggerEnabled ? 'background: #85ea2d' : 'background: #475569'"
        />
        <span class="service__name">
          Swagger UI
          <span v-if="!swaggerEnabled" class="service__badge">{{ t('devPanel.onlyDev') }}</span>
        </span>
        <code class="service__url">{{ shortUrl(swaggerUrl) }}</code>
        <Icon
          v-if="swaggerEnabled"
          class="service__ext"
          name="lucide:external-link"
          size="12"
        />
      </a>
      <a
        class="service"
        :href="docsUrl"
      >
        <span class="service__dot service__dot--static" style="background: #38bdf8" />
        <span class="service__name">{{ t('devPanel.docs') }}</span>
        <code class="service__url">{{ shortUrl(docsUrl) }}</code>
        <Icon class="service__ext" name="lucide:external-link" size="12" />
      </a>
    </div>

    <div class="panel__section">
      <h2 class="panel__heading">{{ t('devPanel.navigation') }}</h2>
      <div class="nav-meta">
        <span class="nav-meta__label">{{ t('devPanel.layout') }}</span>
        <code class="nav-meta__value">{{ currentLayout }}</code>
      </div>
      <NuxtLink
        v-for="r in routes"
        :key="r.path"
        :to="r.path"
        class="nav-route"
        :class="{ 'nav-route--active': route.path === r.path }"
      >
        <span class="nav-route__dot" />
        <code class="nav-route__path">{{ r.path }}</code>
        <span
          class="nav-route__badge"
          :class="isPublic(r) ? 'nav-route__badge--public' : 'nav-route__badge--private'"
        >
          {{ isPublic(r) ? 'public' : 'private' }}
        </span>
      </NuxtLink>
    </div>

    <div class="panel__section">
      <h2 class="panel__heading">{{ t('devPanel.viewport') }}</h2>
      <DevPanelViewport />
    </div>
  </div>
</template>

<style scoped lang="scss">
.panel {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  &__section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__heading {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #888;
  }
}

.service {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--accent);
  }

  &--muted {
    opacity: 0.45;
    cursor: default;
    pointer-events: none;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;

    &--online {
      background: var(--accent);
      box-shadow: 0 0 6px var(--accent);
    }

    &--offline {
      background: #ef4444;
      box-shadow: 0 0 6px #ef4444;
    }
  }

  &__name {
    flex: 1;
    white-space: nowrap;
  }

  &__url {
    font-family: monospace;
    font-size: 11px;
    color: #64748b;
    // min-width даёт ellipsis сработать: без него flex-элемент не сжимается
    // ниже ширины своего содержимого.
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__ext {
    flex-shrink: 0;
    color: #334155;
    transition: color 0.2s;
  }

  &:hover &__ext {
    color: var(--accent);
  }

  &__badge {
    font-size: 10px;
    background: var(--border-subtle);
    color: #64748b;
    border-radius: 4px;
    padding: 1px 6px;
    margin-left: 6px;
    font-family: monospace;
  }
}

.env-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);

  &__key {
    flex: 1;
    color: #64748b;
    font-family: monospace;
    font-size: 11px;
  }

  &__value {
    font-family: monospace;
    font-size: 11px;
    padding: 2px var(--space-2);
    border-radius: 4px;
    font-weight: 600;

    &--development {
      background: #1c3a2a;
      color: var(--accent);
    }
    &--production {
      background: #2a1c1c;
      color: #ef4444;
    }
    &--staging {
      background: #2a2a1c;
      color: #fbbf24;
    }
    &--prod_qa {
      background: #1c2a2a;
      color: #38bdf8;
    }
  }
}

.nav-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 0 2px;

  &__label {
    color: var(--text-muted);
  }
  &__value {
    font-family: monospace;
    color: #fbbf24;
  }
}

.nav-route {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 7px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition:
    border-color 0.2s,
    color 0.2s;

  &:hover {
    border-color: #334155;
    color: var(--text-primary);
  }

  &--active {
    border-color: var(--accent);
    color: var(--text-primary);

    .nav-route__dot {
      background: var(--accent);
      box-shadow: 0 0 5px var(--accent);
    }
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    background: #334155;
    transition: background 0.2s;
  }

  &__path {
    font-family: monospace;
    font-size: 12px;
    flex: 1;
  }

  &__ext {
    flex-shrink: 0;
    color: #334155;
    transition: color 0.2s;
  }

  &:hover &__ext {
    color: var(--accent);
  }

  &__badge {
    font-size: 10px;
    font-family: monospace;
    padding: 2px 6px;
    border-radius: 4px;
    flex-shrink: 0;

    &--public {
      background: #1c3a2a;
      color: var(--accent);
    }
    &--private {
      background: #2a1f1c;
      color: #f59e0b;
    }
  }
}
</style>
