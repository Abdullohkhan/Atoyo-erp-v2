import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Customer } from '@/shared/types/catalog.types'
import api from '@/lib/axios'

interface State { items: Customer[]; loading: boolean; error: string | null }
const initialState: State = { items: [], loading: false, error: null }

export const fetchCustomers = createAsyncThunk('customers/fetchAll', async () => (await api.get<Customer[]>('/customers')).data)
export const createCustomer = createAsyncThunk('customers/create', async (data: Omit<Customer, 'id'>) => (await api.post<Customer>('/customers', data)).data)
export const updateCustomer = createAsyncThunk('customers/update', async ({ id, data }: { id: string; data: Partial<Customer> }) => (await api.patch<Customer>(`/customers/${id}`, data)).data)
export const deleteCustomer = createAsyncThunk('customers/delete', async (id: string) => { await api.delete(`/customers/${id}`); return id })

const slice = createSlice({
  name: 'customers', initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchCustomers.pending, (s) => { s.loading = true })
    b.addCase(fetchCustomers.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
    b.addCase(fetchCustomers.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Xatolik' })
    b.addCase(createCustomer.fulfilled, (s, a) => { s.items.push(a.payload) })
    b.addCase(updateCustomer.fulfilled, (s, a) => { const i = s.items.findIndex((x) => x.id === a.payload.id); if (i !== -1) s.items[i] = a.payload })
    b.addCase(deleteCustomer.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload) })
  },
})
export default slice.reducer
