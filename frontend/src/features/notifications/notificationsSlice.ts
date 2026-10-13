import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '@/lib/axios'

export interface AppNotification { id: string; title: string; body: string | null; link: string | null; read: boolean; createdAt: string }

export const fetchNotifications = createAsyncThunk('notifications/fetch', async () =>
  (await api.get<{ items: AppNotification[]; unread: number }>('/notifications')).data)
export const markRead = createAsyncThunk('notifications/read', async (id: string) => { await api.post(`/notifications/${id}/read`); return id })
export const markAllRead = createAsyncThunk('notifications/readAll', async () => { await api.post('/notifications/read-all') })

const slice = createSlice({
  name: 'notifications',
  initialState: { items: [] as AppNotification[], unread: 0 },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchNotifications.fulfilled, (s, a) => { s.items = a.payload.items; s.unread = a.payload.unread })
    b.addCase(markRead.fulfilled, (s, a) => {
      const n = s.items.find((x) => x.id === a.payload)
      if (n && !n.read) { n.read = true; s.unread = Math.max(0, s.unread - 1) }
    })
    b.addCase(markAllRead.fulfilled, (s) => { s.items.forEach((n) => { n.read = true }); s.unread = 0 })
  },
})
export default slice.reducer
