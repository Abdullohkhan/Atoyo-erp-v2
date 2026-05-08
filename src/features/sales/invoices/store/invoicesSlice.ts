import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Invoice } from '@/shared/types/document.types'
import api from '@/lib/axios'

interface State { items: Invoice[]; loading: boolean; error: string | null }
const initialState: State = { items: [], loading: false, error: null }

export const fetchInvoices = createAsyncThunk('invoices/fetchAll', async () => (await api.get<Invoice[]>('/invoices')).data)
export const createInvoice = createAsyncThunk('invoices/create', async (data: Omit<Invoice, 'id'>) => (await api.post<Invoice>('/invoices', data)).data)
export const updateInvoice = createAsyncThunk('invoices/update', async ({ id, data }: { id: string; data: Partial<Invoice> }) => (await api.patch<Invoice>(`/invoices/${id}`, data)).data)
export const deleteInvoice = createAsyncThunk('invoices/delete', async (id: string) => { await api.delete(`/invoices/${id}`); return id })

const slice = createSlice({
  name: 'invoices', initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchInvoices.pending, (s) => { s.loading = true })
    b.addCase(fetchInvoices.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
    b.addCase(fetchInvoices.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Xatolik' })
    b.addCase(createInvoice.fulfilled, (s, a) => { s.items.unshift(a.payload) })
    b.addCase(updateInvoice.fulfilled, (s, a) => { const i = s.items.findIndex((x) => x.id === a.payload.id); if (i !== -1) s.items[i] = a.payload })
    b.addCase(deleteInvoice.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload) })
  },
})
export default slice.reducer
