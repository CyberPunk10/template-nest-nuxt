<script setup lang="ts">
const { get } = useApi()
const { data: backendHealth, error: backendError } = await get<{ status: string }>('/health')
const backendOnline = computed(() => backendHealth.value?.status === 'ok' && !backendError.value)

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
      <h2 class="panel__heading">Инструменты</h2>
      <a class="service" href="http://localhost:3001/api/docs" target="_blank">
        <span class="service__dot service__dot--static" style="background: #85ea2d" />
        <span class="service__name">Swagger UI</span>
        <code class="service__url">:3001/api/docs</code>
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

.service--muted {
  opacity: 0.6;
}

.service__badge {
  font-size: 10px;
  background: #1e293b;
  color: #64748b;
  border-radius: 4px;
  padding: 1px 6px;
  margin-left: 6px;
  font-family: monospace;
}

.nav-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 0 2px;
}

.nav-meta__label {
  color: #475569;
}

.nav-meta__value {
  font-family: monospace;
  color: #fbbf24;
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
}

.nav-route:hover {
  border-color: #334155;
  color: #e2e8f0;
}

.nav-route--active {
  border-color: #00dc82;
  color: #e2e8f0;
}

.nav-route__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #334155;
  transition: background 0.2s;
}

.nav-route--active .nav-route__dot {
  background: #00dc82;
  box-shadow: 0 0 5px #00dc82;
}

.nav-route__path {
  font-family: monospace;
  font-size: 12px;
  flex: 1;
}

.nav-route__badge {
  font-size: 10px;
  font-family: monospace;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.nav-route__badge--public {
  background: #1c3a2a;
  color: #00dc82;
}
.nav-route__badge--private {
  background: #2a1f1c;
  color: #f59e0b;
}
</style>
