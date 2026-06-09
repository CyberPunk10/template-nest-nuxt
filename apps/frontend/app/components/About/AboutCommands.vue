<script setup lang="ts">
const copied = inject<Ref<string | null>>('copied')!
const copyCmd = inject<(cmd: string) => void>('copyCmd')!
const { t } = useI18n()

interface Command {
  cmd: string
  desc: string
}

interface CommandGroup {
  label: string
  commands: Command[]
}

const groups = computed<CommandGroup[]>(() => [
  {
    label: t('about.commands.groups.dev'),
    commands: [
      { cmd: 'pnpm dev', desc: t('about.commands.items.pnpmDev') },
      {
        cmd: 'docker compose -f docker-compose.dev.yml up -d',
        desc: t('about.commands.items.dockerDev'),
      },
    ],
  },
  {
    label: t('about.commands.groups.prod'),
    commands: [
      { cmd: 'pnpm build', desc: t('about.commands.items.pnpmBuild') },
      { cmd: 'docker compose up --build', desc: t('about.commands.items.dockerUp') },
      { cmd: 'docker compose down', desc: t('about.commands.items.dockerDown') },
    ],
  },
  {
    label: t('about.commands.groups.utils'),
    commands: [
      { cmd: 'pnpm lint', desc: t('about.commands.items.pnpmLint') },
      { cmd: 'pnpm type-check', desc: t('about.commands.items.pnpmTypeCheck') },
    ],
  },
  {
    label: t('about.commands.groups.prisma'),
    commands: [
      {
        cmd: 'cd apps/backend && pnpm prisma studio',
        desc: t('about.commands.items.prismaStudio'),
      },
    ],
  },
])
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t('about.commands.title') }}</h2>
    <div class="commands-wrap">
      <div v-for="group in groups" :key="group.label" class="commands-group">
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

<style scoped lang="scss">
.section__title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #334155;
  margin: 0 0 16px;
}

.commands-wrap {
  background: #0b1525;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 16px 18px;
  flex: 1;
}

.commands-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;

  &:last-child {
    margin-bottom: 0;
  }
}

.commands__label {
  font-size: 11px;
  color: #334155;
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
  padding: 8px 10px;
  border-radius: 6px;
  background: #020c18;
  border: 1px solid #0f1f33;
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: #1e293b;
  }

  &__cmd {
    font-family: monospace;
    font-size: 11px;
    color: #e2e8f0;
    word-break: break-all;
  }

  &__copy {
    flex-shrink: 0;
    align-self: flex-start;
    margin-top: 1px;
    color: #1e293b;
    opacity: 0;
    transition: color 0.15s;
  }

  &:hover &__copy {
    opacity: 1;
    color: #475569;
  }

  &__copy--done {
    opacity: 1 !important;
    color: #00dc82 !important;
    transition: none;
  }

  &__desc {
    font-size: 11px;
    color: #334155;
    white-space: nowrap;
    margin-left: auto;
  }
}
</style>
