export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth()

  if (to.meta.guestOnly && user.value) return navigateTo('/')
  if (!to.meta.public && !to.meta.guestOnly && !user.value) return navigateTo('/login')
})
