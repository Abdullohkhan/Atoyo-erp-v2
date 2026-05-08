import { createSlice } from '@reduxjs/toolkit'
import type { ThemeMode } from '@/shared/types/common.types'

interface ThemeState {
  mode: ThemeMode
}

const saved = (localStorage.getItem('theme') as ThemeMode) || 'light'

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: saved } as ThemeState,
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', state.mode)
    },
    setTheme(state, action: { payload: ThemeMode }) {
      state.mode = action.payload
      localStorage.setItem('theme', state.mode)
    },
  },
})

export const { toggleTheme, setTheme } = themeSlice.actions
export default themeSlice.reducer
