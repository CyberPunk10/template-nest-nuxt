<script setup lang="ts">
defineProps<{
  color?: 'green' | 'yellow' | 'red' | 'gray'
}>()
</script>

<template>
  <span class="ui-badge" :class="`ui-badge--${color ?? 'gray'}`">
    <slot />
  </span>
</template>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ui-badge--green {
  background: #052e16;
  color: #00dc82;
}
.ui-badge--yellow {
  background: #2d1f00;
  color: #fbbf24;
}
.ui-badge--red {
  background: #2d0a0a;
  color: #ef4444;
}
.ui-badge--gray {
  background: #1e293b;
  color: #94a3b8;
}
</style>
