import type { ProductCategory, UnitOfMeasure } from '@/shared/types/catalog.types'

// Labels are Uzbek translation keys; render them with t().
export const STATUS_LABELS: Record<string, string> = {
  draft: 'Qoralama', confirmed: 'Tasdiqlangan', completed: 'Bajarildi', cancelled: 'Bekor',
  unpaid: "To'lanmagan", partial: 'Qisman', paid: "To'langan",
}

export const PAYMENT_TYPES: Record<string, string> = { cash: 'Naqd', card: 'Karta', transfer: "O'tkazma" }

export const CATEGORIES: ProductCategory[] = ['electronics', 'clothing', 'food', 'building', 'chemical', 'other']
export const UNITS: UnitOfMeasure[] = ['dona', 'kg', 'litr', 'm', 'm²', 'm³', 'quti', 'juft']
export const CAT_LABELS: Record<ProductCategory, string> = {
  electronics: 'Elektronika', clothing: 'Kiyim', food: 'Oziq-ovqat',
  building: 'Qurilish', chemical: 'Kimyo', other: 'Boshqa',
}

export const MOVEMENT_TYPES: Record<string, string> = {
  receipt: 'Kirim', dispatch: 'Chiqim', transfer: "Ko'chirish", writeoff: 'Hisobdan chiqarish', adjustment: 'Tuzatish',
}

export const ROLE_LABELS: Record<string, string> = { owner: 'Direktor', seller: 'Sotuvchi', accountant: 'Moliyachi' }

/** Stock at or below this quantity is shown as "low". */
export const LOW_STOCK_LIMIT = 10
