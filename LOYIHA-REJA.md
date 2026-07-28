# Speaking Skills App — To'liq Loyiha Rejasi

> **Loyiha:** Mnemonik mashqlar va rasmlar orqali Speaking ko'nikmalarini rivojlantirish (5–6 sinflar)
> **Platforma:** Android — Kotlin + Jetpack Compose
> **Byudjet:** $0 doimiy xarajat (offline-first, bepul texnologiyalar)

---

## 1. Loyihaning maqsadi

5–6 sinf o'quvchilari ingliz tilida gapirish ko'nikmasini mnemonik strukturalar (PETS, GREEN, OCEAN, ACTORS, QUEST, WORLD...) va rasmlar yordamida mustaqil mashq qiladigan Android ilova. Ilova o'quvchi nutqini yozib oladi, tahlil qiladi va natijani ko'rsatadi.

## 2. Nutq turlari (5 ta modul)

| # | Tur | Mavzular | Mnemonika |
|---|-----|----------|-----------|
| 1 | Munozara (Discussion) | Family & Pets, Natural World | PETS, GREEN |
| 2 | Rolli o'yin (Role Play) | Playground, Gadgets | ACTORS, STYLE |
| 3 | Hikoya aytish (Storytelling) | Under the Ocean, Feelings | OCEAN, FEELS |
| 4 | Intervyu (Interview) | Outdoor Sports, Helping at Home | QUEST, SHARE |
| 5 | Rasmli hikoya (Picture Narrating) | Around the World, Family Album | WORLD, ALBUM |

Qo'shimcha: Picture Dictionary, Complete the Story (interfaol mashqlar).

## 3. Texnologiya stack (hammasi bepul)

### Mijoz (Android)
- **Til/UI:** Kotlin + Jetpack Compose
- **Arxitektura:** MVVM + Clean Architecture (UI → ViewModel → UseCase → Repository)
- **Audio yozish:** `MediaRecorder` / `AudioRecord`
- **Lokal baza:** Room (SQLite) — progress, natijalar, kontent keshi
- **DI:** Hilt
- **Navigatsiya:** Navigation Compose
- **Async:** Coroutines + Flow

### Nutq tahlili (offline, bepul)
| Modul | Vosk | Izoh |
|-------|------|------|
| ASR (speech→text) | **Vosk Android** | ~50MB inglizcha model, offline, kvota yo'q |
| Talaffuz (taxminiy) | Vosk word confidence + target so'z mosligi | Fonema emas, so'z darajasi |
| Grammatika | **LanguageTool** (offline .jar yoki self-host) | Bepul, ochiq kodли |
| Ravonlik | O'zimiz: WPM, pauza soni, gapirish vaqti | Audio metadata'dan |

### AI suhbat (role play / interview) — MVP'da AI'siz
- **Scripted branching dialog:** oldindan yozilgan dialog daraxti (JSON). O'quvchi javobiga qarab keyingi replika tanlanadi.
- **Kelajakda (ixtiyoriy):** Gemini bepul tier yoki lokal kichik LLM.

### Kontent
- Mashqlar/mnemonikalar → **JSON** fayllarda (kod ichida emas). Yangi mavzu = yangi JSON, ilovani qayta chiqarmasdan.
- Rasmlar: Unsplash / Pixabay / openclipart (bepul litsenziya) yoki bir marta AI generatsiya.

### Backend
- **MVP:** YO'Q. Hammasi telefon ichida. Server = 0 xarajat.
- **Kelajakda → hozir rejalashtirilgan:** dinamik kontent + admin/o'qituvchi paneli uchun **Neon (Postgres) + Vercel (Next.js)** stack. Batafsil → **11-bo'lim**.

## 4. Kontent ma'lumotlar modeli

```json
{
  "id": "discussion_family_pets_dream",
  "type": "discussion",
  "topic": "Family and Pets",
  "title": "My Dream Pet",
  "mnemonic": {
    "acronym": "PETS",
    "steps": [
      { "letter": "P", "en": "Position", "uz": "Nuqtai nazaringizni bildiring" },
      { "letter": "E", "en": "Example", "uz": "Misollar keltiring" },
      { "letter": "T", "en": "Thoughts of others", "uz": "Boshqalar fikri" },
      { "letter": "S", "en": "Summary", "uz": "Xulosa" }
    ]
  },
  "images": ["cat.jpg", "dog.jpg", "parrot.jpg"],
  "prompts": [
    "Which pet would you like to have and why?",
    "How would you take care of your pet?"
  ],
  "keywords": ["care", "feed", "responsible", "companion"],
  "timeLimitSec": 60,
  "audioSample": "dream_pet_sample.mp3"
}
```

