import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { PurchaseOrder } from '@/shared/types/document.types'
import api from '@/lib/axios'

interface State { items: PurchaseOrder[]; loading: boolean; error: string | null }
const initialState: State = { items: [], loading: false, error: null }

export const fetchPurchaseOrders = createAsyncThunk('purchaseOrders/fetchAll', async () => (await api.get<PurchaseOrder[]>('/purchase-orders')).data)
export const createPurchaseOrder = createAsyncThunk('purchaseOrders/create', async (data: Omit<PurchaseOrder, 'id'>) => (await api.post<PurchaseOrder>('/purchase-orders', data)).data)
export const updatePurchaseOrder = createAsyncThunk('purchaseOrders/update', async ({ id, data }: { id: string; data: Partial<PurchaseOrder> }) => (await api.patch<PurchaseOrder>(`/purchase-orders/${id}`, data)).data)
export const deletePurchaseOrder = createAsyncThunk('purchaseOrders/delete', async (id: string) => { await api.delete(`/purchase-orders/${id}`); return id })

const slice = createSlice({
  name: 'purchaseOrders', initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPurchaseOrders.pending, (s) => { s.loading = true })
    b.addCase(fetchPurchaseOrders.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
    b.addCase(fetchPurchaseOrders.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Xatolik' })
    b.addCase(createPurchaseOrder.fulfilled, (s, a) => { s.items.unshift(a.payload) })
    b.addCase(updatePurchaseOrder.fulfilled, (s, a) => { const i = s.items.findIndex((x) => x.id === a.payload.id); if (i !== -1) s.items[i] = a.payload })
    b.addCase(deletePurchaseOrder.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload) })
  },
})
export default slice.reducer
