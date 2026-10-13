import { z } from 'zod'

// Error messages are Uzbek translation keys; components translate them when rendering.
export const reqStr = (min = 1) =>
  z.string("Majburiy maydon").trim().min(min, min > 1 ? "Kamida 2 ta belgi" : 'Majburiy maydon')
export const optStr = z.string().trim().optional().or(z.literal(''))
export const phone = z.string("Majburiy maydon").trim().regex(/^\+?[0-9\s()-]{9,18}$/, "Telefon raqami noto'g'ri")
export const optEmail = z.string().trim().email("Email noto'g'ri").optional().or(z.literal(''))
export const money = z.number("Son kiriting").min(0, "Manfiy bo'lmasligi kerak")
export const positive = z.number("Son kiriting").positive("0 dan katta bo'lishi kerak")
