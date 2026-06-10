<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <div class="layout">
    <NuxtRouteAnnouncer />
    <AppHeader v-if="!route.meta.hideHeader" />
    <div class="layout__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.layout {
  font-family: system-ui, sans-serif;
  transition: padding-right 0.3s ease;
}
</style>
