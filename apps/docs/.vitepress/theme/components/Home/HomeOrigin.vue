<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import HomeCopyCmd from './HomeCopyCmd.vue'
import { creationMethod, metaRows, sameConfigCmd } from './origin-view'
import { installCmd, repoUrl } from './site-data'

const { theme } = useData()
const t = computed(() => theme.value.home!.content.origin)

// Поле templateOrigin из корневого package.json (читается в config.ts).
// Логика — в origin-view.ts, здесь только тексты и разметка.
const origin = computed(() => theme.value.templateOrigin ?? null)
const method = computed(() => creationMethod(origin.value))
const sameCmd = computed(() => sameConfigCmd(origin.value))

// Левая часть — сплошной текст. Проект создан генератором — сказано только
// о нём. Скопирован напрямую — добавляется абзац о том, как он получен, а
// генератор предлагается как рекомендуемый способ.
const intro = computed(() => {
  if (method.value === 'generator') return t.value.intro.generator
  if (method.value === 'clone') return t.value.intro.clone
  return t.value.intro.none
})
// Проекту из генератора рекомендовать генератор незачем — только команды.
const howto = computed(() => method.value === 'generator' ? null : t.value.howto)

const cmds = computed(() => {
  const list = [{ label: t.value.cmd.latest, cmd: installCmd }]
  if (sameCmd.value) list.push({ label: t.value.cmd.same, cmd: sameCmd.value })
  return list
})

const meta = computed(() => metaRows(origin.value, t.value.meta))

const generatorUrl = 'https://github.com/CyberPunk10/create-nest-nuxt'
const withGeneratorLink = (text: string) => text.split(/(\{generator\})/)

const originLinks = [
  { id: 'generator', url: 'https://www.npmjs.com/package/create-nest-nuxt' },
  { id: 'template', url: repoUrl },
  { id: 'releases', url: `${repoUrl}/releases` },
] as const
</script>

<template>
  <section class="origin">
    <div class="origin__main">
      <h2 class="origin__title">
        <Icon name="lucide:git-branch" size="18" class="origin__icon" />
        {{ t.title }}
      </h2>
      <p class="origin__text">
        <template v-for="(part, i) in withGeneratorLink(intro!)" :key="i">
          <a
            v-if="part === '{generator}'"
            :href="generatorUrl"
            target="_blank"
            rel="noopener"
          >create-nest-nuxt</a>
          <template v-else>{{ part }}</template>
        </template>
      </p>
      <h2 class="origin__title origin__title--next">
        <Icon name="lucide:terminal" size="18" class="origin__icon" />
        {{ t.newTitle }}
      </h2>
      <p v-if="howto" class="origin__text">
        <template v-for="(part, i) in withGeneratorLink(howto!)" :key="i">
          <a
            v-if="part === '{generator}'"
            :href="generatorUrl"
            target="_blank"
            rel="noopener"
          >create-nest-nuxt</a>
          <template v-else>{{ part }}</template>
        </template>
      </p>
      <div v-for="item in cmds" :key="item.cmd" class="origin__cmd">
        <span class="origin__cmd-label">{{ item.label }}</span>
        <HomeCopyCmd :cmd="item.cmd" />
      </div>
      <ul class="origin__links">
        <li v-for="link in originLinks" :key="link.id">
          <a :href="link.url" target="_blank" rel="noopener">{{ t.links[link.id] }}</a>
        </li>
      </ul>
    </div>
    <div class="origin__meta">
      <p class="origin__meta-title">{{ t.meta.title }}</p>
      <dl class="origin__meta-list">
        <div v-for="row in meta" :key="row.label" class="origin__meta-row">
          <dt>{{ row.label }}</dt>
          <dd
            :class="{
              'origin__meta-empty': !row.value || row.unknown,
              'origin__meta-prose': row.prose,
            }"
          >{{ row.value ?? t.meta.empty }}</dd>
          <dd v-if="row.hint" class="origin__meta-hint">{{ row.hint }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<style scoped>
.origin {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 280px);
  gap: 32px;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--home-accent) 30%, transparent);
  background: color-mix(in srgb, var(--home-accent) 5%, transparent);
}
.origin__main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}
.origin__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: var(--home-text-lg);
  font-weight: 700;
  color: var(--home-text-primary);
}
.origin__title--next {
  margin-top: 12px;
}
.origin__icon {
  color: var(--home-accent);
  flex-shrink: 0;
}
.origin__text {
  margin: 0;
  font-size: var(--home-text-sm);
  color: var(--home-text-soft);
  line-height: var(--home-leading-relaxed);
}
.origin__cmd {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  max-width: 100%;
}
.origin__cmd-label {
  font-size: var(--home-text-xs);
  color: var(--home-text-muted);
}
.origin__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  font-size: var(--home-text-sm);
}
.origin__text a,
.origin__links a {
  color: var(--home-accent);
  text-decoration: none;
}
.origin__text a:hover,
.origin__links a:hover {
  text-decoration: underline;
}
.origin__meta {
  padding-left: 24px;
  border-left: 1px solid var(--home-border-subtle);
}
.origin__meta-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}
.origin__meta-title {
  margin: 0 0 4px;
  font-size: var(--home-text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--home-text-muted);
}
.origin__meta-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.origin__meta dt {
  font-size: var(--home-text-xs);
  color: var(--home-text-muted);
}
.origin__meta dd {
  margin: 0;
  font-family: monospace;
  font-size: var(--home-text-sm);
  color: var(--home-text-primary);
}
.origin__meta dd.origin__meta-hint {
  font-family: inherit;
  font-size: var(--home-text-xs);
  color: var(--home-text-muted);
  line-height: var(--home-leading-relaxed);
}
.origin__meta dd.origin__meta-prose {
  font-family: inherit;
}
.origin__meta dd.origin__meta-empty {
  font-family: inherit;
  font-style: italic;
  color: var(--home-text-muted);
}

@media (max-width: 900px) {
  .origin {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
  .origin__meta {
    padding-left: 0;
    padding-top: 16px;
    border-left: none;
    border-top: 1px solid var(--home-border-subtle);
  }
}
</style>
