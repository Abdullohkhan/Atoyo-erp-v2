import type { UserRole } from '@/features/auth/authSlice'

const ALL: UserRole[] = ['owner', 'seller', 'accountant']

/** Which roles may open which page. */
export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/': ALL,
  '/catalogs/products': ALL,
  '/catalogs/customers': ALL,
  '/catalogs/customers/:id': ALL,
  '/catalogs/suppliers': ['owner', 'accountant'],
  '/catalogs/employees': ['owner'],
  '/catalogs/warehouses': ALL,
  '/sales/orders': ALL,
  '/sales/orders/new': ['owner', 'seller'],
  '/sales/invoices': ALL,
  '/purchases/orders': ['owner', 'accountant'],
  '/purchases/receipts/new': ['owner', 'accountant'],
  '/warehouse/balance': ALL,
  '/warehouse/movements': ALL,
  '/finance/payments': ['owner', 'accountant'],
  '/reports/sales': ['owner', 'accountant'],
  '/reports/stock': ['owner', 'accountant'],
}

/** Which roles may perform which action (buttons, dialogs). */
export const ACTION_ACCESS = {
  'products.write': ['owner'],
  'customers.write': ['owner', 'seller'],
  'suppliers.write': ['owner', 'accountant'],
  'employees.write': ['owner'],
  'warehouses.write': ['owner'],
  'sales.create': ['owner', 'seller'],
  'sales.confirm': ['owner', 'seller'],
  'sales.cancel': ['owner'],
  'purchases.create': ['owner', 'accountant'],
  'purchases.confirm': ['owner', 'accountant'],
  'purchases.cancel': ['owner'],
  'invoices.create': ['owner', 'accountant'],
  'payments.write': ['owner', 'accountant'],
  'movements.create': ['owner'],
  'finance.view': ['owner', 'accountant'],
} as const satisfies Record<string, UserRole[]>

export type Action = keyof typeof ACTION_ACCESS

export const canAccess = (role: UserRole | undefined, path: string): boolean =>
  !!role && (ROUTE_ACCESS[path] ?? []).includes(role)

export const can = (role: UserRole | undefined, action: Action): boolean =>
  !!role && (ACTION_ACCESS[action] as readonly UserRole[]).includes(role)
