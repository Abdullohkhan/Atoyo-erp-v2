import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/axios'

export type UserRole = 'owner' | 'seller' | 'accountant'

export interface AuthUser {
  id: string
  username: string
  name: string
  role: UserRole
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

const saved = localStorage.getItem('auth_user')
const initialUser: AuthUser | null = saved ? JSON.parse(saved) : null

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    const res = await api.get<Array<AuthUser & { password: string; isActive: boolean }>>(
      `/users?username=${username}`,
    )
    const users = res.data
    const user = Array.isArray(users) ? users[0] : null
    if (!user || (user as any).password !== password) return rejectWithValue("Login yoki parol noto'g'ri")
    if (!(user as any).isActive) return rejectWithValue('Foydalanuvchi bloklangan')
    const { password: _pw, isActive: _ia, ...safe } = user as any
    return safe as AuthUser
  },
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (
    { userId, oldPass, newPass }: { userId: string; oldPass: string; newPass: string },
    { rejectWithValue },
  ) => {
    const res = await api.get<{ id: string; password: string }>(`/users/${userId}`)
    if ((res.data as any).password !== oldPass) return rejectWithValue("Eski parol noto'g'ri")
    await api.patch(`/users/${userId}`, { password: newPass })
    return true
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: initialUser, loading: false, error: null } as AuthState,
  reducers: {
    logout(state) {
      state.user = null
      localStorage.removeItem('auth_user')
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
      localStorage.setItem('auth_user', JSON.stringify(a.payload))
    })
    b.addCase(loginUser.rejected, (s, a) => {
      s.loading = false
      s.error = a.payload as string
    })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
