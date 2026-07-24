# SpeakUp — Web (Admin panel + Backend)

Next.js (App Router) + Neon (Postgres) + Drizzle ORM. Vercel'ga deploy qilinadi.
Bu qism kontentni **dinamik** qiladi (admin panel), o'quvchilar progressini yig'adi
(o'qituvchi paneli) va Android ilovaga kontent + natija API'sini beradi.

## Nima bor

| Yo'l | Kim uchun |
|------|-----------|
| `/login` | Kirish (admin / o'qituvchi) |
| `/admin` | Kontent boshqaruvi: modul / mashq / dialog CRUD + **Publish** |
| `/admin/media` | Rasm yuklash (Vercel Blob) |
| `/teacher` | O'quvchilar progressi (statistika, so'nggi urinishlar) |
| `GET /api/content` | Ilova uchun butun kontent JSON (`?since=<version>`) |
| `GET /api/content/version` | Joriy kontent versiyasi |
| `POST /api/attempts` | Ilova natijani yuboradi (`x-ingest-token`) |

## Talab qilinadigan bepul xizmatlar

1. **Neon** (https://neon.tech) — Postgres bazasi → `DATABASE_URL`
2. **Vercel** (https://vercel.com) — hosting
3. **Vercel Blob** — rasm saqlash → `BLOB_READ_WRITE_TOKEN` (ixtiyoriy, media uchun)

## Lokal ishga tushirish

```bash
cd web
npm install
cp .env.example .env        # va qiymatlarni to'ldiring (DATABASE_URL, AUTH_SECRET, ...)

npm run db:push             # jadvallarni Neon'da yaratadi
npm run seed                # ../app .../modules.json ni bazaga import qiladi
npm run create-admin        # .env dagi ADMIN_* dan admin yaratadi

npm run dev                 # http://localhost:3000
```

## Vercel'ga deploy

1. Reponi GitHub'ga push qiling.
2. Vercel → New Project → repo → **Root Directory: `web`**.
3. Environment Variables (`.env.example` dagilarni) qo'shing:
   `DATABASE_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `ATTEMPTS_INGEST_TOKEN`,
   (`ADMIN_*` faqat skriptlar uchun, lokalда).
4. Deploy. Birinchi marta bazani tayyorlash uchun lokaldan
   `npm run db:push && npm run seed && npm run create-admin` ni ishga tushiring
   (yoki xohlasangiz Vercel'ning production `DATABASE_URL`iga qarab).

## Android ilovaga ulash

`app/build.gradle.kts` → `defaultConfig`:

```kotlin
buildConfigField("String", "API_BASE_URL", "\"https://SIZNING-APP.vercel.app\"")
buildConfigField("String", "ATTEMPTS_TOKEN", "\"<ATTEMPTS_INGEST_TOKEN bilan bir xil>\"")
```

Bo'sh qoldirilsa ilova faqat ichki (bundled) kontentdan ishlaydi — online sync o'chiq.

## Muhim izohlar

- **Kontent oqimi:** admin o'zgartiradi → bazaga darhol saqlanadi → **Publish** bosilganda
  `content_version` oshadi → ilova keyingi ochilishda yangi JSON'ni yuklaydi.
- **Xavfsizlik:** `/admin*` va `/api/admin*` — faqat `admin` roli; `/teacher*` — admin yoki teacher.
  Middleware JWT sessiya cookie'sini tekshiradi.
- **Web o'quvchi ilovasi** (ixtiyoriy, keyingi bosqich): brauzerda Vosk ishlamaydi —
  Web Speech API kerak bo'ladi (online, Chrome).
