import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Product } from '@/shared/types/catalog.types'
import api from '@/lib/axios'

interface ProductsState {
  items: Product[]
  loading: boolean
  error: string | null
}

const initialState: ProductsState = { items: [], loading: false, error: null }

export const fetchProducts = createAsyncThunk('products/fetchAll', async () => {
  const res = await api.get<Product[]>('/products')
  return res.data
})

export const createProduct = createAsyncThunk('products/create', async (data: Omit<Product, 'id'>) => {
  const res = await api.post<Product>('/products', data)
  return res.data
})

export const updateProduct = createAsyncThunk('products/update', async ({ id, data }: { id: string; data: Partial<Product> }) => {
  const res = await api.patch<Product>(`/products/${id}`, data)
  return res.data
})

export const deleteProduct = createAsyncThunk('products/delete', async (id: string) => {
  await api.delete(`/products/${id}`)
  return id
})

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchProducts.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
      .addCase(fetchProducts.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Xatolik' })
      .addCase(createProduct.fulfilled, (s, a) => { s.items.push(a.payload) })
      .addCase(updateProduct.fulfilled, (s, a) => {
        const i = s.items.findIndex((p) => p.id === a.payload.id)
        if (i !== -1) s.items[i] = a.payload
      })
      .addCase(deleteProduct.fulfilled, (s, a) => {
        s.items = s.items.filter((p) => p.id !== a.payload)
      })
  },
})

export default productsSlice.reducer
