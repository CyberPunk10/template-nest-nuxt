import { createAuthErrorHandler } from '~/composables/apiErrorHandler'

export default defineNuxtPlugin((nuxtApp) => {
  const {
    public: { apiBase },
  } = useRuntimeConfig()

  const onResponseError = createAuthErrorHandler(() =>
    nuxtApp.runWithContext(() => navigateTo('/login')),
  )

  const api = $fetch.create({
    baseURL: apiBase as string,
    // При 401 ofetch автоматически повторяет запрос один раз.
    // К тому моменту onResponseError уже обновил токен — повтор проходит успешно.
    retry: 1,
    retryStatusCodes: [401],
    onResponseError,
  })

  return {
    provide: { api },
  }
})
