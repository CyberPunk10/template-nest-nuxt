<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { fitCases, type FitVerdict } from './home-data'

// Переводы стартовой страницы из themeConfig.home (реактивно к локали VitePress),
// без vue-i18n. theme меняется при смене языка — компонент перерисовывается.
const { theme } = useData()
const fit = computed(() => theme.value.home!.fit)

const verdictIcons: Record<FitVerdict, string> = {
  good: 'lucide:check-circle',
  bad: 'lucide:x-circle',
  mixed: 'lucide:alert-circle',
}

// Порядок групп — от «берите смело» к «лучше не надо»: секция читается как
// рекомендация, а не как перечень.
const verdictOrder: FitVerdict[] = ['good', 'mixed', 'bad']

const groups = computed(() =>
  verdictOrder.map(verdict => ({
    verdict,
    cases: fitCases.filter(c => c.verdict === verdict),
  })),
)
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ fit.title }}</h2>
    <p class="fit__lead">{{ fit.lead }}</p>

    <!-- Быстрый фильтр «про меня / не про меня» до чтения 12 карточек:
         по списку критериев решение принимается за несколько секунд,
         а карточки ниже объясняют уже конкретные сценарии. -->
    <div class="summary">
      <p class="summary__title">{{ fit.summary.title }}</p>
      <div class="summary__cols">
        <div class="summary__col summary__col--for">
          <p class="summary__col-title">
            <Icon name="lucide:check-circle" size="15" />
            {{ fit.summary.forTitle }}
          </p>
          <ul class="summary__list">
            <li v-for="item in fit.summary.for" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div class="summary__col summary__col--against">
          <p class="summary__col-title">
            <Icon name="lucide:x-circle" size="15" />
            {{ fit.summary.againstTitle }}
          </p>
          <ul class="summary__list">
            <li v-for="item in fit.summary.against" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Разбивка по вердикту вместо одного списка из 12 карточек: заголовок
         группы снимает нагрузку с самих карточек — вердикт уже сказан
         над ними, читателю не нужно считывать его в каждой заново. -->
    <div
      v-for="group in groups"
      :key="group.verdict"
      class="fit__group"
      :class="`fit__group--${group.verdict}`"
    >
      <h3 class="fit__group-title">
        <Icon :name="verdictIcons[group.verdict]" size="16" />
        {{ fit.verdicts[group.verdict] }}
      </h3>

      <div class="fit">
        <div
          v-for="c in group.cases"
          :key="c.id"
          class="fit__card"
          :class="`fit__card--${c.verdict}`"
        >
          <div class="fit__head">
            <span class="fit__icon"><Icon :name="c.icon" size="16" /></span>
            <span class="fit__name">{{ fit.cases[c.id].name }}</span>
          </div>
          <p class="fit__why">{{ fit.cases[c.id].why }}</p>
          <p v-if="fit.cases[c.id].alt" class="fit__alt">
            <span class="fit__alt-label">{{ fit.altLabel }}</span>
            {{ fit.cases[c.id].alt }}
          </p>
        </div>
      </div>
    </div>

    <p class="fit__note">{{ fit.note }}</p>
  </section>
</template>

<style scoped>
.fit__lead {
  font-size: var(--home-text-md);
  line-height: var(--home-leading-relaxed);
  color: var(--home-text-muted);
  margin: -8px 0 28px;
  max-width: 72ch;
}

/* ── Сводка «Если коротко» ── */
.summary {
  border: 1px solid var(--home-border-subtle);
  border-radius: 12px;
  padding: 20px 24px 22px;
  margin-bottom: 40px;
  background: var(--home-surface-2);
}

.summary__title {
  font-size: var(--home-text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--home-text-dim);
  margin: 0 0 16px;
}

.summary__cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px 40px;
}

/* Разделитель между колонками вместо рамок вокруг каждой: список читается
   как два столбца одного текста, а не как две отдельные плашки.
   Линия рисуется в зазоре grid — column-gap 40px, поэтому отступ до текста
   ровно половина зазора с каждой стороны. */
.summary__col--against {
  border-left: 1px solid var(--home-border-2);
  padding-left: 20px;
  margin-left: -20px;
}