Barcha 5 tur shu bitta sxemaga tushadi (dialog turlari uchun `dialogTree` qo'shiladi).

## 5. Baholash mezonlari (bepul hisoblanadi)

| Mezon | Qanday o'lchanadi |
|-------|-------------------|
| So'z boyligi | Noyob so'zlar soni / jami so'z |
| Grammatik to'g'rilik | LanguageTool xatolari soni |
| Talaffuz (taxminiy) | Vosk word confidence o'rtacha bali |
| Ravonlik | So'z/daqiqa (WPM) |
| Davomiylik | To'xtamasdan gapirgan maks. vaqt |
| Struktura | Mnemonika bosqichlari qamrab olinganmi (kalit so'z tekshiruvi) |

Natija: 0–100 ball + qaysi qismni yaxshilash kerakligi (masalan "Summary qismini qo'shmadingiz").

## 6. Ekranlar (UI)

1. **Bosh ekran** — 5 modul kartochkalari, progress
2. **Mavzu tanlash** — modul ichidagi mashqlar ro'yxati
3. **Mnemonika tanishtiruvi** — akronim + bosqichlar animatsiya
4. **Mashq ekrani** — rasm(lar) + prompt + taymer + ovoz yozish tugmasi
5. **Natija ekrani** — ballar, xatolar, namuna audio bilan taqqoslash
6. **Progress ekrani** — grafik, tarix
7. **(Dialog turlari)** — personaj + suhbat oqimi

## 7. Bosqichma-bosqich reja (roadmap)

### Bosqich 0 — Poydevor ✅ (commit a4f4889)
- [x] Android loyiha (Compose, Navigation) skeleti  _(Hilt/Room keyingi bosqichda)_
- [x] Kontent JSON sxemasi + o'qish (loader)
- [x] Dizayn tizimi (ranglar, tipografiya, komponentlar)

### Bosqich 1 — MVP: 1 ta mashq to'liq (Discussion / My Dream Pet) ✅ (commit 69340af)
- [x] Mashq ekrani: prompt + taymer  _(rasm keyin qo'shiladi)_
- [x] Ovoz yozish (Vosk mikrofon orqali)
- [x] Vosk integratsiya → speech-to-text (online model yuklab olish + offline)
- [x] Ravonlik/davomiylik hisoblash (bepul, mahalliy)
- [x] Natija ekrani (birinchi versiya)
- [ ] ⚠️ Qurilmada runtime sinov (telefon/emulyatorда tekshirilmagan)

### Bosqich 2 — Baholashni to'ldirish
- [ ] LanguageTool grammatika tekshiruvi
- [ ] Mnemonika struktura tekshiruvi (kalit so'zlar)
- [ ] Talaffuz taxminiy bali (Vosk confidence)
- [ ] Progress saqlash (Room)

### Bosqich 3 — Qolgan modullar
- [ ] Storytelling, Picture Narrating (Discussion skeletiga o'xshash)
- [ ] Role Play, Interview (scripted dialog engine)
- [ ] Picture Dictionary, Complete the Story

### Bosqich 4 — Sayqal
- [ ] Animatsiyalar, ovoz effektlari
- [ ] Progress grafiklari
- [ ] Test va optimizatsiya

## 8. Ochiq savollar (keyinroq hal qilamiz)

1. "darsda 27%, semestrda 35%" kabi raqamlar qayerdan? Progress formulasi aniqlanishi kerak.
2. O'qituvchi natijalarni ko'radimi? (kelajakda Firebase)
3. Rasmlarni kim tayyorlaydi?
4. Audio namunalar (native talaffuz) kim yozadi / TTS ishlatamizmi?

## 9. Tarqatish (Distribution) — real foydalanuvchilar uchun

Loyiha odamlar test qilishi va foydalanishi uchun chiqarilishi kerak. Offline-first bo'lgani uchun **har bir foydalanuvchi uchun qo'shimcha xarajat yo'q**.

### Bosqichma-bosqich tarqatish
| Bosqich | Kanal | Narx | Maqsad |
|---------|-------|------|--------|
| 1. Ichki test | APK (Telegram/Drive) | $0 | O'zim + yaqin o'qituvchilar |
| 2. Beta test | Firebase App Distribution | $0 | 10–50 tester, avtomatik yangilanish |
| 3. Yopiq test | Google Play (closed) | $25 bir marta | Kengroq sinf/maktab |
| 4. Ommaviy | Google Play (production) | (o'sha $25) | Hamma |

> **Hozircha:** pul yo'qligi sabab **1–2 bosqich (APK + Firebase)** bilan boshlaymiz — butunlay bepul. Google Play $25 bir martalik to'lov, keyinroq.

### Release uchun texnik talablar
- [x] App signing (keystore yaratish, bir marta) — `keystore/speakup-release.jks` (git-ignored),
      parollar `local.properties` da, sxemalar **v2+v3**. Namuna: `local.properties.example`.
- [ ] Mikrofon ruxsati + tushunarli izoh
- [ ] Vosk modeli: GIBRID — APK kichik (~10-15MB), model birinchi ochilishda online yuklab olinadi, keyin abadiy offline. Kontent (JSON) ham online yangilanadi + bundled zaxira.
- [ ] `minSdk` / `targetSdk` to'g'ri sozlash (eski telefonlar ham ishlashi uchun)
- [ ] Turli qurilmalarda test (ekran, Android versiyasi, mikrofon)
- [x] ProGuard/R8 (hajmni kichraytirish) — 43.6MB → **27.8MB**; Vosk/JNA uchun keep
      qoidalari `app/proguard-rules.pro` da (refleksiya, busiz release'da crash).

#### Release APK chiqarish
```
.\gradlew.bat assembleRelease          # loyiha ildizida (JAVA_HOME o'rnatilgan bo'lsin)
cd web && npm run upload:apk           # release APK'ni Blob'ga yuklaydi
```
> **Kalitni zaxiralang.** `keystore/speakup-release.jks` + `local.properties` dagi parollar
> yo'qolsa, o'rnatilgan ilovaga boshqa hech qachon yangilanish chiqara olmaysiz —
> foydalanuvchilar eskisini o'chirib, qaytadan o'rnatishga majbur bo'ladi.
>
> **0.1.4 ga o'tishda ham shu holat:** undan oldingi APK'lar debug kaliti bilan
> imzolangan edi, shuning uchun ular ustiga o'rnatilmaydi — avval o'chirish kerak.
- [ ] Maxfiylik: ovoz telefonda qoladi, hech qayerga yuborilmaydi (offline ustunligi — ota-onalar uchun muhim)
- [ ] Play uchun: ikonка, skrinshotlar, tavsif, maxfiylik siyosati

## 10. Xavflar

| Xavf | Yechim |
|------|--------|
| Bepul talaffuz baholash Azure'chalik aniq emas | MVP uchun yetarli; kelajakda yaxshilash |
| Vosk model hajmi (~50MB) | Birinchi ochilishda yuklab olish |
| Bolalar nutqini ASR yaxshi tanimasligi mumkin | Sekin gapirish, aniq mikrofon, qayta urinish |
| Scripted dialog cheklangan | Yetarlicha shoxlar yozish; keyin AI qo'shish |

---

## 11. Web + Backend — Dinamik boshqaruv (App + Web)

> **Maqsad:** kontentni APK'ni qayta chiqarmasdan yangilash, admin/o'qituvchi paneli, o'quvchi progressini bulutda kuzatish, media (rasm) boshqaruvi. Ya'ni **to'liq boshqaruv**.

### 11.1 Stack (barchasi $0)

| Qatlam | Xizmat | Roli | Bepul tier |
|--------|--------|------|-----------|
| Ma'lumotlar bazasi | **Neon** | Postgres — kontent, progress, foydalanuvchilar | 0.5 GB, scale-to-zero, HTTP driver |
| Frontend + API | **Vercel (Next.js)** | Admin panel + web ilova + `/api/*` backend | Hobby tier, cold-start yo'q |
| Auth | **Auth.js (NextAuth)** yoki Clerk | Admin / o'qituvchi login | Bepul |
| Media | **Vercel Blob** yoki **Cloudflare R2** | Rasm/audio saqlash | Bepul, generous |

> **Render ISHLATILMAYDI.** Alohida backend kerak emas — Next.js API routes (Vercel) to'g'ridan-to'g'ri Neon'ga ulanadi. Bu Render free tier'ning cold-start (~50s uyqu) muammosini yo'q qiladi va arxitekturani soddalashtiradi.

### 11.2 Arxitektura

```
┌─────────────────────────────────────────────┐
│  Neon Postgres  (kontent, progress, userlar) │
└───────────────▲─────────────────────────────┘
                │ SQL (HTTP driver)
┌───────────────┴─────────────────────────────┐
│  Vercel — Next.js                            │
│   • /admin  → admin & o'qituvchi paneli      │
│   • /app    → web o'quvchi ilovasi (ixtiyoriy)│
│   • /api/*  → kontent + progress API         │
└───────────────▲─────────────────────────────┘
                │ HTTPS (JSON)
      ┌─────────┴──────────┐
      │  Android ilova     │  ← ContentRepository shu API'dan
      │  (Vosk offline ASR)│     yuklaydi, offline zaxira qoladi
      └────────────────────┘
```

### 11.3 Ma'lumotlar bazasi sxemasi (Neon / Postgres)

Hozirgi `modules.json` strukturasi shu jadvallarga ko'chiriladi:

| Jadval | Asosiy maydonlar | Izoh |
|--------|------------------|------|
| `modules` | id, type, title_uz, title_en, description_uz, emoji, sort_order, enabled | 5 nutq turi moduli |
| `exercises` | id, module_id (FK), topic, title, time_limit_sec, visuals[], keywords[] | Munozara/Hikoya/Rasmli hikoya mashqlari |
| `mnemonics` | id, owner_id, acronym, steps (jsonb) | PETS, GREEN, OCEAN... |
| `prompts` | id, exercise_id (FK), text, sort_order | Mashq savollari |
| `dialogs` | id, module_id (FK), topic, title, character_name, character_emoji, intro, mnemonic_id | Rolli o'yin / Intervyu |
| `dialog_turns` | id, dialog_id (FK), character_line, student_hint, expected_keywords[], sort_order | Bitta almashish |
| `media` | id, url, alt, exercise_id (FK) | Haqiqiy rasmlar (emoji o'rniga) |
| `content_version` | version (int), published_at | Ilova yangilikni shu orqali biladi |
| `users` | id, email, role (admin/teacher), password_hash | Panel foydalanuvchilari |
| `students` | id, device_id yoki login, name, class_group | O'quvchilar (anonim device_id ham mumkin) |
| `attempts` | id, student_id (FK), exercise_id, scores (jsonb), transcript, created_at | Har bir mashq natijasi (progress) |

### 11.4 API endpointlari (Vercel `/api`)

| Metod + yo'l | Vazifa | Kirish |
|--------------|--------|--------|
| `GET /api/content?since=<version>` | Yangi kontent JSON (agar versiya yangi bo'lsa) | Ochiq (ilova) |
| `GET /api/content/version` | Joriy `content_version` | Ochiq (yengil tekshiruv) |
| `POST /api/attempts` | O'quvchi natijasini yuklash | Device token |
| `GET /api/admin/...` (CRUD) | Modul/mashq/dialog/media boshqaruvi | Auth (admin) |
| `GET /api/teacher/progress` | Sinf/o'quvchi statistikasi | Auth (teacher) |

### 11.5 Admin & o'qituvchi paneli (Next.js ekranlari)

- **Login** (Auth.js)
- **Modullar** ro'yxati — yoqish/o'chirish, tartib
- **Mashq muharriri** — topic, title, mnemonika, promptlar, kalit so'zlar, taymer, rasm biriktirish
- **Dialog muharriri** — personaj, intro, turns (shoxlar)
- **Media kutubxonasi** — rasm yuklash (Blob/R2), mashqqa bog'lash
- **"Publish"** tugmasi → `content_version` ni oshiradi (ilova yangilashni shundan biladi)
- **O'qituvchi paneli** — sinf/o'quvchi bo'yicha progress, ballar, kuchsiz mezonlar

### 11.6 Android ilovaga ulash (mavjud kodga o'zgarish)

`ContentRepository` allaqachon shunga mo'ljallangan (kod izohi: *"avval online yangi versiyani tekshiradi, bo'lmasa bundled zaxiradan"*). Qo'shiladi:

- [ ] `GET /api/content/version` ni tekshirish; yangi bo'lsa `GET /api/content` → yuklab olish
- [ ] Yuklangan JSON'ni lokal keshga (fayl/Room) yozish; keyingi safar offline shu keshdan
- [ ] Internet yo'q bo'lsa bundled `assets/content/modules.json` zaxira sifatida (mavjud xatti-harakat saqlanadi)
- [ ] (Ixtiyoriy) `POST /api/attempts` — o'quvchi natijasini bulutga yuborish (o'qituvchi paneli uchun)

### 11.7 Web o'quvchi ilovasi — muhim shart 🟡

Web'da (brauzer) mashq qilish **mumkin**, lekin **Vosk offline ASR web'da ishlamaydi**. Brauzerda ovoz→matn = **Web Speech API**: bepul, ammo (1) faqat internetli, (2) asosan Chrome, (3) offline emas. Shuning uchun:

- Web'ni **avval admin/o'qituvchi uchun**, o'quvchi tajribasini **Android ilovada** qoldiramiz.
- Web o'quvchi ilovasi keyinroq "bonus kirish nuqtasi" sifatida qo'shiladi (baholash, mnemonika, grammatika web'da bemalol ishlaydi — faqat ASR farqi).

### 11.8 Bosqichma-bosqich reja

> **Holat (2026-07-24):** kod deploygacha to'liq yozildi. `web/` — `next build` ✓,
> Android tomoni `compileDebugKotlin` ✓. Qolgani: keys + Neon/Vercel deploy (user bajaradi).

**Bosqich 5 — Backend poydevori** ✅ (kod)
- [x] Sxema (`web/src/db/schema.ts`, 11.3 jadvallar) + Drizzle
- [x] `modules.json` → bazaga import (`npm run seed`)
- [x] Vercel Next.js loyihasi + Neon ulanish (`src/db/index.ts`)
- [x] `GET /api/content` va `/api/content/version`
- [ ] ⚙️ Deploy: Neon bazasi + `db:push` + `seed` (user, keys bilan)

**Bosqich 6 — Admin panel** ✅ (kod)
- [x] Login (jose JWT + bcryptjs, admin/teacher rol) + middleware himoya
- [x] Modul / mashq / dialog CRUD (`/admin`, `/admin/exercise`, `/admin/dialog`)
- [x] Media yuklash (Vercel Blob — `/admin/media`)
- [x] "Publish" → versiya oshirish (`/api/admin/publish`)

**Bosqich 7 — Ilovaga dinamik kontent** ✅ (kod)
- [x] `ContentRepository.sync()` online yuklash + kesh + offline zaxira
- [x] `build.gradle` `API_BASE_URL` (bo'sh = offline-only) + MainActivity ochilishda sync
- [ ] ⚠️ Real qurilmada sinash (Vosk + sync)

**Bosqich 8 — Progress + o'qituvchi paneli** ✅ (kod)
- [x] `POST /api/attempts` + `AttemptUploader` (device_id) ilovadan yuborish
- [x] O'qituvchi roli + progress dashboardi (`/teacher`: ball, WPM, modul, so'nggi urinishlar)
- [ ] Kelajak: sinf (class_group) bo'yicha filtrlash, o'quvchi profili

**Bosqich 9 (ixtiyoriy) — Web o'quvchi ilovasi**
- [ ] `/app` — Web Speech API bilan mashq oqimi

### 11.9 Xarajat

| Xizmat | Narx | Cheklov |
|--------|------|---------|
| Neon | $0 | 0.5 GB DB (bu loyiha uchun mo'l) |
| Vercel | $0 | Hobby tier (nekommertsiya) |
| Vercel Blob / Cloudflare R2 | $0 | Generous bepul tier |
| Auth.js | $0 | O'zimizniki |
| **Jami** | **$0/oy** | Google Play $25 bir martalik alohida |
