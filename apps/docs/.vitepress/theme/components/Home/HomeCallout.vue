<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'

/**
 * Призыв «начните с идей, а не с настройки». Три оформления стоят на разных
 * участках страницы: одна и та же мысль подаётся по-разному в зависимости от
 * того, что читатель только что прочёл.
 *
 *   type  — под hero: типографика без рамки, фраза печатается по буквам;
 *   split — после честного разбора «кому подходит»: аргумент через контраст;
 *   steps — перед «Быстрым стартом»: шкала пройденных этапов подводит к нему.
 */
const props = defineProps<{ variant: 'split' | 'steps' | 'type' }>()

// Переводы стартовой страницы из themeConfig.home (реактивно к локали VitePress),
// без vue-i18n. theme меняется при смене языка — компонент перерисовывается.
const { theme } = useData()
const callout = computed(() => theme.value.home!.callout)
const v = computed(() => callout.value[props.variant])

// ── Печать для варианта type ──
// Фраза набирается по буквам: зачин, вычеркнутый вариант, его зачёркивание,
// затем оставшийся. typed = null — показать всё сразу: так фраза выглядит
// при серверном рендере, без JS и при prefers-reduced-motion.
const CHAR_MS = 45
const LINE_PAUSE_MS = 350
// Пауза перед зачёркиванием — чтобы вариант успели прочитать
const BEFORE_STRIKE_MS = 1000
// Сколько ждать после начала зачёркивания. Линия идёт 1.5 с, но с замедлением
// к концу — основную часть она проходит раньше, и печать можно продолжать
const STRIKE_MS = 1100

const typed = ref<number | null>(null)
const struck = ref(true)
// Курсор виден только пока идёт набор: в паузах и после конца его нет
const paused = ref(true)
const root = ref<HTMLElement>()
let timer: ReturnType<typeof setTimeout> | undefined
let observer: IntersectionObserver | undefined

// Части фразы по порядку печати; start — сколько букв напечатано до части
const parts = computed(() => {
  const t = callout.value.type
  let start = 0
  return [t.call, t.struck, t.kept, t.accent].map((text: string) => {
    const part = { text, start }
    start += text.length
    return part
  })
})

// Напечатанная и ещё скрытая часть: скрытая занимает место, чтобы блок
// не менял высоту по ходу печати
function split(i: number) {
  const { text, start } = parts.value[i]!
  const n = typed.value === null ? text.length : Math.min(Math.max(typed.value - start, 0), text.length)
  return { shown: text.slice(0, n), hidden: text.slice(n) }
}

// Курсор стоит в части, которая сейчас печатается
const cursorAt = computed(() => {
  if (typed.value === null || paused.value) return -1
  return parts.value.findIndex(p => typed.value! < p.start + p.text.length)
})

function step() {
  const total = parts.value.reduce((n, p) => n + p.text.length, 0)
  if (typed.value === null || typed.value >= total) return
  typed.value++
  const ends = parts.value.map(p => p.start + p.text.length)
  if (typed.value === ends[1]) {
    // Вычеркнутый вариант допечатан: пауза, зачёркивание, затем печать дальше
    pause(() => {
      struck.value = true
      pause(step, STRIKE_MS)
    }, BEFORE_STRIKE_MS)
    return
  }
  // Пауза только после зачина: «реализации» и выделенное «своих идей» —
  // одна строка, разрыв посреди неё выглядел бы запинкой
  if (typed.value === ends[0]) pause(step, LINE_PAUSE_MS)
  else type(step, CHAR_MS)
}

// Следующий шаг с курсором (идёт набор) или без него (пауза)
function type(next: () => void, ms: number) {
  paused.value = false
  timer = setTimeout(next, ms)
}
function pause(next: () => void, ms: number) {
  paused.value = true
  timer = setTimeout(next, ms)
}

function start() {
  typed.value = 0
  struck.value = false
  pause(step, LINE_PAUSE_MS)
}

onMounted(() => {
  if (props.variant !== 'type' || !root.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // Печатать, когда блок виден: иначе анимация пройдёт без зрителя
  typed.value = 0
  struck.value = false
  observer = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      observer?.disconnect()
      start()
    }
  })
  observer.observe(root.value)
})

// Смена языка посреди печати — показать новую фразу целиком
watch(() => callout.value.type, () => {
  clearTimeout(timer)
  observer?.disconnect()
  typed.value = null
  struck.value = true
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  observer?.disconnect()
})
</script>

