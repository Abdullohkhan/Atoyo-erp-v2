import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface Toast {
  id: number
  message: string
  severity: 'success' | 'error' | 'info' | 'warning'
}

let counter = 0

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toast: null as Toast | null },
  reducers: {
    notify(state, a: PayloadAction<{ message: string; severity?: Toast['severity'] }>) {
      state.toast = { id: ++counter, message: a.payload.message, severity: a.payload.severity ?? 'success' }
    },
    closeToast(state) { state.toast = null },
  },
})

export const { notify, closeToast } = uiSlice.actions
export default uiSlice.reducer
