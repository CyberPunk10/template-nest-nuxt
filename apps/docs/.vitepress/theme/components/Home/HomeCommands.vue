<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import HomeCopyCmd from './HomeCopyCmd.vue'

// Переводы стартовой страницы из themeConfig.home (реактивно к локали VitePress),
// без vue-i18n. theme меняется при смене языка — computed пересчитывается.
const { theme } = useData()
const home = computed(() => theme.value.home!)

interface Command {
  cmd: string
  // Без подписи — для общеизвестных команд
  desc?: string
}

interface CommandGroup {
  label: string
  commands: Command[]
  // Вторая колонка — короткие команды без подписей
  aside?: boolean
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
        { cmd: 'pnpm docker:up --build', desc: c.items.dockerUp },
        { cmd: 'docker compose down', desc: c.items.dockerDown },
      ],
    },
    {
      label: c.groups.utils,
      aside: true,
      commands: [
        { cmd: 'pnpm lint' },
        { cmd: 'pnpm type-check' },
        { cmd: 'pnpm test' },
        { cmd: 'pnpm test:e2e' },
      ],
    },
  ]
})

const columns = computed(() => [
  { key: 'main', groups: groups.value.filter(g => !g.aside) },
  { key: 'aside', groups: groups.value.filter(g => g.aside) },
])
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ home.commands.title }}</h2>
    <div class="home-panel commands">
      <div class="commands__body">
        <div
          v-for="column in columns"
          :key="column.key"
          class="commands__column"
        >
          <div
            v-for="group in column.groups"
            :key="group.label"
            class="commands__group"
          >
            <p class="commands__label">{{ group.label }}</p>
            <div class="commands__list">
              <div
                v-for="item in group.commands"
                :key="item.cmd"
                class="commands__item"
              >
                <span v-if="item.desc" class="commands__desc">{{ item.desc }}</span>
                <HomeCopyCmd :cmd="item.cmd" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.commands {
  container: commands / inline-size;
}
.commands__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
  gap: 18px 32px;
}
.commands__column {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.commands__group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.commands__label {
  margin: 0;
  font-size: var(--home-text-xs);
  font-weight: 600;
  color: var(--home-text-hover);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.commands__list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.commands__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.commands__desc {
  font-size: var(--home-text-sm);
  color: var(--home-text-soft);
  line-height: var(--home-leading-normal);
}

@container commands (max-width: 379px) {
  .commands__body {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
