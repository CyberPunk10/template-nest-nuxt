<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { theme } = useData()
const t = computed(() => theme.value.home!.content.structure)

// Короткий вариант есть только у длинных описаний — остальные и так помещаются
function shortDesc(id: string) {
  return (t.value.short as Record<string, string>)[id] ?? t.value.items[id as keyof typeof t.value.items]
}

const structureTree = [
  { id: 'root', prefix: '', name: 'my-app/', kind: 'root', doc: 'guide/structure/' },
  { id: 'apps', prefix: '├── ', name: 'apps/', kind: 'dir', doc: 'guide/structure/apps/' },
  { id: 'backend', prefix: '│   ├── ', name: 'backend/', kind: 'app', doc: 'guide/structure/apps/backend/' },
  { id: 'frontend', prefix: '│   ├── ', name: 'frontend/', kind: 'app', doc: 'guide/structure/apps/frontend/' },
  { id: 'docs', prefix: '│   └── ', name: 'docs/', kind: 'app', doc: 'guide/structure/apps/docs/' },
  { id: 'packages', prefix: '├── ', name: 'packages/', kind: 'dir', doc: 'guide/structure/packages/' },
  { id: 'shared', prefix: '│   ├── ', name: 'shared/', kind: 'pkg', doc: 'guide/structure/packages/shared/' },
  { id: 'ui', prefix: '│   └── ', name: 'ui/', kind: 'pkg', doc: 'guide/structure/packages/ui/' },
  { id: 'infra', prefix: '├── ', name: 'infra/', kind: 'dir', doc: 'guide/structure/infra/' },
  { id: 'nginx', prefix: '│   └── ', name: 'nginx/', kind: 'pkg', doc: 'guide/structure/infra/nginx/' },
  { id: 'scripts', prefix: '├── ', name: 'scripts/', kind: 'dir', doc: 'guide/structure/scripts/' },
  { id: 'compose', prefix: '├── ', name: 'docker-compose.yml', kind: 'file', doc: 'guide/structure/docker-compose' },
  { id: 'envExample', prefix: '├── ', name: '.env.example', kind: 'file', doc: 'guide/structure/env-example' },
  { id: 'packageJson', prefix: '└── ', name: 'package.json', kind: 'file', doc: 'guide/structure/package-json' },
] as const
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ t.title }}</h2>
    <nav class="home-panel tree" :aria-label="t.title">
      <a
        v-for="node in structureTree"
        :key="node.id"
        class="tree__row"
        :href="node.doc"
      >
        <span class="tree__path">
          <span class="tree__branch" aria-hidden="true">{{ node.prefix }}</span>
          <span class="tree__name" :class="`tree__name--${node.kind}`">{{ node.name }}</span>
        </span>
        <span class="tree__desc">
          <span class="tree__desc-full">{{ t.items[node.id] }}</span>
          <span class="tree__desc-short">{{ shortDesc(node.id) }}</span>
        </span>
      </a>
    </nav>
  </section>
</template>

<style scoped>
.tree {
  container: tree / inline-size;
  display: grid;
  /* Панель тянется по высоте соседнего блока — строки при этом держим сверху */
  align-content: start;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 20px;
  padding: 12px 8px;
}
.tree__row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: baseline;
  padding: 2px 10px;
  border-radius: var(--home-radius-md);
  text-decoration: none;
  transition: background 0.15s;
}
.tree__row:hover {
  background: var(--home-surface-2);
}
.tree__path {
  font-family: monospace;
  font-size: var(--home-text-sm);
  white-space: pre;
}
.tree__branch {
  color: var(--home-text-dim);
}
.tree__name--root {
  color: var(--home-text-primary);
  font-weight: 700;
}
.tree__name--dir {
  color: var(--home-tree-dir);
}
.tree__name--app {
  color: var(--home-accent);
}
.tree__name--pkg {
  color: var(--home-tree-pkg);
}
/* Конфиги корня — на ступень тише папок: важны, но не главное в структуре */
.tree__name--file {
  color: var(--home-text-hover);
}
:root:not(.dark) .tree__name--dir {
  color: #0284c7;
}
:root:not(.dark) .tree__name--pkg {
  color: #7c3aed;
}
.tree__row:hover .tree__name {
  text-decoration: underline;
}
.tree__desc {
  font-size: var(--home-text-sm);
  color: var(--home-text-muted);
  line-height: var(--home-leading-normal);
}
.tree__desc-short {
  display: none;
}
.tree__row:hover .tree__desc {
  color: var(--home-text-soft);
}

/* Длина описания зависит от ширины самого блока, а не экрана: в двухколоночном
   ряду он узкий и на широком мониторе. Пороги — по ширине дерева путей
   (~185px) плюс самого длинного полного (~360px) или короткого (~160px) описания. */
@container tree (max-width: 589px) {
  .tree__desc-full {
    display: none;
  }
  .tree__desc-short {
    display: inline;
  }
}
@container tree (max-width: 359px) {
  .tree__desc {
    display: none;
  }
}
</style>
