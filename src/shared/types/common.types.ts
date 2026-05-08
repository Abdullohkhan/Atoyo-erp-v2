export interface ApiResponse<T> {
  data: T
  total?: number
  page?: number
}

export interface TableColumn<T> {
  id: keyof T | string
  label: string
  minWidth?: number
  align?: 'left' | 'right' | 'center'
  format?: (value: unknown, row: T) => React.ReactNode
}

export interface PaginationState {
  page: number
  rowsPerPage: number
}

export interface FilterState {
  search: string
  [key: string]: unknown
}

export interface StockBalance {
  id: string
  warehouseId: string
  warehouseName: string
  productId: string
  productName: string
  productCode: string
  unit: string
  qty: number
  reservedQty: number
  availableQty: number
  costPrice: number
  totalValue: number
}

export type ThemeMode = 'light' | 'dark'

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  read: boolean
  createdAt: string
}
