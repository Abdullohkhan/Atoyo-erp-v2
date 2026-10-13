import dayjs from 'dayjs'
import i18n from '@/i18n'

export const formatCurrency = (amount: number, currency = 'UZS'): string => {
  const n = Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat(i18n.language === 'uz' ? 'uz-UZ' : i18n.language, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n) + ` ${currency}`
}

export const formatNumber = (num: number): string =>
  new Intl.NumberFormat(i18n.language === 'uz' ? 'uz-UZ' : i18n.language).format(Number.isFinite(num) ? num : 0)

export const formatDate = (date: string | Date): string =>
  date ? dayjs(date).format('DD.MM.YYYY') : ''

export const formatDateTime = (date: string | Date): string =>
  date ? dayjs(date).format('DD.MM.YYYY HH:mm') : ''

export const formatShortDate = (date: string | Date): string =>
  dayjs(date).format('DD MMM YYYY')

export const generateCode = (prefix: string, num: number): string =>
  `${prefix}-${String(num).padStart(6, '0')}`

export const generateId = (): string =>
  Math.random().toString(36).substring(2) + Date.now().toString(36)

/** Document number such as SAV-123456 (placeholder until the backend numbers documents). */
export const generateNumber = (prefix: string): string =>
  `${prefix}-${String(Date.now()).slice(-6)}`

export const truncate = (str: string, max: number): string =>
  str.length > max ? str.slice(0, max) + '…' : str

export const getInitials = (name?: string | null): string =>
  (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?'
