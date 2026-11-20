import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'
import { defineConfigWithTheme } from 'vitepress'
import type { DefaultTheme, LocaleConfig } from 'vitepress'
import homeLocale from './locales/ru.json'
import ru from './config/ru'
import en from './config/en'
import th from './config/th'

// Расширяем тему дефолтной + переводы стартовой страницы в themeConfig.home.
// VitePress отдаёт их через useData().theme реактивно к локали — вместо vue-i18n.
// Переводы лежат в locales/*.json (единый источник для витрины и config).
// Ключи у всех языков одинаковые, поэтому тип берётся из файла любого из них.
export interface ThemeConfig extends DefaultTheme.Config {
  home?: typeof homeLocale.home
  // Адрес кабинета (фронтенда) для кнопки на стартовой странице.
  dashboardUrl?: string
}

// apps/docs/.env не грузится автоматически (в отличие от Nest ConfigModule
// и Nuxt) — читаем его явно, чтобы PORT управлял портом `vitepress dev` так же,
// как для backend/frontend.
// quiet: с 17-й версии dotenv печатает в вывод рекламные подсказки сторонних
// сервисов. Факт загрузки .env и без того виден: без PORT доки не поднимутся
// на своём порту.
loadEnv({
  path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env'),
  quiet: true,
})

// Куда ведёт кнопка «Посмотреть демо». Доки — статический сайт, рантайм-конфига
// у них нет, поэтому адрес вшивается в сборку из переменной окружения:
//   dev    — http://localhost:3200 из apps/docs/.env (Nuxt на соседнем порту);
//   Docker — '/' из apps/docs/Dockerfile (фронтенд за тем же reverse proxy);
//   внешний хостинг (Netlify и т.п.) — полный URL фронтенда.
const dashboardUrl = process.env.DASHBOARD_URL
if (!dashboardUrl) {
  throw new Error('DASHBOARD_URL is not set — see apps/docs/.env.example')
}

// ── Языки ─────────────────────────────────────────────────────────────
// Единственное место, где перечислены локали. Чтобы убрать язык из сборки:
// удалить его строку здесь, файл config/<код>.ts и папку со страницами.
// Чтобы добавить — создать config/<код>.ts по образцу и дописать сюда.
type SearchTranslations = NonNullable<DefaultTheme.LocalSearchOptions['translations']>

export type LocaleEntry = LocaleConfig<ThemeConfig>[string] & {
  key: string
  // Подписи локального поиска. Без них поиск говорит по-английски.
  searchTranslations?: SearchTranslations
}

const LOCALES: LocaleEntry[] = [ru, en, th]

const locales: LocaleConfig<ThemeConfig> = Object.fromEntries(
  LOCALES.map(({ key, searchTranslations: _, ...locale }) => [key, locale]),
)

const searchLocales = Object.fromEntries(
  LOCALES
    .filter(({ searchTranslations }) => searchTranslations)
    .map(({ key, searchTranslations }) => [key, { translations: searchTranslations }]),
)

export default defineConfigWithTheme<ThemeConfig>({
  base: '/dev/docs/',
  title: 'NestJS + Nuxt Template',
  description: 'Документация монорепо-шаблона',

  // В доках много ссылок вида http://localhost:3100/3200/5173 —
  // VitePress по умолчанию считает их dead links при сборке,
  // т.к. localhost гарантированно недостижим со стороны собранного сайта.
  // 'localhostLinks' — встроенный режим именно под этот случай: точечно
  // разрешает //localhost:*, не отключая проверку остальных ссылок целиком.
  ignoreDeadLinks: 'localhostLinks',

  vite: {
    server: {
      // 5173 — дефолт самого Vite, используется если PORT не задан в apps/docs/.env
      port: Number(process.env.PORT) || 5173,
    },
  },

  // Общие для всех локалей настройки темы (переопределяются в locales.*).
  themeConfig: {
    // Адрес кабинета одинаков для всех языков — держим в общей секции.
    // Локальные themeConfig его не переопределяют, поэтому он доступен
    // из любой локали через useData().theme.
    dashboardUrl,

    // Локальный поиск: индекс собирается при билде и лежит рядом со статикой,
    // внешние сервисы (Algolia) не нужны. Подписи интерфейса задаёт каждая
    // локаль в своём config/<locale>.ts.
    search: {
      provider: 'local',
      // Подробный вывод (excerpt с фрагментом текста под каждым результатом)
      // включён по умолчанию. Пользователь может выключить его кнопкой в модалке —
      // выбор запоминается в localStorage, поэтому это именно значение по умолчанию,
      // а не принудительный режим. 'auto' (штатное) дало бы обратное: свёрнутый
      // список, пока пользователь сам не развернёт.
      options: {
        detailedView: true,
        locales: searchLocales,
      },
    },

    // Убираем нижнюю навигацию «предыдущая/следующая» — лишний шум для линейного чтения.
    docFooter: { prev: false, next: false },

    // Ссылка на репозиторий — штатная иконка в шапке (общая для всех локалей).
    socialLinks: [
      { icon: 'github', link: 'https://github.com/CyberPunk10/template-nest-nuxt' },
    ],
  },

  // Языки из LOCALES: язык с key 'root' лежит в корне, остальные — в папках
  // со своим кодом. Если языков несколько, VitePress сам добавляет
  // переключатель в шапку; класс lang на <html> ставит всегда.
  locales,
})
