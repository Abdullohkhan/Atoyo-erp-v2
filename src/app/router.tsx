import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '@/shared/components/Layout/AppLayout'
import ProtectedRoute from '@/features/auth/ProtectedRoute'
import LoginPage from '@/features/auth/LoginPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import ProductsPage from '@/features/catalogs/products/ProductsPage'
import CustomersPage from '@/features/catalogs/customers/CustomersPage'
import CustomerDetailPage from '@/features/catalogs/customers/CustomerDetailPage'
import SuppliersPage from '@/features/catalogs/suppliers/SuppliersPage'
import EmployeesPage from '@/features/catalogs/employees/EmployeesPage'
import WarehousesPage from '@/features/catalogs/warehouses/WarehousesPage'
import SaleOrdersPage from '@/features/sales/orders/SaleOrdersPage'
import NewOrderPage from '@/features/sales/neworder/NewOrderPage'
import InvoicesPage from '@/features/sales/invoices/InvoicesPage'
import PurchaseOrdersPage from '@/features/purchases/orders/PurchaseOrdersPage'
import ReceiptPage from '@/features/purchases/receipts/ReceiptPage'
import WarehouseBalancePage from '@/features/warehouse/balance/WarehouseBalancePage'
import MovementsPage from '@/features/warehouse/movements/MovementsPage'
import PaymentsPage from '@/features/finance/payments/PaymentsPage'
import SalesReportPage from '@/features/reports/sales/SalesReportPage'
import StockReportPage from '@/features/reports/stock/StockReportPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'catalogs/products',         element: <ProductsPage /> },
      { path: 'catalogs/customers',        element: <CustomersPage /> },
      { path: 'catalogs/customers/:id',    element: <CustomerDetailPage /> },
      { path: 'catalogs/suppliers',        element: <SuppliersPage /> },
      { path: 'catalogs/employees',        element: <EmployeesPage /> },
      { path: 'catalogs/warehouses',       element: <WarehousesPage /> },
      { path: 'sales/orders',              element: <SaleOrdersPage /> },
      { path: 'sales/orders/new',          element: <NewOrderPage /> },
      { path: 'sales/invoices',            element: <InvoicesPage /> },
      { path: 'purchases/orders',          element: <PurchaseOrdersPage /> },
      { path: 'purchases/receipts/new',    element: <ReceiptPage /> },
      { path: 'warehouse/balance',         element: <WarehouseBalancePage /> },
      { path: 'warehouse/movements',       element: <MovementsPage /> },
      { path: 'finance/payments',          element: <PaymentsPage /> },
      { path: 'reports/sales',             element: <SalesReportPage /> },
      { path: 'reports/stock',             element: <StockReportPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
