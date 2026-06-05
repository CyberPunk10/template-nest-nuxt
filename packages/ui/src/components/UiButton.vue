<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    class="ui-button"
    :class="`ui-button--${variant ?? 'primary'}`"
    :type="type ?? 'button'"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    opacity 0.15s,
    background 0.15s;
}

.ui-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ui-button--primary {
  background: #00dc82;
  color: #0f172a;
}

.ui-button--primary:hover:not(:disabled) {
  background: #00c974;
}

.ui-button--ghost {
  background: transparent;
  border-color: #1e293b;
  color: #e2e8f0;
}

.ui-button--ghost:hover:not(:disabled) {
  border-color: #00dc82;
  color: #00dc82;
}

.ui-button--danger {
  background: transparent;
  border-color: #1e293b;
  color: #475569;
  padding: 6px;
  width: 30px;
  height: 30px;
}

.ui-button--danger:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
}
</style>
