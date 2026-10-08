// Singleton промис на время выполнения refresh.
// Все параллельные 401 ждут одного и того же результата — второй запрос
// не запускает новый refresh и не натыкается на isUsed флаг в БД.
//
// Только для клиента: на сервере модуль загружается один раз на весь процесс,
// а не на запрос — общий промис "утёк" бы между разными пользователями.
// Вызывать refresh() на сервере нельзя (см. apiErrorHandler.ts).
let refreshPromise: Promise<boolean> | null = null

export function useRefreshToken() {
  const {
    public: { apiBase },
  } = useRuntimeConfig()

  async function refresh(): Promise<boolean> {
    if (import.meta.server) {
      throw new Error('useRefreshToken() is client-only')
    }

    if (refreshPromise) return refreshPromise

    refreshPromise = $fetch('/auth/refresh', {
      method: 'POST',
      baseURL: apiBase as string,
    })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })

    return refreshPromise
  }

  return { refresh }
}
