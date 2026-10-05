<script setup lang="ts">
import { inject, type Ref } from 'vue'

defineProps<{ cmd: string }>()

const copied = inject<Ref<string | null>>('copied')!
const copyCmd = inject<(cmd: string) => void>('copyCmd')!
</script>

<template>
  <button type="button" class="copy-cmd" @click="copyCmd(cmd)">
    <code class="copy-cmd__text">{{ cmd }}</code>
    <Icon
      :name="copied === cmd ? 'lucide:check' : 'lucide:copy'"
      size="12"
      class="copy-cmd__icon"
      :class="{ 'copy-cmd__icon--done': copied === cmd }"
    />
  </button>
</template>

<style scoped>
.copy-cmd {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: 100%;
  padding: 3px 8px;
  border-radius: var(--home-radius-md);
  background: var(--home-surface-deep);
  border: 1px solid var(--home-border-2);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.copy-cmd:hover {
  border-color: color-mix(in srgb, var(--home-accent) 55%, transparent);
  border-style: dashed;
  background: color-mix(in srgb, var(--home-accent) 5%, var(--home-surface-deep));
}
.copy-cmd:hover .copy-cmd__icon {
  color: var(--home-accent);
}
.copy-cmd__text {
  font-family: monospace;
  font-size: var(--home-text-xs);
  color: var(--home-text-primary);
  background: none;
  padding: 0;
  word-break: break-all;
  text-align: left;
}
.copy-cmd__icon {
  flex-shrink: 0;
  color: var(--home-text-muted);
  transition: color 0.15s;
}
.copy-cmd__icon--done {
  color: var(--home-accent);
}
</style>
