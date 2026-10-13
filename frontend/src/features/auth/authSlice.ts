import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/axios'
import i18n from '@/i18n'

export type UserRole = 'owner' | 'seller' | 'accountant'

export interface AuthUser {
  id: string
  username: string
  name: string
  role: UserRole
}

interface StoredUser extends AuthUser {
  password: string
  isActive: boolean
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

const ROLES: UserRole[] = ['owner', 'seller', 'accountant']

const readSavedUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return null
    const u = JSON.parse(raw) as Partial<AuthUser>
    if (u && typeof u.id === 'string' && typeof u.name === 'string' && ROLES.includes(u.role as UserRole)) return u as AuthUser
  } catch { /* corrupted or unavailable storage */ }
  return null
}

// NOTE: demo-only authentication against json-server. A real backend must verify the
// password server-side (hashed) and return a token; the client must never see passwords.
export const loginUser = createAsyncThunk<AuthUser, { username: string; password: string }, { rejectValue: string }>(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    const res = await api.get<StoredUser[]>(`/users?username=${encodeURIComponent(username.trim())}`)
    const user = res.data[0]
    if (!user || user.password !== password) return rejectWithValue(i18n.t("Login yoki parol noto'g'ri"))
    if (!user.isActive) return rejectWithValue(i18n.t('Foydalanuvchi bloklangan'))
    return { id: user.id, username: user.username, name: user.name, role: user.role }
  },
)

export const changePassword = createAsyncThunk<boolean, { userId: string; oldPass: string; newPass: string }, { rejectValue: string }>(
  'auth/changePassword',
  async ({ userId, oldPass, newPass }, { rejectWithValue }) => {
    const res = await api.get<StoredUser>(`/users/${userId}`)
    if (res.data.password !== oldPass) return rejectWithValue(i18n.t("Eski parol noto'g'ri"))
    await api.patch(`/users/${userId}`, { password: newPass })
    return true
  },
)

const initialState: AuthState = { user: readSavedUser(), loading: false, error: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      try { localStorage.removeItem('auth_user') } catch { /* ignore */ }
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (b) => {
    b.addCase(loginUser.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(loginUser.fulfilled, (s, a) => {
      s.loading = false
      s.user = a.payload
      try { localStorage.setItem('auth_user', JSON.stringify(a.payload)) } catch { /* ignore */ }
    })
    b.addCase(loginUser.rejected, (s, a) => {
      s.loading = false
      s.error = a.payload ?? a.error.message ?? i18n.t('Xatolik yuz berdi')
    })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
