import { parseSetCookie } from 'cookie-es'

// Silent refresh перед SSR: если access_token протух, но refresh_token жив —
// обновляем токены до того как Vue начнёт рендер. Это единственное место где
// Set-Cookie гарантированно доходит до браузера вместе со страницей.
export default defineEventHandler(async (event) => {
  // Пропускаем API-запросы и статику — только навигация по страницам
  const url = getRequestURL(event)
  if (url.pathname.startsWith('/api') || url.pathname.includes('.')) return

  const cookies = parseCookies(event)
  // access_token жив — refresh не нужен; нет refresh_token — сессии нет, делать нечего
  if (cookies['access_token'] || !cookies['refresh_token']) return

  const { backendUrl } = useRuntimeConfig()

  try {
    const refreshResponse = await $fetch.raw(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: getHeader(event, 'cookie') ?? '' },
    })

    const setCookieHeaders = refreshResponse.headers.getSetCookie?.() ?? []

    // Добавляем Set-Cookie в ответ страницы — браузер сохранит новые токены
    for (const cookie of setCookieHeaders) {
      appendHeader(event, 'set-cookie', cookie)
    }

    // Подменяем cookie входящего запроса на свежие токены. Именно заголовок
    // запроса читают все SSR-вызовы ниже по цепочке: и plugins/02.auth.ts, и
    // useApi() внутри компонентов. Без подмены они уйдут со старым access_token,
    // получат 401 и обнулят user (см. composables/apiErrorHandler.ts).
    // Записать cookie в ЗАПРОС средствами h3 нельзя: parseCookies читает req,
    // setCookie/appendHeader пишут в res — симметричной функции нет, правим req напрямую.
    if (setCookieHeaders.length) {
      const cookieJar = parseCookies(event)
      for (const raw of setCookieHeaders) {
        // parseSetCookie отбрасывает атрибуты (Max-Age, Path, HttpOnly...) —
        // в заголовок запроса идут только пары name=value, как их шлёт браузер.
        // Вернёт undefined, если строка не разобралась как Set-Cookie.
        const cookie = parseSetCookie(raw)
        if (cookie?.name) cookieJar[cookie.name] = cookie.value ?? ''
      }

      event.node.req.headers['cookie'] = Object.entries(cookieJar)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ')
    }
  } catch {
    // refresh провалился (сессия истекла или инвалидирована) — продолжаем без токена
  }
})
