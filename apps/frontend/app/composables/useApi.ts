export function useApi() {
  const {
    public: { apiBase },
  } = useRuntimeConfig()

  function get<T>(path: string) {
    return useFetch<T>(`${apiBase}${path}`)
  }

  function post<T>(path: string, body: Record<string, unknown>) {
    return $fetch<T>(`${apiBase}${path}`, { method: 'POST', body })
  }

  function put<T>(path: string, body: Record<string, unknown>) {
    return $fetch<T>(`${apiBase}${path}`, { method: 'PUT', body })
  }

  function del(path: string) {
    return $fetch(`${apiBase}${path}`, { method: 'DELETE' })
  }

  return { get, post, put, del }
}
