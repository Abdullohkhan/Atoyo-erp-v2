import dayjs from 'dayjs'
import 'dayjs/locale/uz'

dayjs.locale('uz')

export const formatCurrency = (amount: number, currency = 'UZS'): string => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ` ${currency}`
}

export const formatNumber = (num: number): string =>
  new Intl.NumberFormat('uz-UZ').format(num)

export const formatDate = (date: string | Date): string =>
  dayjs(date).format('DD.MM.YYYY')

export const formatDateTime = (date: string | Date): string =>
  dayjs(date).format('DD.MM.YYYY HH:mm')

export const formatShortDate = (date: string | Date): string =>
  dayjs(date).format('DD MMM YYYY')

export const generateCode = (prefix: string, num: number): string =>
  `${prefix}-${String(num).padStart(6, '0')}`

export const generateId = (): string =>
  Math.random().toString(36).substring(2) + Date.now().toString(36)

export const truncate = (str: string, max: number): string =>
  str.length > max ? str.slice(0, max) + '…' : str

export const getInitials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
