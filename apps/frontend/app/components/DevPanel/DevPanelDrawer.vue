<script setup lang="ts">
const devOpen = ref(false)
const panelRef = ref<HTMLElement | null>(null)
const tabRef = ref<HTMLElement | null>(null)

function onDocumentClick(e: MouseEvent) {
  if (!devOpen.value) return
  const target = e.target as Node
  if (panelRef.value?.contains(target) || tabRef.value?.contains(target)) return
  devOpen.value = false
}

onMounted(() => document.addEventListener('click', onDocumentClick, true))
onUnmounted(() => document.removeEventListener('click', onDocumentClick, true))
</script>

<template>
  <button
    ref="tabRef"
    class="dev-tab"
    :class="{ 'dev-tab--open': devOpen }"
    @click="devOpen = !devOpen"
  >
    <Icon name="lucide:terminal" size="11" />
    <span>DEV</span>
    <Icon :name="devOpen ? 'lucide:chevron-right' : 'lucide:chevron-left'" size="11" />
  </button>
  <aside ref="panelRef" class="dev-panel" :class="{ 'dev-panel--open': devOpen }">
    <DevPanel />
  </aside>
</template>

<style lang="scss">
.dev-tab {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  transition:
    right 0.3s ease,
    color 0.15s,
    border-color 0.15s;
  writing-mode: vertical-rl;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 7px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-right: none;
  border-radius: 6px 0 0 6px;
  cursor: pointer;
  color: #475569;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  font-family: system-ui, sans-serif;
  z-index: 10000;

  &--open {
    right: 381px;
  }
  &:hover {
    color: #00dc82;
    border-color: rgba(0, 220, 130, 0.3);
  }
}

.dev-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 381px;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 9999;
  background: #0a1120;
  border-left: 1px solid #1e293b;
  overflow-y: auto;
  font-family: system-ui, sans-serif;

  &--open {
    transform: translateX(0);
  }
}
</style>
