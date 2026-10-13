import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/axios'
import { loadSession, saveSession } from '@/lib/session'
import type { Permission } from '@/app/permissions'

export interface AuthUser {
  id: string
  username: string
  fullName: string
  roleKey: string
  roleName: string
  permissions: Permission[]
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

export const loginUser = createAsyncThunk<AuthUser, { username: string; password: string }, { rejectValue: string }>(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { username: username.trim(), password })
      saveSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user })
      return data.user as AuthUser
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Error')
    }
  },
)

/** Re-reads the current user (permissions may have been changed by the owner). */
export const refreshMe = createAsyncThunk('auth/me', async () => {
  const { data } = await api.get<AuthUser>('/auth/me')
  const s = loadSession()
  if (s) saveSession({ ...s, user: data })
  return data
})

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout') } catch { /* already expired */ }
  saveSession(null)
})

export const changePassword = createAsyncThunk<void, { oldPassword: string; newPassword: string }, { rejectValue: string }>(
  'auth/changePassword',
  async (body, { rejectWithValue }) => {
    try { await api.post('/auth/change-password', body) } catch (e) { return rejectWithValue(e instanceof Error ? e.message : 'Error') }
  },
)

const initialState: AuthState = { user: loadSession()?.user ?? null, loading: false, error: null }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      saveSession(null)
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (b) => {
    b.addCase(loginUser.pending, (s) => { s.loading = true; s.error = null })
    b.addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload })
    b.addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload ?? a.error.message ?? 'Error' })
    b.addCase(refreshMe.fulfilled, (s, a) => { s.user = a.payload })
    b.addCase(logoutUser.fulfilled, (s) => { s.user = null })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
