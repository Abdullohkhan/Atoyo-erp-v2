import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Employee } from '@/shared/types/catalog.types'
import api from '@/lib/axios'

interface State { items: Employee[]; loading: boolean; error: string | null }
const initialState: State = { items: [], loading: false, error: null }

export const fetchEmployees = createAsyncThunk('employees/fetchAll', async () => (await api.get<Employee[]>('/employees')).data)
export const createEmployee = createAsyncThunk('employees/create', async (data: Omit<Employee, 'id'>) => (await api.post<Employee>('/employees', data)).data)
export const updateEmployee = createAsyncThunk('employees/update', async ({ id, data }: { id: string; data: Partial<Employee> }) => (await api.patch<Employee>(`/employees/${id}`, data)).data)
export const deleteEmployee = createAsyncThunk('employees/delete', async (id: string) => { await api.delete(`/employees/${id}`); return id })

const slice = createSlice({
  name: 'employees', initialState, reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchEmployees.pending, (s) => { s.loading = true })
    b.addCase(fetchEmployees.fulfilled, (s, a) => { s.loading = false; s.items = a.payload })
    b.addCase(fetchEmployees.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Xatolik' })
    b.addCase(createEmployee.fulfilled, (s, a) => { s.items.push(a.payload) })
    b.addCase(updateEmployee.fulfilled, (s, a) => { const i = s.items.findIndex((x) => x.id === a.payload.id); if (i !== -1) s.items[i] = a.payload })
    b.addCase(deleteEmployee.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload) })
  },
})
export default slice.reducer
