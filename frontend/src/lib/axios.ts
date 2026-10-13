import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import i18n from '@/i18n'
import { loadSession, saveSession } from './session'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

let onExpired: () => void = () => {}
/** Called by the store so an expired session logs the user out. */
export const setSessionExpiredHandler = (fn: () => void) => { onExpired = fn }

api.interceptors.request.use((config) => {
  const s = loadSession()
  if (s) config.headers.Authorization = `Bearer ${s.accessToken}`
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const s = loadSession()
  if (!s) return null
  try {
    const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: s.refreshToken })
    saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user })
    return data.accessToken as string
  } catch {
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const url = original?.url ?? ''
    if (error.response?.status === 401 && original && !original._retry && !url.includes('/auth/')) {
      original._retry = true
      refreshing ??= refreshAccessToken().finally(() => { refreshing = null })
      const token = await refreshing
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
      saveSession(null)
      onExpired()
    }
    const msg = error.response?.data?.message
    // Server messages are Uzbek; known ones are translated, the rest are shown as-is.
    const serverMessage = Array.isArray(msg) ? msg.join(', ') : msg ? i18n.t(msg) : ''
    const message = serverMessage
      || (error.code === 'ERR_NETWORK' ? i18n.t("Server bilan aloqa yo'q") : error.message)
      || i18n.t('Xatolik yuz berdi')
    return Promise.reject(new Error(message))
  },
)

export default api
