import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Payment } from '@/shared/types/document.types'
import api from '@/lib/axios'

interface State { items: Payment[]; loading: boolean; error: string | null }
const initialState: State = { items: [], loading: false, error: null }

export const fetchPayments = createAsyncThunk('payments/fetchAll', async () => (await api.get<Payment[]>('/payments')).data)
export const createPayment = createAsyncThunk('payments/create', async (data: Omit<Payment, 'id'>) => (await api.post<Payment>('/payments', data)).data)
export const deletePayment = createAsyncThunk('payments/delete', async (id: string) => { await api.delete(`/payments/${id}`); return id })

const slice = createSlice({
  name: 'payments', initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPayments.pending, (s) => { s.loading = true })
    b.addCase(fetchPayments.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
    b.addCase(fetchPayments.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Xatolik' })
    b.addCase(createPayment.fulfilled, (s, a) => { s.items.unshift(a.payload) })
    b.addCase(deletePayment.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload) })
  },
})
export default slice.reducer
