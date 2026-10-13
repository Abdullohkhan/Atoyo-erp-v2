import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { StockBalance } from '@/shared/types/common.types'
import api from '@/lib/axios'

interface State { items: StockBalance[]; loading: boolean; error: string | null }
const initialState: State = { items: [], loading: false, error: null }

export const fetchBalance = createAsyncThunk('balance/fetchAll', async () => (await api.get<StockBalance[]>('/stockBalance')).data)

const slice = createSlice({
  name: 'balance', initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchBalance.pending, (s) => { s.loading = true })
    b.addCase(fetchBalance.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
    b.addCase(fetchBalance.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Xatolik' })
  },
})
export default slice.reducer