<template>
  <!-- ── Развилка: слева то, чем вы не занимаетесь, справа — чем вместо этого.
       Показывает выгоду контрастом, а не декларацией: после честного разбора
       «кому не подходит» аргумент звучит убедительнее лозунга. -->
  <section v-if="variant === 'split'" class="split">
    <div class="split__side split__side--without">
      <span class="split__label">{{ v.withoutLabel }}</span>
      <ul class="split__list">
        <li v-for="item in v.without" :key="item">
          <Icon name="lucide:x-circle" size="14" />
          {{ item }}
        </li>
      </ul>
    </div>
    <div class="split__arrow" aria-hidden="true">
      <Icon name="lucide:arrow-right" size="18" />
    </div>
    <div class="split__side split__side--with">
      <span class="split__label">{{ v.withLabel }}</span>
      <ul class="split__list">
        <li v-for="item in v.with" :key="item">
          <Icon name="lucide:check-circle" size="14" />
          {{ item }}
        </li>
      </ul>
    </div>
  </section>

  <!-- ── Шкала: три этапа шаблон уже прошёл за вас, вы начинаете с четвёртого.
       Стоит вплотную к «Быстрому старту», поэтому зачёркнутые шаги переходят
       в пронумерованные шаги установки — смысловая рифма. -->
  <section v-else-if="variant === 'steps'" class="steps">
    <ol class="steps__track">
      <li
        v-for="(step, i) in v.stages"
        :key="step"
        class="steps__step"
        :class="i === v.stages.length - 1 ? 'steps__step--now' : 'steps__step--done'"
      >
        <span class="steps__bar" />
        <span class="steps__cap">{{ step }}</span>
      </li>
    </ol>
    <p class="steps__text">
      <strong>{{ v.done }}</strong>
      <span>{{ v.text }}</span>
    </p>
  </section>

  <!-- ── Типографика: ни рамки, ни иконки. Зачёркивание дорисовывается
       CSS-анимацией, без JS-обсерверов.

       Конструкция: общий зачин, под ним два одинаково начинающихся
       продолжения — одно вычеркнуто, второе остаётся. Параллельные строки
       и держат приём: читатель видит выбор, а не одну длинную фразу. -->
  <section v-else ref="root" class="typeset">
    <!-- Скринридеру — фраза целиком: по буквам её читать незачем -->
    <p class="typeset__line" :aria-label="`${v.call} ${v.kept}${v.accent}`">
      <span class="typeset__call" aria-hidden="true">{{ split(0).shown }}<span v-if="cursorAt === 0" class="typeset__cursor" /><span class="typeset__hidden">{{ split(0).hidden }}</span></span>
      <span
        class="typeset__option typeset__struck"
        :class="{ 'typeset__struck--on': struck }"
        aria-hidden="true"
      >{{ split(1).shown }}<span v-if="cursorAt === 1" class="typeset__cursor" /><span class="typeset__hidden">{{ split(1).hidden }}</span></span>
      <span class="typeset__option typeset__kept" aria-hidden="true">{{ split(2).shown }}<span v-if="cursorAt === 2" class="typeset__cursor" /><span class="typeset__hidden">{{ split(2).hidden }}</span><span class="typeset__accent">{{ split(3).shown }}<span v-if="cursorAt === 3" class="typeset__cursor" /><span class="typeset__hidden">{{ split(3).hidden }}</span></span></span>
    </p>
  </section>
</template>

<style scoped>
/* ─────────────────────────  split  ───────────────────────── */
.split {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  border: 1px solid var(--home-border-subtle);
  border-radius: 12px;
  overflow: hidden;
}
.split__side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px 26px;
}
.split__side--without {
  background: var(--home-surface-2);
}
/* Единственная акцентная заливка секции — на той стороне, куда мы ведём. */
.split__side--with {
  background: color-mix(in srgb, var(--home-accent) 7%, transparent);
}
.split__label {
  font-size: var(--home-text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--home-text-dim);
}
.split__side--with .split__label {
  color: var(--home-accent);
}
.split__list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.split__list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: var(--home-text-sm);
  line-height: var(--home-leading-normal);
  color: var(--home-text-dim);
}
.split__side--with .split__list li {
  color: var(--home-text-soft);
}
.split__list :deep(svg) {
  flex-shrink: 0;
  margin-top: 3px;
}
.split__side--with .split__list :deep(svg) {
  color: var(--home-accent);
}
.split__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  background: var(--home-surface-2);
  border-left: 1px solid var(--home-border-subtle);
  border-right: 1px solid var(--home-border-subtle);
  color: var(--home-text-dim);
}

