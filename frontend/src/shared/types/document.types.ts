export type DocumentStatus = 'draft' | 'confirmed' | 'cancelled' | 'completed'
export type PaymentType = 'cash' | 'card' | 'transfer'
export type MovementType = 'receipt' | 'dispatch' | 'transfer' | 'writeoff' | 'adjustment'

export interface DocumentItem {
  productId: string
  productName: string
  unit: string
  qty: number
  price: number
  discount: number
  sum: number
  /** Retail price set on goods receipt (purchases only). */
  salePrice?: number
}

export interface SaleOrder {
  id: string
  number: string
  date: string
  customerId: string
  customerName: string
  warehouseId: string
  warehouseName: string
  items: DocumentItem[]
  status: DocumentStatus
  total: number
  paid: number
  balance: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrder {
  id: string
  number: string
  date: string
  supplierId: string
  supplierName: string
  warehouseId: string
  warehouseName: string
  items: DocumentItem[]
  status: DocumentStatus
  total: number
  paid: number
  balance: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  number: string
  date: string
  type: 'sale' | 'purchase'
  orderId: string
  counterpartyId: string
  counterpartyName: string
  amount: number
  status: 'unpaid' | 'partial' | 'paid'
  dueDate: string
  createdAt: string
}

export interface Payment {
  id: string
  number: string
  date: string
  type: PaymentType
  direction: 'income' | 'expense'
  amount: number
  counterpartyId?: string
  counterpartyName?: string
  category: string
  description?: string
  createdAt: string
}

export interface StockMovement {
  id: string
  number: string
  date: string
  type: MovementType
  fromWarehouseId?: string
  fromWarehouseName?: string
  toWarehouseId?: string
  toWarehouseName?: string
  items: DocumentItem[]
  status: DocumentStatus
  notes?: string
  createdAt: string
}
