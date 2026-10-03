import { useAuth } from '~/composables/useAuth'
import { useRefreshToken } from '~/composables/useRefreshToken'

// Общий 401-обработчик для useApi.ts (useFetch) и plugins/01.api.ts ($fetch) —
// оба клиента используют одну и ту же ротацию refresh-токена, но по-разному
// вызывают навигацию (navigateTo напрямую vs через nuxtApp.runWithContext).
export function createAuthErrorHandler(navigateToLogin: () => unknown) {
  // Композаблы вызываем здесь, при создании обработчика: фабрика работает в
  // контексте плагина/setup, а сам onResponseError — асинхронный колбэк ofetch
  // уже вне контекста Nuxt, и вызов композабла там даёт NUXT_E1001.
  const { user } = useAuth()
  const { refresh } = useRefreshToken()

  return async function onResponseError({ response, request, options }: {
    response: { status: number }
    request: string | Request
    options: { retry?: number | false }
  }): Promise<void> {
    if (response.status !== 401) return

    const url = typeof request === 'string' ? request : request.toString()

    // Исключаем auth-запросы — иначе бесконечный цикл
    // retry бессмысленен, токена всё равно нет
    if (url.includes('/auth/')) {
      options.retry = 0
      return
    }

    // На SSR server/middleware/auth.ts уже сделал silent refresh до рендера —
    // access_token к этому моменту либо свежий, либо refresh_token мёртв/инвалидирован.
    // Повторная попытка здесь ничего не даст: $fetch на сервере не видит браузерные
    // cookies без явного forward, так что уйдёт без refresh_token и всегда провалится.
    if (import.meta.server) {
      options.retry = 0
      user.value = null
      return
    }

    const refreshed = await refresh()

    // Refresh провалился — разлогиниваем
    if (!refreshed) {
      // Отменяем retry — повторный запрос всё равно упадёт с 401
      options.retry = 0
      user.value = null
      await navigateToLogin()
    }
  }
}
