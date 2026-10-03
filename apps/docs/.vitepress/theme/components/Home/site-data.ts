export const repoUrl = 'https://github.com/CyberPunk10/template-nest-nuxt'
export const authorUrl = 'https://github.com/CyberPunk10'

/**
 * Разбор схемы авторизации. Живёт не в этой сборке доков: страницы
 * guide/auth/ есть только там, где авторизация реализована, — поэтому
 * ссылка ведёт в репозиторий, а не внутрь сайта.
 */
export const authDocsUrl = `${repoUrl}/blob/auth-session/apps/docs/guide/auth/index.md`

/** Страница спонсорства. TODO: — аккаунт GitHub Sponsors не подключён. */
export const sponsorUrl = 'https://github.com/sponsors/CyberPunk10'

/** Контакты для связи. TODO: — вписать реальные или убрать из футера. */
export const contacts = {
  email: 'you@example.com',
  telegram: 'https://t.me/your_handle',
}

export interface CryptoWallet {
  label: string
  address: string
}

/**
 * Кошельки для донатов. TODO: — вписать реальные или убрать лишние сети.
 *
 * Сеть в label указана намеренно: отправка USDT не в ту сеть теряет перевод.
 * BEP20 (BNB Smart Chain) EVM-совместима, поэтому адрес в том же формате, что ETH.
 */
export const cryptoWallets: CryptoWallet[] = [
  { label: 'USDT (BEP20)', address: '0xExampleExampleExampleExampleExample1111' },
  { label: 'USDT (TRC20)', address: 'TExampleExampleExampleExampleExample00' },
  { label: 'BTC', address: 'bc1qexampleexampleexampleexampleexampl0000' },
  { label: 'ETH', address: '0xExampleExampleExampleExampleExample0000' },
]

/**
 * Спонсоры проекта. Пока пусто — секция показывает свободные слоты.
 * Появятся реальные: { name, logoUrl, url } и рендер логотипов вместо заглушек.
 */
export const sponsors: never[] = []

/** Сколько свободных слотов показывать в секции спонсоров. */
export const freeSponsorSlots = 3

/** Команда создания проекта генератором create-nest-nuxt. */
export const installCmd = 'npx create-nest-nuxt my-app'
