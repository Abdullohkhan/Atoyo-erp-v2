# Haqiqiy backend'ga o'tish

Frontend `src/lib/axios.ts` orqali `VITE_API_URL` ga murojaat qiladi. Hozirgi API — `json-server` (REST, `db.json`).

## Majburiy o'zgarishlar

1. **Autentifikatsiya.** `POST /auth/login` → access (+ refresh) token; parol serverda hash (argon2/bcrypt) bilan tekshiriladi.
   Hozir `authSlice.ts` `/users` ni olib parolni brauzerda solishtiradi, `/users` esa parollar bilan ochiq — bu faqat demo.
   `axios` interceptor'iga `Authorization` sarlavhasi va 401 da chiqish qo'shiladi.
2. **Ruxsatlar (RBAC) serverda.** `src/app/permissions.ts` dagi qoidalar endpointlarda ham majburlanadi; frontend faqat UI'ni yashiradi.
3. **Tranzaksiyali amallar.** `src/shared/services/operations.ts` dagi har bir funksiya bitta endpoint bo'ladi:
   - `POST /sale-orders/:id/confirm` · `/cancel`
   - `POST /purchase-orders` (+ `/confirm`, `/cancel`)
   - `POST /payments` (taqsimot serverda)
   - `POST /stock-movements`
   Qoldiq, harakat, faktura va qarz bir tranzaksiyada yangilanadi; parallel so'rovlarda qoldiq manfiy bo'lmasligi ta'minlanadi.
4. **Hujjat raqamlash serverda** (hozir `generateNumber` vaqtga asoslangan).
5. **Server tomonida validatsiya** (zod sxemalari frontend bilan bir xil bo'lishi mumkin), sahifalash, filtr, qidiruv (hozir hammasi brauzerda).
6. **Pul** — butun son (tiyin) yoki decimal; hisob-kitoblar serverda.
7. **Ma'lumotlar bazasi** (PostgreSQL), migratsiyalar, audit log (kim, nima, qachon).
8. **Xodim maoshi** kabi maxfiy maydonlar faqat ruxsati bor rollarga qaytariladi.

## Frontend'da o'zgaradigan joylar

- `authSlice.ts` — login/token.
- `operations.ts` — endpoint chaqiruvlari (biznes mantiq serverga ko'chadi, `calc.ts` faqat ko'rsatish uchun qoladi).
- Slice'lardagi `fetch*` — sahifalash/filtr parametrlari.
