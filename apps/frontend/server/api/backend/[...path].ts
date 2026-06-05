export default defineEventHandler(async (event) => {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001'
  const path = event.context.params?.path ?? ''
  const query = getQuery(event)
  const queryString = new URLSearchParams(query as Record<string, string>).toString()
  const url = `${backendUrl}/${path}${queryString ? `?${queryString}` : ''}`

  return proxyRequest(event, url)
})
