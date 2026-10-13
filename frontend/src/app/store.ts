import { configureStore, type ThunkAction, type UnknownAction } from '@reduxjs/toolkit'
import themeReducer from './themeSlice'
import uiReducer from './uiSlice'
import notificationsReducer from '@/features/notifications/notificationsSlice'
import authReducer from '@/features/auth/authSlice'
import productsReducer from '@/features/catalogs/products/store/productsSlice'
import customersReducer from '@/features/catalogs/customers/store/customersSlice'
import suppliersReducer from '@/features/catalogs/suppliers/store/suppliersSlice'
import employeesReducer from '@/features/catalogs/employees/store/employeesSlice'
import warehousesReducer from '@/features/catalogs/warehouses/store/warehousesSlice'
import saleOrdersReducer from '@/features/sales/orders/store/saleOrdersSlice'
import saleInvoicesReducer from '@/features/sales/invoices/store/invoicesSlice'
import purchaseOrdersReducer from '@/features/purchases/orders/store/purchaseOrdersSlice'
import movementsReducer from '@/features/warehouse/movements/store/movementsSlice'
import balanceReducer from '@/features/warehouse/balance/store/balanceSlice'
import paymentsReducer from '@/features/finance/payments/store/paymentsSlice'

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
    auth: authReducer,
    products: productsReducer,
    customers: customersReducer,
    suppliers: suppliersReducer,
    employees: employeesReducer,
    warehouses: warehousesReducer,
    saleOrders: saleOrdersReducer,
    saleInvoices: saleInvoicesReducer,
    purchaseOrders: purchaseOrdersReducer,
    movements: movementsReducer,
    balance: balanceReducer,
    payments: paymentsReducer,
  },
})

import { setSessionExpiredHandler } from '@/lib/axios'
import { logout } from '@/features/auth/authSlice'
setSessionExpiredHandler(() => store.dispatch(logout()))

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppThunk<R = void> = ThunkAction<R, RootState, unknown, UnknownAction>
