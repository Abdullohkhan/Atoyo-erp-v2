export type ProductCategory = 'electronics' | 'clothing' | 'food' | 'building' | 'chemical' | 'other'
export type UnitOfMeasure = 'dona' | 'kg' | 'litr' | 'm' | 'm²' | 'm³' | 'quti' | 'juft'

export interface Product {
  id: string
  code: string
  name: string
  unit: UnitOfMeasure
  category: ProductCategory
  price: number
  costPrice: number
  barcode?: string
  tnvedCode?: string | null
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  code: string
  name: string
  phone: string
  email?: string
  address?: string
  inn?: string
  debt: number
  totalPurchases: number
  isActive: boolean
  createdAt: string
}

export interface Supplier {
  id: string
  code: string
  name: string
  phone: string
  email?: string
  address?: string
  inn?: string
  balance: number
  totalSupplied: number
  isActive: boolean
  createdAt: string
}

export interface Employee {
  id: string
  code: string
  fullName: string
  position: string
  department: string
  salary: number
  phone: string
  email?: string
  hireDate: string
  isActive: boolean
  createdAt: string
}

export interface Warehouse {
  id: string
  code: string
  name: string
  address?: string
  manager?: string
  isActive: boolean
  createdAt: string
}
