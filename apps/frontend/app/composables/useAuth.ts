export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

export function useAuth() {
  const { $api } = useNuxtApp()
  const router = useRouter()
  const user = useState<AuthUser | null>('auth.user', () => null)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(email: string, password: string) {
    await $api('/auth/login', { method: 'POST', body: { email, password } })
    const me = await $api<AuthUser>('/auth/me')
    user.value = me
  }

  async function logout() {
    await $api('/auth/logout', { method: 'POST' })
    user.value = null
    await router.push('/login')
  }

  async function register(name: string, email: string, password: string) {
    await $api('/auth/register', { method: 'POST', body: { name, email, password } })
    const me = await $api<AuthUser>('/auth/me')
    user.value = me
  }

  return { user, isAdmin, login, logout, register }
}