/* ─────────────────────────  steps  ───────────────────────── */
.steps {
  border: 1px solid var(--home-border-subtle);
  border-radius: 12px;
  background: var(--home-surface-2);
  padding: 22px 26px 24px;
}
.steps__track {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
}
.steps__step {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}
.steps__bar {
  height: 4px;
  border-radius: 2px;
  background: var(--home-border-2);
}
.steps__step--done .steps__bar {
  background: color-mix(in srgb, var(--home-accent) 35%, transparent);
}
.steps__step--now .steps__bar {
  background: var(--home-accent);
}
.steps__cap {
  font-size: var(--home-text-xs);
  color: var(--home-text-dim);
}
/* Зачёркнутые этапы — то, что шаблон снял с вас; последний — ваш. */
.steps__step--done .steps__cap {
  color: var(--home-text-muted);
  text-decoration: line-through;
}
.steps__step--now .steps__cap {
  color: var(--home-accent);
  font-weight: 700;
}
.steps__text {
  font-size: var(--home-text-lg);
  line-height: var(--home-leading-tight);
  letter-spacing: var(--home-tracking-tight);
  margin: 0;
}
.steps__text strong {
  font-weight: 600;
  color: var(--home-text-strong);
}
.steps__text span {
  color: var(--home-text-muted);
  font-weight: 400;
}

/* ─────────────────────────  typeset  ───────────────────────── */
.typeset {
  padding: 8px 0;
}
/* Части фразы — элементы flex с переносом: на широком экране фраза в одну
   строку, при сужении сама разбивается на две, затем на три. Каждая часть
   переносится целиком, поэтому разрыв всегда приходится между частями. */
.typeset__line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.3em;
  row-gap: 2px;
  font-size: var(--home-text-2xl);
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.03em;
  margin: 0;
}
/* Зачин стоит ступенью тише вариантов: он вводит выбор, а не спорит с ним. */
.typeset__call {
  color: var(--home-text-muted);
}
.typeset__option {
  display: inline-block;
}
.typeset__kept {
  color: var(--home-text-strong);
}
.typeset__accent {
  color: var(--home-accent);
}
/* Зачёркивание рисуется псевдоэлементом, а не <s>: линию нужно вести
   акцентом и анимировать, а декоративный текст-декор этого не даёт. */
.typeset__struck {
  position: relative;
  white-space: nowrap;
  /* Пока не зачёркнут — того же цвета, что зачин; гаснет вместе с линией */
  color: var(--home-text-muted);
  transition: color 1.5s ease;
}
/* Гаснет к фону, а не в другой токен: --home-text-dim в светлой теме темнее
   --home-text-muted, и вычеркнутое стало бы ярче зачина. Линия — псевдоэлемент
   со своим цветом, её угасание не задевает. */
.typeset__struck--on {
  color: color-mix(in srgb, var(--home-text-muted) 50%, transparent);
}
/* В тёмной теме зачин и так близок к фону — гасим слабее, чтобы вариант читался */
.dark .typeset__struck--on {
  color: color-mix(in srgb, var(--home-text-muted) 85%, transparent);
}
/* Тонкая линия: толстая перекрывает строчные и текст под ней не читается. */
.typeset__struck::after {
  content: '';
  position: absolute;
  left: -0.04em;
  right: -0.04em;
  top: 55%;
  height: 1.5px;
  border-radius: 1px;
  background: var(--home-text-primary);
  transform: scaleX(0);
  transform-origin: left;
}
/* Зачёркивание включает печать — когда вычеркнутый вариант допечатан */
.typeset__struck--on::after {
  animation: callout-strike 1.5s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
}
/* Ещё не напечатанное занимает своё место, но не видно — высота не скачет */
.typeset__hidden {
  visibility: hidden;
}
/* Курсор печати: тонкая черта в цвет акцента, мигает */
.typeset__cursor {
  display: inline-block;
  width: 2px;
  height: 0.9em;
  margin: 0 1px;
  vertical-align: -0.1em;
  background: var(--home-accent);
  animation: callout-cursor 1s steps(1) infinite;
}
@keyframes callout-cursor {
  50% {
    opacity: 0;
  }
}
@keyframes callout-strike {
  to {
    transform: scaleX(1);
  }
}

/* ─────────────────────────  адаптив  ───────────────────────── */
@media (max-width: 700px) {
  .split {
    grid-template-columns: 1fr;
  }
  /* Стрелка вправо между колонками теряет смысл, когда колонки встают
     друг под друга: на узком экране порядок задаёт сама вертикаль. */
  .split__arrow {
    display: none;
  }
  .split__side--without {
    border-bottom: 1px solid var(--home-border-subtle);
  }
  .steps__track {
    gap: 6px;
  }
  .steps__cap {
    font-size: 10px;
  }
}

/* Анимация зачёркивания — декоративная. */
@media (prefers-reduced-motion: reduce) {
  .typeset__struck {
    transition: none;
  }
  .typeset__struck--on::after {
    animation: none;
    transform: scaleX(1);
  }
}
</style>
