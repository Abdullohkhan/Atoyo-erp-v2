import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/axios'

export interface ReceiptItem {
  productId: string
  productName: string
  productCode: string
  unit: string
  qty: number
  costPrice: number
  salePrice: number
  total: number
}

export interface Receipt {
  id: string
  number: string
  date: string
  supplierId: string
  supplierName: string
  warehouseId: string
  warehouseName: string
  items: ReceiptItem[]
  totalCost: number
  status: 'draft' | 'confirmed'
  notes?: string
  createdBy: string
  createdAt: string
}

interface State { items: Receipt[]; loading: boolean; error: string | null }
const initialState: State = { items: [], loading: false, error: null }

export const fetchReceipts = createAsyncThunk('receipts/fetchAll', async () =>
  (await api.get<Receipt[]>('/receipts')).data,
)
export const createReceipt = createAsyncThunk('receipts/create', async (data: Omit<Receipt, 'id'>) =>
  (await api.post<Receipt>('/receipts', data)).data,
)
export const updateReceipt = createAsyncThunk('receipts/update', async ({ id, data }: { id: string; data: Partial<Receipt> }) =>
  (await api.patch<Receipt>(`/receipts/${id}`, data)).data,
)

const slice = createSlice({
  name: 'receipts', initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchReceipts.pending, (s) => { s.loading = true })
    b.addCase(fetchReceipts.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
    b.addCase(fetchReceipts.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Xatolik' })
    b.addCase(createReceipt.fulfilled, (s, a) => { s.items.unshift(a.payload) })
    b.addCase(updateReceipt.fulfilled, (s, a) => {
      const i = s.items.findIndex((x) => x.id === a.payload.id)
      if (i !== -1) s.items[i] = a.payload
    })
  },
})
export default slice.reducer
