<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { authPoints, authDocsUrl } from './home-data'

// Переводы стартовой страницы из themeConfig.home (реактивно к локали VitePress),
// без vue-i18n. theme меняется при смене языка — компонент перерисовывается.
const { theme } = useData()
const auth = computed(() => theme.value.home!.promo.auth)
</script>

<template>
  <section class="section">
    <h2 class="section__title">{{ auth.title }}</h2>
    <p class="auth__lead">{{ auth.lead }}</p>

    <!-- Два уровня, а не две равные опции: авторизация надстраивается над
         базовым вариантом, и порядок карточек это показывает. -->
    <div class="auth__levels">
      <div class="auth__level">
        <span class="auth__level-label">{{ auth.base.label }}</span>
        <p class="auth__level-title">{{ auth.base.title }}</p>
        <p class="auth__level-desc">{{ auth.base.desc }}</p>
      </div>
      <div class="auth__level auth__level--on-top">
        <span class="auth__level-label">
          <Icon name="lucide:plus" size="12" />
          {{ auth.layer.label }}
        </span>
        <p class="auth__level-title">{{ auth.layer.title }}</p>
        <p class="auth__level-desc">{{ auth.layer.desc }}</p>
      </div>
    </div>

    <!-- Список описывает только надстройку. Он вынесен из сетки карточек
         и подписан: иначе колонки читаются как «по паре пунктов на каждый
         вариант», хотя к базовому не относится ни один. -->
    <div class="auth__detail">
      <p class="auth__detail-title">{{ auth.pointsTitle }}</p>
      <ul class="auth__points">
        <li v-for="point in authPoints" :key="point.id" class="auth__point">
          <span class="auth__point-icon"><Icon :name="point.icon" size="15" /></span>
          <span class="auth__point-body">
            <strong class="auth__point-title">{{ auth.points[point.id].title }}</strong>
            {{ auth.points[point.id].desc }}
          </span>
        </li>
      </ul>
    </div>

    <p class="auth__note">
      {{ auth.note }}
      <a
        class="auth__note-link"
        :href="authDocsUrl"
        target="_blank"
        rel="noopener"
      >{{ auth.noteLink }}</a>
    </p>
  </section>
</template>

<style scoped>
.auth__lead {
  font-size: var(--home-text-md);
  line-height: var(--home-leading-relaxed);
  color: var(--home-text-muted);
  margin: -8px 0 20px;
  max-width: 68ch;
}

/* Базовый уровень и надстройка над ним. На узком экране колонки встают
   друг под друга, порядок сверху вниз сохраняет ту же логику. */
.auth__levels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}
.auth__level {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px;
  border: 1px solid var(--home-border-subtle);
  border-radius: 10px;
  background: var(--home-surface-2);
}
/* Пунктир и акцент — тот же язык, что у опциональных модулей в витрине. */
.auth__level--on-top {
  border-style: dashed;
  background: color-mix(in srgb, var(--home-accent) 5%, transparent);
}
.auth__level-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--home-text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--home-text-dim);
}
.auth__level--on-top .auth__level-label {
  color: var(--home-accent);
}
.auth__level-title {
  font-size: var(--home-text-lg);
  font-weight: 700;
  letter-spacing: var(--home-tracking-tight);
  color: var(--home-text-primary);
  margin: 0;
}
.auth__level-desc {
  font-size: var(--home-text-sm);
  line-height: var(--home-leading-normal);
  color: var(--home-text-soft);
  margin: 0;
}

/* Рамка в акцентном цвете связывает список с карточкой опции над ним
   и отделяет его от базового варианта слева. */
.auth__detail {
  margin-top: 24px;
  padding: 18px 20px 20px;
  border: 1px solid color-mix(in srgb, var(--home-accent) 28%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--home-accent) 4%, transparent);
}
.auth__detail-title {
  font-size: var(--home-text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  line-height: 1;
  color: var(--home-accent);
  margin: 0 0 16px;
}
/* Три колонки на широком экране: при двух список визуально делился пополам
   и читался как продолжение двух карточек выше. */
.auth__points {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.auth__point {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: var(--home-text-sm);
  line-height: var(--home-leading-relaxed);
  color: var(--home-text-muted);
}
.auth__point-icon {
  line-height: 0;
  margin-top: 4px;
  color: var(--home-accent);
  flex-shrink: 0;
}
.auth__point-title {
  color: var(--home-text-soft);
  font-weight: 600;
  margin-right: 5px;
}

.auth__note {
  font-size: var(--home-text-sm);
  line-height: var(--home-leading-relaxed);
  color: var(--home-text-dim);
  font-style: italic;
  margin: 20px 0 0;
  max-width: 78ch;
}
.auth__note-link {
  color: var(--home-accent);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--home-accent) 35%, transparent);
  transition: border-color 0.2s;
}
.auth__note-link:hover,
.auth__note-link:focus-visible {
  border-bottom-color: var(--home-accent);
}
</style>
