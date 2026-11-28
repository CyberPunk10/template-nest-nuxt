import { createAuthErrorHandler } from '~/composables/apiErrorHandler'

export const useApi = createUseFetch(() => {
  const {
    public: { apiBase },
  } = useRuntimeConfig()

  return {
    baseURL: apiBase as string,
    // При 401 ofetch автоматически повторяет запрос один раз.
    // К тому моменту onResponseError уже обновил токен — повтор проходит успешно.
    retry: 1,
    retryStatusCodes: [401],
    onResponseError: createAuthErrorHandler(() => navigateTo('/login')),
  }
})
