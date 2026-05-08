import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { SaleOrder } from '@/shared/types/document.types'
import api from '@/lib/axios'

interface State { items: SaleOrder[]; loading: boolean; error: string | null }
const initialState: State = { items: [], loading: false, error: null }

export const fetchSaleOrders = createAsyncThunk('saleOrders/fetchAll', async () => (await api.get<SaleOrder[]>('/saleOrders')).data)
export const createSaleOrder = createAsyncThunk('saleOrders/create', async (data: Omit<SaleOrder, 'id'>) => (await api.post<SaleOrder>('/saleOrders', data)).data)
export const updateSaleOrder = createAsyncThunk('saleOrders/update', async ({ id, data }: { id: string; data: Partial<SaleOrder> }) => (await api.patch<SaleOrder>(`/saleOrders/${id}`, data)).data)
export const deleteSaleOrder = createAsyncThunk('saleOrders/delete', async (id: string) => { await api.delete(`/saleOrders/${id}`); return id })

const slice = createSlice({
  name: 'saleOrders', initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchSaleOrders.pending, (s) => { s.loading = true })
    b.addCase(fetchSaleOrders.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
    b.addCase(fetchSaleOrders.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Xatolik' })
    b.addCase(createSaleOrder.fulfilled, (s, a) => { s.items.unshift(a.payload) })
    b.addCase(updateSaleOrder.fulfilled, (s, a) => { const i = s.items.findIndex((x) => x.id === a.payload.id); if (i !== -1) s.items[i] = a.payload })
    b.addCase(deleteSaleOrder.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload) })
  },
})
export default slice.reducer
