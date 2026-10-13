# Backend arxitekturasi

- **NestJS 12 (ESM)**, `backend/src`:
  - `auth/` — JWT (access + refresh), global `AuthGuard` (token + `@Perm()`), ruxsatlar katalogi va standart rollar.
  - `users/` — foydalanuvchilar va rollar (owner qoidalari).
  - `catalog/` — 5 ta katalog uchun umumiy CRUD (zod validatsiya, tannarxni yashirish).
  - `stock/` — barcha qoldiq o'zgarishlari `StockService.apply()` orqali (`SELECT … FOR UPDATE`, yetmasa xato, o'rtacha tannarx).
  - `finance/` — savdo/xarid tasdiqlash va bekor qilish, faktura, to'lov FIFO taqsimoti.
  - `requests/` — zayavka jarayoni (`workflow.ts` holatlar va mas'ullar, `pricing.ts` tannarx formulasi, `requests.service.ts` amallar), bildirishnomalar.
  - `documents/` — shartnoma shablonlari, HTML render (`{{placeholder}}`, qiymatlar escape qilinadi), shartnoma va akt ro'yxatlari.
  - `system/` — sozlamalar, bildirishnomalar, audit, health.
  - `common/` — Prisma, xatolar filtri (Prisma xatolari → 404/409), Decimal → son, zod pipe, hujjat raqamlash (`Counter`), audit.
- **Prisma 7 + PostgreSQL**: `backend/prisma/schema.prisma`, migratsiyalar `prisma/migrations`, seed `prisma/seed.ts` (idempotent).
- Pul: `Decimal(18,2)`, miqdor: `Decimal(18,3)`; JSON'da son bo'lib qaytadi.
- Har bir biznes amal bitta tranzaksiya; zayavka qatori ham `FOR UPDATE` bilan bloklanadi.
- Testlar: `backend/test/*.e2e.ts` (node:test + supertest), alohida test bazasida to'liq jarayonni 9 ta rol bilan o'tkazadi.