.summary__col-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: var(--home-text-sm);
  font-weight: 700;
  margin: 0 0 10px;
}
.summary__col--for .summary__col-title {
  color: var(--home-accent);
}
.summary__col--against .summary__col-title {
  color: #f87171;
}

.summary__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.summary__list li {
  position: relative;
  padding-left: 16px;
  font-size: var(--home-text-sm);
  line-height: var(--home-leading-normal);
  color: var(--home-text-soft);
}
/* Маркер — точка, а не галочка/крестик: цветной заголовок колонки уже задал
   знак, повторять его в каждой строке значит спорить с ним. */
.summary__list li::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 0.6em;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--home-text-dim);
}

@media (max-width: 760px) {
  .summary__cols {
    grid-template-columns: 1fr;
  }
  /* В одну колонку вертикальный разделитель превращается в горизонтальный. */
  .summary__col--against {
    border-left: none;
    border-top: 1px solid var(--home-border-2);
    padding-left: 0;
    margin-left: 0;
    padding-top: 20px;
  }
}

/* ── Группа по вердикту ── */
.fit__group + .fit__group {
  margin-top: 36px;
}

.fit__group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--home-text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 14px;
}
.fit__group--good .fit__group-title {
  color: var(--home-accent);
}
.fit__group--mixed .fit__group-title {
  color: #f59e0b;
}
.fit__group--bad .fit__group-title {
  color: #f87171;
}

.fit {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* ── Карточка ── */
/* Принадлежность к группе держат заголовок группы и цветная иконка;
   сама карточка в покое нейтральная — цвет появляется при наведении. */
.fit__card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  border: 1px solid var(--home-border-subtle);
  border-radius: 10px;
  background: var(--home-surface-2);
  transition:
    border-color 0.2s,
    background 0.2s;
}
/* Наведение: лёгкая подложка в тон вердикта + цветная рамка. */
.fit__card--good:hover {
  border-color: rgba(0, 220, 130, 0.3);
  background: rgba(0, 220, 130, 0.04);
}
.fit__card--mixed:hover {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(245, 158, 11, 0.04);
}
.fit__card--bad:hover {
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(248, 113, 113, 0.04);
}

.fit__head {
  display: flex;
  /* flex-start, а не center: при заголовке в две строки центрирование
     уводило иконку вниз, и она «прыгала» между карточками соседних колонок. */
  align-items: flex-start;
  gap: 10px;
}
/* Иконка в цвет вердикта — вместе с заголовком группы она и держит
   различие групп: сама карточка в покое нейтральная. */
.fit__icon {
  display: flex;
  flex-shrink: 0;
  /* Выравниваем по оптическому центру первой строки заголовка:
     (высота строки 20px × 1.3 = 26px − иконка 16px) / 2 = 5px. */
  padding-top: 5px;
}
.fit__card--good .fit__icon {
  color: var(--home-accent);
}
.fit__card--mixed .fit__icon {
  color: #f59e0b;
}
.fit__card--bad .fit__icon {
  color: #f87171;
}
.fit__name {
  font-size: var(--home-text-lg);
  font-weight: 700;
  color: var(--home-text-primary);
  line-height: var(--home-leading-tight);
  letter-spacing: var(--home-tracking-tight);
  flex: 1;
}

.fit__why {
  font-size: var(--home-text-sm);
  line-height: var(--home-leading-relaxed);
  color: var(--home-text-soft);
  margin: 0;
}

/* Ступенью ниже основного текста карточки: «вместо этого» — сноска,
   она не должна читаться наравне с разбором. */
.fit__alt {
  font-size: var(--home-text-xs);
  line-height: var(--home-leading-normal);
  color: var(--home-text-muted);
  margin: 0;
  padding-top: 10px;
  border-top: 1px solid var(--home-border-2);
}
.fit__alt-label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-right: 5px;
}

.fit__note {
  font-size: var(--home-text-sm);
  line-height: var(--home-leading-relaxed);
  color: var(--home-text-dim);
  margin: 32px 0 0;
  font-style: italic;
  max-width: 78ch;
}

@media (max-width: 900px) {
  .fit {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .fit {
    grid-template-columns: 1fr;
  }
}
</style>
