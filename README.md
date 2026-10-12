# Atoyo ERP

1C uslubidagi ERP tizimi: kataloglar, savdo, xarid, ombor, moliya va hisobotlar.
Frontend: React 19 + TypeScript + Vite + MUI + Redux Toolkit. Hozircha backend o'rnida `json-server` (`db.json`) ishlaydi.

Muallif: [Abdullohkhan](https://t.me/Abdulloh_77700) · [abdulmajidsharipovlc@gmail.com](mailto:abdulmajidsharipovlc@gmail.com)

## Ishga tushirish

```bash
npm install
npm run dev        # vite (5173) + json-server (3001) birga
```

Boshqa buyruqlar: `npm run lint`, `npm test`, `npm run typecheck`, `npm run build`.
API manzilini `.env` faylida `VITE_API_URL` bilan o'zgartirish mumkin (`.env.example`).

> `npm run dev` ishlaganda `json-server` `db.json` ni **o'zgartiradi**. Toza holatga qaytarish: `git checkout db.json`.

## Demo hisoblar (faqat dev rejimida login sahifasida ko'rinadi)

| Rol | Login | Parol |
|---|---|---|
| Direktor | `admin` | `admin123` |
| Sotuvchi | `seller1` | `seller123` |
| Moliyachi | `accountant` | `acc123` |

## Rollar va ruxsatlar

Barcha qoidalar bitta joyda: `src/app/permissions.ts` (sahifalar `ROUTE_ACCESS`, tugmalar `ACTION_ACCESS`).

| Bo'lim | Direktor | Sotuvchi | Moliyachi |
|---|:-:|:-:|:-:|
| Dashboard, mahsulotlar, mijozlar, omborlar, savdo buyurtmalari, fakturalar, qoldiq, harakat | ✅ | ✅ | ✅ |
| Mahsulot / ombor yaratish, tahrirlash | ✅ | — | — |
| Mijoz tahrirlash, yangi savdo, buyurtmani tasdiqlash | ✅ | ✅ | — |
| Yetkazuvchilar, xarid, kirim (yuk keldi), faktura yaratish | ✅ | — | ✅ |
| To'lovlar, hisobotlar | ✅ | — | ✅ |
| Xodimlar (maosh) | ✅ | — | — |
| Tovar harakati yaratish, tasdiqlangan hujjatni bekor qilish | ✅ | — | — |

Sotuvchiga tannarx ko'rsatilmaydi.

## Biznes mantiq (`src/shared/services/operations.ts`)

- **Savdo buyurtmasini tasdiqlash:** ombor qoldig'i kamayadi, "chiqim" harakati yoziladi, faktura yaratiladi, mijoz qarzi oshadi. Qoldiq yetmasa rad etiladi.
- **Xarid (yuk keldi) tasdiqlash:** qoldiq oshadi (o'rtacha tannarx qayta hisoblanadi), mahsulot narxlari yangilanadi, faktura va yetkazuvchi qarzi yoziladi.
- **To'lov:** mijoz/yetkazuvchi tanlansa, summa ochiq hujjatlarga eskisidan boshlab taqsimlanadi (hujjat, faktura, qarz yangilanadi).
- **Bekor qilish:** qoldiq va qarz qaytariladi. To'lov qilingan hujjatni bekor qilib bo'lmaydi.
- Hozir bu amallar bir nechta so'rov bilan bajariladi (tranzaksiya yo'q). Haqiqiy backend'da bitta tranzaksiyali endpoint bo'lishi kerak — `docs/BACKEND.md`.

## Tillar va rejimlar

- Til: O'zbekcha / Русский / English (yuqoridagi panel, `localStorage` da saqlanadi). Matn kaliti — o'zbekcha matnning o'zi; tarjimalar `src/i18n/locales/`. Dev rejimida tarjimasiz kalitlar `window.__missingKeys` ga yig'iladi.
- Dark / light rejim (yuqoridagi tugma).
- Telefon uchun moslashgan: jadvallar kartochkaga aylanadi, yon panel drawer bo'ladi.

## Tuzilma

```
src/
  app/        store, router, ruxsatlar, ui (toast) slice
  features/   modul bo'yicha: catalogs, sales, purchases, warehouse, finance, reports, dashboard, auth
  shared/     komponentlar (DataTable, CrudDialog, ...), services (calc, stats, operations), utils
  i18n/       i18next sozlamasi va tarjimalar
```
