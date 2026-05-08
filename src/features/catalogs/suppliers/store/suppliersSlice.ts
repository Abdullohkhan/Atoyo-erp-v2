import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Supplier } from '@/shared/types/catalog.types'
import api from '@/lib/axios'

interface State { items: Supplier[]; loading: boolean; error: string | null }
const initialState: State = { items: [], loading: false, error: null }

export const fetchSuppliers = createAsyncThunk('suppliers/fetchAll', async () => (await api.get<Supplier[]>('/suppliers')).data)
export const createSupplier = createAsyncThunk('suppliers/create', async (data: Omit<Supplier, 'id'>) => (await api.post<Supplier>('/suppliers', data)).data)
export const updateSupplier = createAsyncThunk('suppliers/update', async ({ id, data }: { id: string; data: Partial<Supplier> }) => (await api.patch<Supplier>(`/suppliers/${id}`, data)).data)
export const deleteSupplier = createAsyncThunk('suppliers/delete', async (id: string) => { await api.delete(`/suppliers/${id}`); return id })

const slice = createSlice({
  name: 'suppliers', initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchSuppliers.pending, (s) => { s.loading = true })
    b.addCase(fetchSuppliers.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
    b.addCase(fetchSuppliers.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Xatolik' })
    b.addCase(createSupplier.fulfilled, (s, a) => { s.items.push(a.payload) })
    b.addCase(updateSupplier.fulfilled, (s, a) => { const i = s.items.findIndex((x) => x.id === a.payload.id); if (i !== -1) s.items[i] = a.payload })
    b.addCase(deleteSupplier.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload) })
  },
})
export default slice.reducer
