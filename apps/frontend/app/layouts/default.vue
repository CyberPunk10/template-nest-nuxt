<template>
  <div class="layout">
    <NuxtRouteAnnouncer />
    <div class="layout__content">
      <slot />
    </div>
    <div class="layout__sidebar">
      <DevPanel />
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  font-family: system-ui, sans-serif;
}

.layout__content {
  flex: 1;
  overflow: auto;
}

.layout__sidebar {
  width: 380px;
  background: #0f172a;
  border-left: 1px solid #1e293b;
  overflow: auto;
  flex-shrink: 0;
}
</style>
