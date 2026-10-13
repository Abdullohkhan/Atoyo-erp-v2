import type { AuthUser } from '@/features/auth/authSlice'

export interface Session {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

const KEY = 'session'

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Partial<Session>
    if (s.accessToken && s.refreshToken && s.user && Array.isArray(s.user.permissions)) return s as Session
  } catch { /* corrupted or unavailable storage */ }
  return null
}

export function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch { /* ignore */ }
}
