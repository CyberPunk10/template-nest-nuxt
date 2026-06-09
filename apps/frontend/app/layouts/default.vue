<template>
  <div class="layout">
    <NuxtRouteAnnouncer />
    <div class="layout__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  font-family: system-ui, sans-serif;
}

.layout__content {
  height: 100%;
}
</style>
