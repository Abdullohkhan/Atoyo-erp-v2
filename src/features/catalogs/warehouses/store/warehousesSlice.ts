import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Warehouse } from '@/shared/types/catalog.types'
import api from '@/lib/axios'

interface State { items: Warehouse[]; loading: boolean; error: string | null }
const initialState: State = { items: [], loading: false, error: null }

export const fetchWarehouses = createAsyncThunk('warehouses/fetchAll', async () => (await api.get<Warehouse[]>('/warehouses')).data)
export const createWarehouse = createAsyncThunk('warehouses/create', async (data: Omit<Warehouse, 'id'>) => (await api.post<Warehouse>('/warehouses', data)).data)
export const updateWarehouse = createAsyncThunk('warehouses/update', async ({ id, data }: { id: string; data: Partial<Warehouse> }) => (await api.patch<Warehouse>(`/warehouses/${id}`, data)).data)
export const deleteWarehouse = createAsyncThunk('warehouses/delete', async (id: string) => { await api.delete(`/warehouses/${id}`); return id })

const slice = createSlice({
  name: 'warehouses', initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchWarehouses.pending, (s) => { s.loading = true })
    b.addCase(fetchWarehouses.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
    b.addCase(fetchWarehouses.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Xatolik' })
    b.addCase(createWarehouse.fulfilled, (s, a) => { s.items.push(a.payload) })
    b.addCase(updateWarehouse.fulfilled, (s, a) => { const i = s.items.findIndex((x) => x.id === a.payload.id); if (i !== -1) s.items[i] = a.payload })
    b.addCase(deleteWarehouse.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload) })
  },
})
export default slice.reducer
