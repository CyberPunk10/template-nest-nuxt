<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
import { useData } from 'vitepress'

// Переводы стартовой страницы из themeConfig.home (реактивно к локали VitePress),
// без vue-i18n. theme меняется при смене языка — computed пересчитывается.
const { theme } = useData()
const home = computed(() => theme.value.home!)

const copied = inject<Ref<string | null>>('copied')!
const copyCmd = inject<(cmd: string) => void>('copyCmd')!

interface Command {
  cmd: string
  desc: string
}

interface CommandGroup {
  label: string
  commands: Command[]
}

const groups = computed<CommandGroup[]>(() => {
  const c = home.value.commands
  return [
    {
      label: c.groups.dev,
      commands: [{ cmd: 'pnpm dev', desc: c.items.pnpmDev }],
    },
    {
      label: c.groups.prod,
      commands: [
        { cmd: 'pnpm build', desc: c.items.pnpmBuild },
        { cmd: 'docker compose up --build', desc: c.items.dockerUp },
        { cmd: 'docker compose down', desc: c.items.dockerDown },
      ],
    },
    {
      label: c.groups.utils,
      commands: [
        { cmd: 'pnpm lint', desc: c.items.pnpmLint },
        { cmd: 'pnpm type-check', desc: c.items.pnpmTypeCheck },
      ],
    },
  ]
})
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ home.commands.title }}</h2>
    <div class="commands-wrap">
      <div
        v-for="group in groups"
        :key="group.label"
        class="commands-group"
      >
        <p class="commands__label">{{ group.label }}</p>
        <div class="commands">
          <div
            v-for="item in group.commands"
            :key="item.cmd"
            class="command"
            @click="copyCmd(item.cmd)"
          >
            <code class="command__cmd">{{ item.cmd }}</code>
            <Icon
              :name="copied === item.cmd ? 'lucide:check' : 'lucide:copy'"
              size="12"
              class="command__copy"
              :class="{ 'command__copy--done': copied === item.cmd }"
            />
            <span class="command__desc">{{ item.desc }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.commands-wrap {
  background: var(--home-surface-2);
  border: 1px solid var(--home-border-subtle);
  border-radius: 10px;
  padding: 16px 18px;
  flex: 1;
}

.commands-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}
.commands-group:last-child {
  margin-bottom: 0;
}

.commands__label {
  font-size: var(--home-text-xs);
  color: var(--home-text-dim);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.commands {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.command {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: var(--home-space-2) 10px;
  border-radius: var(--home-radius-md);
  background: var(--home-surface-deep);
  border: 1px solid var(--home-border-2);
  cursor: pointer;
  transition: border-color 0.15s;
}
.command:hover {
  border-color: var(--home-border-subtle);
}
.command__cmd {
  font-family: monospace;
  font-size: var(--home-text-xs);
  color: var(--home-text-primary);
  word-break: break-all;
}
.command__copy {
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 1px;
  color: var(--home-border-subtle);
  opacity: 0;
  transition: color 0.15s;
}
.command:hover .command__copy {
  opacity: 1;
  color: var(--home-text-muted);
}
.command__copy--done {
  opacity: 1 !important;
  color: var(--home-accent) !important;
  transition: none;
}
.command__desc {
  font-size: var(--home-text-xs);
  color: var(--home-text-dim);
  white-space: nowrap;
  margin-left: auto;
}

/* На телефоне описание встаёт над командой: в одну строку они не помещаются */
@media (max-width: 600px) {
  .command {
    flex-wrap: wrap;
    row-gap: 4px;
  }
  .command__desc {
    order: -1;
    flex-basis: 100%;
    margin-left: 0;
    white-space: normal;
  }
}
</style>
