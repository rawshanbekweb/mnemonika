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
- **Kelajakda:** agar o'qituvchi paneli / bulutli progress kerak bo'lsa — Firebase bepul tier.

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
- [ ] App signing (keystore yaratish, bir marta)
- [ ] Mikrofon ruxsati + tushunarli izoh
- [ ] Vosk modeli: GIBRID — APK kichik (~10-15MB), model birinchi ochilishda online yuklab olinadi, keyin abadiy offline. Kontent (JSON) ham online yangilanadi + bundled zaxira.
- [ ] `minSdk` / `targetSdk` to'g'ri sozlash (eski telefonlar ham ishlashi uchun)
- [ ] Turli qurilmalarda test (ekran, Android versiyasi, mikrofon)
- [ ] ProGuard/R8 (hajmni kichraytirish)
- [ ] Maxfiylik: ovoz telefonda qoladi, hech qayerga yuborilmaydi (offline ustunligi — ota-onalar uchun muhim)
- [ ] Play uchun: ikonка, skrinshotlar, tavsif, maxfiylik siyosati

## 10. Xavflar

| Xavf | Yechim |
|------|--------|
| Bepul talaffuz baholash Azure'chalik aniq emas | MVP uchun yetarli; kelajakda yaxshilash |
| Vosk model hajmi (~50MB) | Birinchi ochilishda yuklab olish |
| Bolalar nutqini ASR yaxshi tanimasligi mumkin | Sekin gapirish, aniq mikrofon, qayta urinish |
| Scripted dialog cheklangan | Yetarlicha shoxlar yozish; keyin AI qo'shish |
