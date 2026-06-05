<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="ui-card">
    <div v-if="title" class="ui-card__header">
      <span class="ui-card__title">{{ title }}</span>
    </div>
    <div class="ui-card__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ui-card {
  border: 1px solid #1e293b;
  border-radius: 12px;
  background: #020420;
  overflow: hidden;
}

.ui-card__header {
  padding: 12px 16px;
  border-bottom: 1px solid #1e293b;
}

.ui-card__title {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}

.ui-card__body {
  padding: 16px;
}
</style>
