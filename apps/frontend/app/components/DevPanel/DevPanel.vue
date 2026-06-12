<script setup lang="ts">
const { get } = useApi()
const { data: backendHealth, error: backendError } = await get<{ status: string }>('/health')
const backendOnline = computed(() => backendHealth.value?.status === 'ok' && !backendError.value)

const {
  public: { backendUrl, appEnv },
} = useRuntimeConfig()
const requestUrl = useRequestURL()
const frontendUrl = requestUrl.origin
const swaggerEnabled = appEnv === 'development'

const route = useRoute()
const router = useRouter()

type RouteMeta = { public?: boolean; guestOnly?: boolean }

function isPublicRoute(meta: RouteMeta) {
  return !!(meta?.public || meta?.guestOnly)
}

const routes = computed(() =>
  router
    .getRoutes()
    .filter((r) => r.path && !r.path.includes(':') && !r.name?.toString().startsWith('_'))
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
</script>

<template>
  <div class="panel">
    <div class="panel__section">
      <h2 class="panel__heading">Окружение</h2>
      <div class="env-row">
        <span class="env-row__key">APP_ENV</span>
        <code class="env-row__value" :class="`env-row__value--${appEnv}`">{{ appEnv }}</code>
      </div>
    </div>

    <div class="panel__section">
      <h2 class="panel__heading">Сервисы</h2>
      <a class="service" :href="`${backendUrl}/health`" target="_blank">
        <span
          class="service__dot"
          :class="backendOnline ? 'service__dot--online' : 'service__dot--offline'"
        />
        <span class="service__name">Backend (NestJS)</span>
        <code class="service__url">{{ backendUrl }}/health</code>
      </a>
      <a class="service" :href="`${frontendUrl}/api/health`" target="_blank">
        <span class="service__dot service__dot--online" />
        <span class="service__name">Frontend (Nuxt)</span>
        <code class="service__url">{{ frontendUrl }}/api/health</code>
      </a>
    </div>

    <div class="panel__section">
      <h2 class="panel__heading">Инструменты</h2>
      <a
        class="service"
        :class="{ 'service--muted': !swaggerEnabled }"
        :href="swaggerEnabled ? `${backendUrl}/api/docs` : undefined"
        :target="swaggerEnabled ? '_blank' : undefined"
      >
        <span
          class="service__dot service__dot--static"
          :style="swaggerEnabled ? 'background: #85ea2d' : 'background: #475569'"
        />
        <span class="service__name">
          Swagger UI
          <span v-if="!swaggerEnabled" class="service__badge">only dev</span>
        </span>
        <code class="service__url">{{ backendUrl }}/api/docs</code>
      </a>
    </div>

    <div class="panel__section">
      <h2 class="panel__heading">Навигация</h2>
      <div class="nav-meta">
        <span class="nav-meta__label">Layout:</span>
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
      </NuxtLink>
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
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #1e293b;
  border-radius: 8px;
  text-decoration: none;
  color: #fff;
  font-size: 13px;
  transition: border-color 0.2s;

  &:hover {
    border-color: #00dc82;
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
      background: #00dc82;
      box-shadow: 0 0 6px #00dc82;
    }

    &--offline {
      background: #ef4444;
      box-shadow: 0 0 6px #ef4444;
    }
  }

  &__name {
    flex: 1;
  }

  &__url {
    font-family: monospace;
    font-size: 11px;
    color: #888;
  }

  &__badge {
    font-size: 10px;
    background: #1e293b;
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
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #1e293b;
  border-radius: 8px;
  font-size: 13px;

  &__key {
    flex: 1;
    color: #64748b;
    font-family: monospace;
    font-size: 11px;
  }

  &__value {
    font-family: monospace;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;

    &--development {
      background: #1c3a2a;
      color: #00dc82;
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
    color: #475569;
  }
  &__value {
    font-family: monospace;
    color: #fbbf24;
  }
}

.nav-route {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border: 1px solid #1e293b;
  border-radius: 8px;
  text-decoration: none;
  color: #94a3b8;
  font-size: 13px;
  transition:
    border-color 0.2s,
    color 0.2s;

  &:hover {
    border-color: #334155;
    color: #e2e8f0;
  }

  &--active {
    border-color: #00dc82;
    color: #e2e8f0;

    .nav-route__dot {
      background: #00dc82;
      box-shadow: 0 0 5px #00dc82;
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

  &__badge {
    font-size: 10px;
    font-family: monospace;
    padding: 2px 6px;
    border-radius: 4px;
    flex-shrink: 0;

    &--public {
      background: #1c3a2a;
      color: #00dc82;
    }
    &--private {
      background: #2a1f1c;
      color: #f59e0b;
    }
  }
}
</style>
