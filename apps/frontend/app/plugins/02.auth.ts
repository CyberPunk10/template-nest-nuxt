export default defineNuxtPlugin(async () => {
  const {
    public: { apiBase },
  } = useRuntimeConfig()
  const { user } = useAuth()
  const { refresh } = useRefreshToken()

  const apiFetch = $fetch.create({ baseURL: apiBase as string })

  if (import.meta.server) {
    // useRequestFetch форвардит заголовки входящего запроса, включая cookie
    // (обычный $fetch их не видит и ушёл бы без токена). Если токены протухли,
    // server/middleware/auth.ts уже подменил cookie в заголовках на свежие.
    const requestFetch = useRequestFetch()
    user.value = await requestFetch<AuthUser>(`${apiBase}/auth/me`).catch(() => null)
  } else {
    // Клиент: штатный сценарий — /auth/me проходит сразу (браузер получил Set-Cookie от Nitro).
    // Fallback на refresh нужен для edge-case: токен протух между SSR и гидратацией.
    // Куки не прокидываем вручную — браузер отправляет их автоматически.
    let me = await apiFetch<AuthUser>('/auth/me').catch(() => null)
    if (!me) {
      if (await refresh()) {
        me = await apiFetch<AuthUser>('/auth/me').catch(() => null)
      }
    }
    user.value = me
  }
})
