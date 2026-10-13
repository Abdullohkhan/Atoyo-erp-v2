import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { StockMovement } from '@/shared/types/document.types'
import api from '@/lib/axios'

interface State { items: StockMovement[]; loading: boolean; error: string | null }
const initialState: State = { items: [], loading: false, error: null }

export const fetchMovements = createAsyncThunk('movements/fetchAll', async () => (await api.get<StockMovement[]>('/movements')).data)
export const createMovement = createAsyncThunk('movements/create', async (data: Omit<StockMovement, 'id'>) => (await api.post<StockMovement>('/movements', data)).data)
export const updateMovement = createAsyncThunk('movements/update', async ({ id, data }: { id: string; data: Partial<StockMovement> }) => (await api.patch<StockMovement>(`/movements/${id}`, data)).data)
export const deleteMovement = createAsyncThunk('movements/delete', async (id: string) => { await api.delete(`/movements/${id}`); return id })

const slice = createSlice({
  name: 'movements', initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMovements.pending, (s) => { s.loading = true })
    b.addCase(fetchMovements.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
    b.addCase(fetchMovements.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Xatolik' })
    b.addCase(createMovement.fulfilled, (s, a) => { s.items.unshift(a.payload) })
    b.addCase(updateMovement.fulfilled, (s, a) => { const i = s.items.findIndex((x) => x.id === a.payload.id); if (i !== -1) s.items[i] = a.payload })
    b.addCase(deleteMovement.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload) })
  },
})
export default slice.reducer
