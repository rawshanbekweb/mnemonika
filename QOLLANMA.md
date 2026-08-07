# SpeakUp — To'liq foydalanuvchi qo'llanmasi

**Ingliz tilida gapirish (speaking) ko'nikmasini rivojlantiruvchi platforma · 5–6 sinf**

Sayt: <https://mnemonika.vercel.app> · Android ilovasi: saytdan yuklab olinadi
Qo'llanma versiyasi: ilova **0.2.0** (versionCode 11), kontent versiyasi **11**

---

## Bu qo'llanma kimga

| Siz kimsiz | Qayerdan boshlang |
|---|---|
| **O'quvchi** — mashq qilmoqchiman | [1-qism: O'quvchi uchun (Android)](#1-qism--oquvchi-uchun-android-ilovasi) |
| **O'quvchi** — telefonim yo'q, kompyuterda | [2-qism: O'quvchi uchun (brauzer)](#2-qism--oquvchi-uchun-brauzer-versiyasi) |
| **Ota-ona** — bolam nima qilyapti | [3-qism: Ball qanday hisoblanadi](#3-qism--ball-qanday-hisoblanadi) va [8-qism: Maxfiylik](#8-qism--maxfiylik-va-xavfsizlik) |
| **O'qituvchi** — sinfni kuzatmoqchiman | [4-qism: O'qituvchi paneli](#4-qism--oqituvchi-paneli) |
| **Admin** — kontentni boshqaraman | [5-qism: Admin paneli](#5-qism--admin-paneli) |
| **Muammo chiqdi** | [6-qism: Muammolarni bartaraf etish](#6-qism--muammolarni-bartaraf-etish) |

---

## Mundarija

- [SpeakUp nima va u qanday ishlaydi](#speakup-nima-va-u-qanday-ishlaydi)
- [Tez boshlash](#tez-boshlash)
- [1-qism — O'quvchi uchun (Android ilovasi)](#1-qism--oquvchi-uchun-android-ilovasi)
- [2-qism — O'quvchi uchun (brauzer versiyasi)](#2-qism--oquvchi-uchun-brauzer-versiyasi)
- [3-qism — Ball qanday hisoblanadi](#3-qism--ball-qanday-hisoblanadi)
- [4-qism — O'qituvchi paneli](#4-qism--oqituvchi-paneli)
- [5-qism — Admin paneli](#5-qism--admin-paneli)
- [6-qism — Muammolarni bartaraf etish](#6-qism--muammolarni-bartaraf-etish)
- [7-qism — Tez-tez beriladigan savollar](#7-qism--tez-tez-beriladigan-savollar)
- [8-qism — Maxfiylik va xavfsizlik](#8-qism--maxfiylik-va-xavfsizlik)
- [9-qism — Ma'lum cheklovlar](#9-qism--malum-cheklovlar)
- [Ilovalar](#ilovalar)

---

# SpeakUp nima va u qanday ishlaydi

SpeakUp — o'quvchi **ovoz chiqarib gapiradigan**, ilova esa uni **tinglab, matnga aylantirib, ball va maslahat beradigan** platforma. Yozma test emas: bola mikrofonga gapiradi.

Uch narsa ustiga qurilgan:

**1. Mnemonik strukturalar.** Har mashqda javobni qanday qurish kerakligini ko'rsatuvchi akronim bor — masalan **PETS**, **GREEN**, **OCEAN**, **ACTORS**, **QUEST**, **WORLD**. Har harf bitta qadamni bildiradi (fikringni ayt → sababini ayt → misol keltir → xulosa qil). Bola bo'sh sahifaga qarab qolmaydi, aytadigan gapi tayyor skeletga tushadi.

**2. Rasmlar va tasvirlar.** Har mashq yonida mavzuga oid rasm yoki emoji turadi — bola aynan o'sha tasvir haqida gapiradi.

**3. Darhol qaytariladigan javob.** Gapirib bo'lgan zahoti ball, ko'rsatkichlar (so'z soni, tezlik, kalit so'zlar) va 1 ta maqtov + eng ko'pi 3 ta aniq tavsiya chiqadi.

### Nutq qayerda tanilaydi

| | Android ilovasi | Brauzer versiyasi |
|---|---|---|
| Nutqni tanish | **Telefonning o'zida** (Vosk) | Brauzer xizmati (Web Speech API) |
| Internet | **Kerak emas** (model bir marta yuklangach) | **Kerak** |
| Ovoz tashqariga chiqadimi | **Yo'q** | Ha — brauzer ishlab chiqaruvchisiga (Google) boradi |
| Ovoz fayl sifatida saqlanadimi | **Yo'q, hech qayerda** | **Yo'q, hech qayerda** |

> **Asosiy tavsiya:** iloji bo'lsa **Android ilovasidan** foydalaning. U internetsiz ishlaydi (darsda Wi-Fi bo'lmasa ham), ovoz telefondan chiqmaydi va faqat unda suhbat mashqlari (Rolli o'yin, Intervyu, Erkin suhbat) bor.

---

# Tez boshlash

### O'quvchi — 5 daqiqada

1. Telefonda <https://mnemonika.vercel.app> ni oching.
2. **«Yuklab olish»** tugmasini bosing (APK ~28 MB).
3. Android «noma'lum manba» haqida so'raydi — ruxsat bering.
4. Ilovani oching, **ismingizni** va **sinfingizni** kiriting.
5. Istalgan modulni ochib, mashqni tanlang.
6. Birinchi mashqda **«Modelni tayyorlash»** tugmasi chiqadi — **Wi-Fi'da**, bir marta ~125 MB yuklanadi.
7. Yuklanib bo'lgach mikrofonni bosib gapiring.

### O'qituvchi — 2 daqiqada

1. <https://mnemonika.vercel.app/login> ga kiring (email + parol adminda).
2. Chap paneldan **«Progress»** ni tanlang.
3. Sinf va davrni filtrlab ko'ring, kerak bo'lsa **«CSV yuklab olish»**.

### Admin — 2 daqiqada

1. <https://mnemonika.vercel.app/login> → **«Kontent»**.
2. Modul/mashq/dialogni tahrirlang.
3. **Har o'zgarishdan keyin «Nashr qilish» tugmasini bosing** — busiz o'quvchilar eski kontentni ko'raveradi.

---

# 1-qism — O'quvchi uchun (Android ilovasi)

## 1.1. Ilovani o'rnatish

**Talab:** Android 7.0 (API 24) yoki undan yangi. Ilova hajmi ~28 MB, ustiga til modeli uchun **~300 MB bo'sh joy** kerak (yuklab olish paytida zip va ochilgan model bir vaqtda turadi).

**Qadamlar:**

1. Telefon brauzerida <https://mnemonika.vercel.app> ni oching.
2. Sahifada **«Android ilovasi»** kartasini toping → **«Yuklab olish · 28 MB»**.
3. Brauzer «bu fayl zarar yetkazishi mumkin» deb ogohlantiradi — bu har qanday APK uchun standart xabar, **«Baribir yuklash»** ni bosing.
4. Yuklab olingan faylni oching.
5. Android **«Noma'lum manbalardan o'rnatish»** ruxsatini so'raydi → sozlamalarga o'tib brauzeringizga ruxsat bering → orqaga qaytib o'rnatishni davom ettiring.

> ### ⚠️ Muhim: ilova avval o'rnatilgan bo'lsa
>
> **0.1.3 va undan eski** versiyalar boshqa imzo kaliti bilan chiqarilgan. Android bunday holatda yangi versiyani eskisining ustiga o'rnatmaydi — «ilova o'rnatilmadi» deb yozadi va sababini tushuntirmaydi.
>
> **Yechim:** eski ilovani **o'chirib** tashlang, keyin yangisini o'rnating.
>
> **O'chirganda nima yo'qoladi:** ismingiz, darajangiz, XP, kunlik seriya, nishonlar va yuklab olingan til modeli (yana ~125 MB yuklab olish kerak bo'ladi).
> **Nima saqlanib qoladi:** ilgari bajargan mashqlaringiz o'qituvchi panelida qoladi — o'qituvchingiz natijalaringizni ko'rishda davom etadi.

## 1.2. Birinchi ochilish — tanishuv

Ilovani birinchi marta ochganingizda **Bulbul** sizni kutib oladi:

> «Salom! Men Bulbulman. Birga ingliz tilida gapirishni mashq qilamiz. Avval ismingni ayt!»

**Ism-familiya** — majburiy (kamida 2 harf). Natijalaringiz shu ism bilan o'qituvchingizga ko'rinadi, shuning uchun **haqiqiy ismingizni** yozing.

**Sinf** — ixtiyoriy, lekin yozganingiz ma'qul: o'qituvchi sinflar bo'yicha ajratib ko'radi. Tayyor tugmalar bor: `5-A`, `5-B`, `5-V`, `6-A`, `6-B`, `6-V` — yoki o'zingiz yozing.

**«Boshlash»** ni bosing. Bu ma'lumotlarni keyin ham o'zgartirsa bo'ladi (bosh ekranning o'ng yuqorisidagi doiracha).

## 1.3. Bosh ekran

Yuqorida **rangli sarlavha** paneli:

- **SPEAKUP** logotipi va «Ingliz tili nutqi · 5–6 sinf»
- O'ng yuqorida ismingizning bosh harfi turgan **doiracha** → bosilsa profil ekrani ochiladi
- **Bulbul** sizni ism bilan salomlaydi
- Uchta ko'rsatkich: 🔥 **seriya** (necha kun ketma-ket mashq qilgansiz) · ⭐ **daraja** · 🎖 **nishon** (nechtasini ochgansiz)
- **«Natijalarim»** tugmasi → to'liq progress ekrani

Pastda **«MODULLAR»** ro'yxati. Har modul kartasida:

- Modulning **do'sti** (personaj) va nomi
- «... bilan · N ta mashq»
- **Bajarilganlik chizig'i** va «3/15» kabi hisob — qayerda to'xtaganingizni darrov ko'rasiz
- Agar mashq qilgan bo'lsangiz: «Eng yaxshi 72 ball · 5 urinish»

## 1.4. Til modelini yuklab olish (bir marta)

Birinchi mashqni ochganingizda **«Til modeli»** kartasi chiqadi:

> «Nutqni tanish uchun til modeli kerak. Bir marta yuklab olinadi (~125MB), keyin butunlay internetsiz ishlaydi. Wi-Fi'da yuklab olish tavsiya etiladi.»

**«Modelni tayyorlash»** ni bosing.

**Yuklab olish haqida bilishingiz kerak bo'lgan narsalar:**

- **Wi-Fi'da qiling.** Mobil internetda 125 MB qimmatga tushadi va sekin.
- Progress **foiz va megabaytda** ko'rsatiladi («42% · 42 MB / 130 MB»). Sekin internetda foiz uzoq vaqt o'zgarmasligi mumkin — **megabayt hisobiga qarang**: u o'sib borsa hammasi joyida.
- **Boshqa ekranga o'tsangiz yuklanish to'xtamaydi** — davom etaveradi.
- **Internet uzilib qolsa yuklanish o'sha joyidan davom etadi** — noldan boshlanmaydi. Ilovani qayta oching va yana «Modelni tayyorlash» ni bosing.
- Yuklanib bo'lgach model telefonda qoladi. **Shundan keyin mashqlar uchun internet umuman kerak emas.**

## 1.5. Modullar

Platformada **6 modul** bor. Har birining o'z personaji, rangi va mashq turi bor.

| # | Modul | Nimani mashq qiladi | Nimadan iborat |
|---|---|---|---|
| 1 | 💬 **Munozara** | O'z fikringni asoslash va strukturalash | 15 mashq |
| 2 | 📖 **Hikoya aytish** | Rasm asosida ijodiy hikoya tuzish | 13 mashq |
| 3 | 🖼️ **Rasmli hikoya** | Rasmni ko'rib tasvirlash | 12 mashq |
| 4 | 🎭 **Rolli o'yin** | Vaziyatga mos muloqot qilish | 7 dialog |
| 5 | 🎙️ **Intervyu** | Aniq va mantiqiy savollar berish | 6 dialog |
| 6 | 🗣️ **Erkin suhbat** | Suhbatdosh bilan jonli gaplashish | 6 suhbat |

40 mashqning **19 tasi «Takrorlang»** turidagi talaffuz mashqi (1.7-bo'limga qarang).

> Rolli o'yin, Intervyu va Erkin suhbat **faqat Android ilovasida** bor. Brauzer versiyasida faqat mashqlar mavjud.

## 1.6. Oddiy mashqni bajarish — qadamma-qadam

### Qadam 1. Mashqni tanlash

Modulni oching. Har mashq kartasida:

- Rasm, sarlavha (masalan *«My Dream Pet»*) va mavzu
- Ilgari bajargan bo'lsangiz: «5 URINISH · ENG YAXSHI 72» va rangli **ball kvadrati** (yashil ≥80, ko'k ≥50, sariq — past)
- **«Struktura · PETS»** yorlig'i va harflar ro'yxati — javobingiz qanday qurilishi kerakligi
- **«Mashqni boshlash»** (yoki avval bajargan bo'lsangiz **«Qayta urinish»**)

### Qadam 2. Tayyorgarlik ekrani

Ekranda:

- **Rasmlar tasmasi** — mavzuga oid tasvirlar
- **Savollar** (1, 2, 3…) — nimalar haqida gapirishingiz kerakligi
- **«Eshitish»** tugmasi 🔊 — savollarni **ingliz tilida** eshitib olish. Talaffuzni eshitish uchun albatta bosing. Bosilganda tugma «To'xtatish» ga aylanadi.
- **«Struktura · PETS»** — har harf, uning inglizcha nomi va o'zbekcha tarjimasi

**Maslahat:** mikrofonni bosishdan oldin savollarni o'qib, strukturani bir ko'zdan kechiring va nima deyishingizni ichingizda bir marta o'ylab oling.

### Qadam 3. Mikrofonga ruxsat

Birinchi marta **«Mikrofonga ruxsat berish»** tugmasi chiqadi. Bosing va Android so'roviga **«Ruxsat berish»** deb javob bering.

> Ruxsat bermasangiz mashq ishlamaydi. Adashib «Rad etish» bosgan bo'lsangiz — [6-qismga](#6-qism--muammolarni-bartaraf-etish) qarang.

### Qadam 4. Gapirish

**«Mikrofonni bos va gapir»** — «Eng ko'pi 60 soniya» (mashqqa qarab 40–90 soniya).

Katta dumaloq **mikrofon tugmasini** bosing va gapiring. Yozuv paytida ekranda:

- **Personaj tinglaydi** — ovozingiz balandligiga qarab jonlanadi. Agar qimirlamasa, ilova sizni eshitmayapti.
- **Mikrofon atrofidagi halqa** — vaqt sanog'i
- 🔴 **«YOZILMOQDA · 38s QOLDI»**
- **Ovoz darajasi chizig'i**. Juda jim gapirsangiz **«Balandroq gapiring»** deb yozadi.
- ⏸ **Pauza tugmasi** — o'ylab olish, savolni qayta o'qish yoki yo'talib olish uchun. Aytilgan matn saqlanadi, taymer to'xtaydi. Davom etganingizda o'sha joyidan yoziladi.
- **«Strukturaga amal qiling · PETS»** — harflar ko'z oldingizda turadi
- **«Kalit so'zlar · 3/8»** — kutilayotgan so'zlar. Aytganingiz **yashil rangga bo'yalib ✓ belgisi qo'yiladi**. Bu jonli ishlaydi.
- **«Nutqingiz»** — aytganlaringiz matn ko'rinishida

**Tugatish:** mikrofon tugmasini yana bosing (u endi ⏹ to'xtatish belgisi) yoki vaqt tugashini kuting.

### Qadam 5. Tekshiruv

**«Eshitganlarimni tekshiryapman…»** — bir necha soniya davom etadi (sekin telefonda uzunroq). Bu normal, tugma qotib qolgani emas.

### Qadam 6. Natija

Yuqorida **ball halqasi** (0–100) va personajning gapi:

- **80+** → «Zo'r! Juda yaxshi gapirding!» + 🎉 konfetti
- **50–79** → «Yaxshi bo'ldi! Yana bir oz mashq qilamiz.»
- **50 dan past** → «Boshlanish yaxshi — qani, yana bir marta!»

Ostida **6 ko'rsatkich:**

| Ko'rsatkich | Ma'nosi |
|---|---|
| **So'zlar** | Jami nechta so'z aytdingiz |
| **Noyob so'z** | Nechta *har xil* so'z ishlatdingiz (so'z boyligi) |
| **So'z/daqiqa** | Gapirish tezligingiz (WPM) |
| **Davomiylik** | Necha soniya gapirdingiz |
| **Kalit so'zlar** | Kutilgan so'zlardan nechtasini aytdingiz |
| **Grammatika** | Grammatika balli (internet bo'lsa; bo'lmasa «—») |

Keyin:

- **«Kalit so'zlar»** kartasi — qaysilarini aytdingiz, qaysilarini yo'q
- **«Tavsiyalar»** — 1 ta maqtov + eng ko'pi 3 ta aniq maslahat. Rangli kvadratcha turini bildiradi: 🟩 yashil — maqtov, 🟨 oltin — **struktura** (eng muhim tuzatish), 🟦 ko'k — qolgani.
- **«Grammatika e'tibori»** — topilgan grammatik xatolar (bo'lsa)
- **«Nutqingiz (matn)»** — yig'iladigan bo'lim, ilova sizni qanday eshitganini ko'rish uchun
- **«Qayta urinish»** tugmasi

> **Nega faqat 3 ta tavsiya?** Chunki bir vaqtning o'zida 10 ta narsani tuzatib bo'lmaydi. Ilova eng muhim uchtasini tanlaydi. Keyingi safar shu uchtasiga e'tibor bering — ball o'zi ko'tariladi.

## 1.7. «Takrorlang» — talaffuz mashqi

19 ta mashq shu turda. Ular boshqacha ishlaydi: siz **o'z gapingizni emas, berilgan jumlani** o'qiysiz.

Ekranda:

- **«Shu jumlani o'qing»** va katta harflarda jumla
- 🔊 **«Eshitish»** — namunani eshiting (avval namuna, keyin o'qish!)
- Struktura va kalit so'zlar bu yerda **yo'q** — ular bu mashq turiga tegishli emas

Natijada **«So'zma-so'z · 11/13 to'g'ri»** kartasi chiqadi: kutilgan jumla so'zma-so'z bo'yalgan holda ko'rsatiladi.

- 🟢 **Yashil** — to'g'ri aytilgan
- 🔴 **Qizil, tagi chizilgan, qalin** — eshitilmadi yoki boshqacha aytildi

**Ball = to'g'ri aytilgan so'zlar foizi.** Grammatika bu mashqda tekshirilmaydi (matn siznikimas).

> **Bir tovushni takrorlash uchun mo'ljallangan.** Har jumlada bitta qiyin tovush 4+ marta uchraydi — masalan `th`, `w`, `r`. Shuning uchun bir mashqni bir necha marta takrorlash foydali.

## 1.8. Rolli o'yin va Intervyu (dialoglar)

Bu modullarda **navbatma-navbat suhbat** bo'ladi. Kartada personaj ismi, **«Struktura · ACTORS»** va **«7 ta almashish»** yozilgan.

**«Suhbatni boshlash»** ni bosing. Keyin sikl takrorlanadi:

1. **«Anna gapirmoqda»** — personaj ovoz bilan gapiradi, gapi chat pufagida chapdan chiqadi
2. Sizga **ishora** (nima deyishingiz kerakligi) ko'rsatiladi
3. Mikrofonni bosib javob bering — gapingiz o'ngdan rangli pufakda chiqadi
4. Pauza tugmasi bu yerda ham bor
5. **«Javobing tekshirilmoqda…»** → keyingi navbat

Oxirida **«SUHBAT TUGADI»**, ball halqasi va tavsiyalar chiqadi.

## 1.9. Erkin suhbat

Eng «jonli» modul: suhbat **oldindan yozilgan yo'l bo'yicha emas, sizning javoblaringizga qarab tarmoqlanadi**. Bir xil suhbatni ikki marta boshlasangiz boshqacha ketishi mumkin.

Kartada: personaj ismi, **«3 daqiqa»**, **«Jonli suhbat»** va suhbat maqsadi.

Farqlari:

- Necha almashish bo'lishi **oldindan noma'lum** — vaqtga qarab
- **«Bu savolni o'tkazib yuborish»** tugmasi bor — javob topolmasangiz suhbatda qamalib qolmaysiz
- Vaqt tugaganda suhbat keskin uzilmaydi — personaj xayrlashadi

**Natijada eng yuqorida «tushunilganlik»** turadi — «suhbatdoshim meni necha foiz tushundi». Bu suhbatdagi asosiy ko'nikma, ball emas.

## 1.10. «Natijalarim» ekrani

Bosh ekrandagi **«Natijalarim»** tugmasi orqali ochiladi.

**Daraja va XP.** Har mashq balli shuncha XP beradi (72 ball = 72 XP). Har **400 XP** — yangi daraja:

| Daraja | Nom | Kerak XP |
|---|---|---|
| 1 | Yangi boshlovchi | 0 |
| 2 | Mashqchi | 400 |
| 3 | Suhbatdosh | 800 |
| 4 | Notiq | 1200 |
| 5 | Usta notiq | 1600 |
| 6 | Chempion | 2000 |

**Kunlik seriya** 🔥 — necha kun **ketma-ket** mashq qilgansiz. Bir kun tashlab ketsangiz noldan boshlanadi. (Bugun hali mashq qilmagan bo'lsangiz, kechagi seriya hali ham ko'rinib turadi — bugun mashq qilsangiz davom etadi.)

**Umumiy o'rtacha**, urinishlar soni va jami aytilgan so'zlar.

**Nishonlar — 9 ta:**

| | Nishon | Qanday ochiladi |
|---|---|---|
| 🌟 | Birinchi qadam | Birinchi mashqni bajar |
| 🔥 | 5 ta mashq | 5 ta mashq bajar |
| 💪 | 20 ta mashq | 20 ta mashq bajar |
| 🏆 | Zo'r natija | 80+ ball to'pla |
| 👑 | Mukammal | 95+ ball to'pla |
| 📅 | 3 kun ketma-ket | 3 kun to'xtamay mashq qil |
| 🗓️ | Bir hafta | 7 kun to'xtamay mashq qil |
| 🧭 | Kashfiyotchi | Barcha modullarni sinab ko'r |
| 💬 | 500 so'z | Jami 500 ta so'z gapir |

Pastda **modullar bo'yicha jamlanma** va **so'nggi urinishlar** ro'yxati.

> **Natijalar telefoningizda hisoblanadi.** Ilovani o'chirsangiz daraja, seriya va nishonlar yo'qoladi (mashqlaringiz esa o'qituvchi panelida qoladi).

## 1.11. Profil va havolalar

Bosh ekranning o'ng yuqorisidagi doiracha → **Profil**. Bu yerda ismni va sinfni o'zgartirasiz, hamda ikkita havola bor:

- **Maxfiylik siyosati** — ma'lumotlaringiz bilan nima qilinishi
- **Rasmlar manbasi** — mashqlardagi fotosuratlarning mualliflari va litsenziyalari

---

# 2-qism — O'quvchi uchun (brauzer versiyasi)

Telefon yo'q yoki APK o'rnatolmadingizmi — <https://mnemonika.vercel.app/student> da mashq qilsangiz bo'ladi.

### ⚠️ Avval buni biling

| | |
|---|---|
| **Brauzer** | **Chrome**, **Edge** yoki **Safari**. **Firefox'da mikrofonli mashq umuman ishlamaydi** — sahifa buni ogohlantirib aytadi. |
| **Internet** | Har doim kerak (Android'dan farqli). |
| **Ovoz** | Web Speech API tovushni brauzer ishlab chiqaruvchisiga (Google) yuboradi. Bu bizning nazoratimizdan tashqarida. |
| **Qamrov** | **Faqat mashqlar.** Rolli o'yin, Intervyu, Erkin suhbat yo'q. |
| **Progress** | Brauzeringizda saqlanadi. Brauzer ma'lumotlarini tozalasangiz yo'qoladi. |
| **Alohida hisob** | Web profili Android profilidan **butunlay alohida**. Ularni bog'lash imkoni yo'q — Android'da to'plagan darajangiz web'da ko'rinmaydi va aksincha. |

### Ishlash tartibi

1. <https://mnemonika.vercel.app/student> ni oching.
2. Ism va sinfni kiriting.
3. **«MODULLAR»** akkordeonidan modulni ochib, mashqni tanlang.
4. Brauzer mikrofonga ruxsat so'raydi → **«Ruxsat berish»**.
5. Gapiring. Kalit so'zlar bu yerda ham jonli belgilanadi.
6. Natija ekrani Android'nikiga o'xshash: ball, ko'rsatkichlar, tavsiyalar, transkript.

O'ng ustunda (kompyuterda) darajangiz va **Android ilovasini yuklab olish** kartasi turadi.

**«Natijalarim»** → <https://mnemonika.vercel.app/student/progress>.

### Web va Android farqlari

| | Android | Web |
|---|---|---|
| Mashqlar | ✅ 40 ta | ✅ 40 ta |
| «Takrorlang» talaffuz mashqi | ✅ | ✅ |
| Rolli o'yin / Intervyu | ✅ | ❌ |
| Erkin suhbat | ✅ | ❌ |
| Internetsiz ishlaydi | ✅ | ❌ |
| Ovoz qurilmadan chiqmaydi | ✅ | ❌ |
| Pauza tugmasi | ✅ | ✅ |
| Personaj ovozga javob beradi | ✅ | ❌ (faqat nafas oladi) |
| Ball formulasi | bir xil | bir xil |

> Ball formulasi ikkala platformada **aynan bir xil** — shuning uchun web'da olingan 72 ball Android'dagi 72 ball bilan solishtiriladi.

---

# 3-qism — Ball qanday hisoblanadi

Bu bo'lim o'quvchi, ota-ona va o'qituvchi uchun — ball qayerdan kelayotgani ochiq yozilgan.

## 3.1. Oddiy mashq balli

To'rtta ko'rsatkich alohida 0–100 ga baholanadi, keyin **o'rtachasi** olinadi. Hammasining og'irligi teng.

**1. Ravonlik (tezlik, so'z/daqiqa)**

| WPM | Ball |
|---|---|
| 90+ | 100 |
| 60–89 | 80 |
| 40–59 | 60 |
| 20–39 | 40 |
| 20 dan past | 20 |

**2. So'z boyligi (nechta *har xil* so'z)**

| Noyob so'z | Ball |
|---|---|
| 40+ | 100 |
| 25–39 | 80 |
| 15–24 | 60 |
| 8–14 | 40 |
| 8 dan kam | 20 |

**3. Kalit so'zlar qamrovi** — aytilgan kalit so'zlar foizi. Mashqda kalit so'z bo'lmasa 100 beriladi.

**4. Javob uzunligi (jami so'z)**

| So'z soni | Ball |
|---|---|
| 60+ | 100 |
| 40–59 | 80 |
| 25–39 | 60 |
| 12–24 | 40 |
| 12 dan kam | 20 |

**Grammatika** alohida qo'shiladi (internet bo'lsa): yakuniy ball = (4 × asosiy ball + grammatika balli) ÷ 5. Ya'ni grammatika umumiy ballning **beshdan biri**.

- Grammatika **10 so'zdan qisqa javobda umuman tekshirilmaydi** — qisqa javobda grammatikani adolatli baholab bo'lmaydi.
- Har 100 so'zga to'g'ri keladigan har bir xato **3 ball** olib tashlaydi.
- Internet bo'lmasa grammatika ustunida «—» turadi va ball faqat 4 ko'rsatkichdan hisoblanadi.

## 3.2. «Takrorlang» mashqi balli

**Ball = to'g'ri o'qilgan so'zlar foizi.** Boshqa hech narsa hisobga olinmaydi. Grammatika tekshirilmaydi.

Ortiqcha aytilgan so'zlar alohida ko'rsatiladi («Ortiqcha so'z»), lekin ballni tushirmaydi.

## 3.3. Erkin suhbat balli

Bu yerda formula **ataylab boshqacha** — suhbatda muhim narsalar boshqa:

| Qism | Maksimal ball | Nima o'lchanadi |
|---|---|---|
| **Tushunilganlik** | 40 | Suhbatdosh javoblaringizni necha foiz tushundi |
| **Ishtirok** | 25 | Har navbatda yetarli gapirdingizmi |
| **Ravonlik** | 20 | 60–120 so'z/daqiqa — to'liq ball |
| **So'z boyligi** | 15 | Nechta har xil so'z ishlatdingiz |

## 3.4. Murabbiy maslahatlari qanday tanlanadi

Ilova sizning javobingizda **signal iboralar** borligini tekshiradi. Mnemonika qadamiga mos ibora topilmasa, o'sha qadam bo'yicha tavsiya beriladi:

| Qadam | Kutilayotgan iboralar | Tavsiya |
|---|---|---|
| Fikr | `I think`, `In my opinion` | «Javobingni "I think…" bilan boshla» |
| Misol | `for example`, `for instance`, `such as`, `one day` | «"For example…" deb bitta misol qo'sh» |
| Sabab | `because`, `since`, `that's why`, `so that` | «"because" so'zini ishlat» |
| Boshqalar fikri | `some people think`… | «"Some people think…" deb ayt» |
| Xulosa | `in conclusion`, `to sum up`, `finally`, `overall` | «Oxirida "Finally…" deb xulosa ayt» |
| Voqealar tartibi | `first`, `then`, `after that`, `next`, `suddenly` | «"First…", "Then…" bilan tartib bilan ayt» |
| His-tuyg'u | `happy`, `excited`, `scared`… | «O'zingni qanday his qilganingni ayt» |
| Joy | `in front of`, `behind`, `on the left` | «Joyni tasvirla» |
| Tasvirlash | `there is`, `there are`, `I can see`, `it looks` | «"I can see…" deb tasvirlab ber» |

> **Nega aynan iboralar?** Chunki imtihonda ham aynan shu bog'lovchi iboralar baholanadi. Misolni ibora ishlatmasdan aytgan bo'lsangiz ham, tavsiya foydali bo'lib qolaveradi.
>
> **Tekshirib bo'lmaydigan qadamlar** («ko'z bilan aloqa», «aniq gapir» kabi) haqida ilova **hech narsa demaydi** — noto'g'ri tanbeh bermaslik uchun.

## 3.5. Ballga ta'sir qilmaydigan narsalar

- **Maslahatlar ballni o'zgartirmaydi** — ular faqat ko'rsatiladi.
- **Pauza** ballni tushirmaydi. Pauzada taymer to'xtaydi, ya'ni tezlik ko'rsatkichiga ham zarar qilmaydi.
- **Qayta urinish soni** ballni tushirmaydi. Har urinish alohida saqlanadi, «eng yaxshi» esa eng yuqorisi.
- **Talaffuzning nozik jihatlari alohida baholanmaydi.** Ilova so'zni tanidimi yoki yo'qmi — shuni biladi. «Takrorlang» mashqi shu bo'shliqni to'ldirish uchun kiritilgan.

---

# 4-qism — O'qituvchi paneli

## 4.1. Kirish

1. <https://mnemonika.vercel.app/login>
2. Email va parol (admin beradi)
3. Kirgach avtomatik **«Progress»** sahifasiga tushasiz

Chap panelda (kompyuterda doim, telefonda hamburger menyu ostida): **Progress**, **Bosh sahifa**, **Chiqish**.

## 4.2. Asosiy sahifa — «O'quvchilar progressi»

**Filtrlar (yuqorida):**

- **Sinf** — «Barcha sinflar» yoki aniq sinf
- **Davr** — «Oxirgi 7 kun», «Oxirgi 30 kun», «Butun davr»
- **«CSV yuklab olish»** — joriy filtr bo'yicha jadval

**Umumiy ko'rsatkichlar:** Urinishlar · O'quvchilar · O'rtacha ball · O'rtacha WPM.

**«Modul bo'yicha o'rtacha ball»** diagrammasi — qaysi modul sinfga qiyin kelayotganini ko'rsatadi.

**«O'quvchilar»** jadvali: O'quvchi · Sinf · Urinish · O'rtacha · Eng yaxshi · So'zlar · Oxirgi faollik. **O'quvchi ismini bosing** — batafsil sahifasi ochiladi.

**«So'nggi urinishlar»**: Sana · O'quvchi · Mashq · Modul · Ball.

## 4.3. Bitta o'quvchi sahifasi

- Umumiy ko'rsatkichlari
- **«Mashqlar bo'yicha»** jadvali — **eng past natijadan boshlab tartiblangan**, ya'ni yuqorida turgani ustida ishlash kerak bo'lgan mashq
- Har urinishning **transkripti** — bola aynan nima deganini o'qiy olasiz
- **«CSV yuklab olish»** — shu o'quvchi bo'yicha

## 4.4. CSV va Excel

CSV nuqtali vergul bilan ajratilgan va o'zbek lokali uchun to'g'ri kodlangan — **Excel'da to'g'ridan-to'g'ri ochiladi**, o'/g' harflari buzilmaydi.

## 4.5. Ma'lumotni qanday o'qish kerak

**O'rtacha balldan ko'ra tendensiyaga qarang.** Bir urinishning balli ko'p narsani anglatmaydi (shovqin, telefon sifati, bola shoshib gapirgan bo'lishi mumkin). 5–10 urinishning yo'nalishi ma'noli.

**Past ball ≠ yomon ingliz tili.** Eng ko'p uchraydigan sabablar:

| Belgi | Ehtimoliy sabab | Nima qilish |
|---|---|---|
| So'z soni juda kam, transkript qisqa | Bola jim gapirgan yoki mikrofon uzoq | Balandroq va telefonga yaqinroq gapirishni aytish |
| WPM juda past | Uzoq o'ylab turgan | Avval bir marta ovozsiz mashq qilib olishni tavsiya qilish |
| Kalit so'zlar 0/8, transkript esa uzun | Bola boshqa narsa haqida gapirgan | Savollarni birga o'qib chiqish |
| Transkriptda g'alati so'zlar | Nutqni tanish xatosi (aksent, shovqin) | Tinch xonada takrorlash; «Takrorlang» mashqlarini berish |
| Grammatika «—» | Internet yo'q edi | Normal, muammo emas |

**Transkriptni o'qing.** Ballдан ko'ra ko'proq narsani aytadi: bola qaysi konstruksiyani ishlatgani, qayerda o'zbekcha o'ylab inglizcha gapirgani ko'rinib turadi.

## 4.6. Darsda qo'llash

**Uy vazifasi sifatida.** Aniq mashq va aniq maqsad bering: «*My Dream Pet* mashqini 3 marta bajaring, 60 ballga chiqing». Panelda kim bajarganini ko'rasiz.

**Darsda 10 daqiqalik mashq.** Butun sinf bir vaqtda bir mashqni bajaradi. Android ilovasi internetsiz ishlaydi — Wi-Fi bo'lmasa ham muammo yo'q. **Lekin til modeli oldindan yuklab olingan bo'lishi shart** (birinchi dars uchun uy vazifasi qilib bering).

**Talaffuz ustida ishlash.** «Takrorlang» mashqlari bitta qiyin tovushga qurilgan. Sinfga bir xil mashqni berib, so'zma-so'z natijani solishtiring — qaysi tovush qiynayotgani darrov ko'rinadi.

**Baholashda ehtiyot bo'ling.** Ball — mashq vositasi, imtihon emas. Nutqni tanish har doim ham adolatli emas (aksent, shovqin, telefon mikrofoni). Rasmiy baho uchun **transkriptni o'qing**, faqat raqamga tayanmang.

---

# 5-qism — Admin paneli

## 5.1. Kirish va tuzilma

<https://mnemonika.vercel.app/login> → **«Kontent»**. Chap panelda: **Kontent** · **Media** · **Progress** · **Bosh sahifa** · **Chiqish**.

## 5.2. Kontent boshqaruvi

**Modul** maydonlari: ID · **Tur (type)** (`discussion`, `storytelling`, `picture_narrating`, `roleplay`, `interview`) · Sarlavha (uz) · Sarlavha (en) · Emoji · Tartib · Tavsif (uz).

> **Tur (type) muhim:** ilovada modulning rangi, personaji va mashq ekranining turi shu maydondan aniqlanadi. Noma'lum tur yozilsa ilova buzilmaydi — Bulbul va standart rang ishlatiladi.

**Mashq** maydonlari: ID · Modul ID · Mavzu (topic) · Sarlavha · **Taymer (soniya)** · Tartib · **«Takrorlang» matni** · **Mnemonika** (akronim + qadamlar) · savollar · kalit so'zlar · vizuallar.

**Dialog** maydonlari: ID · Modul ID · Mavzu · Sarlavha · **Personaj ismi** · **Personaj emoji** · **Kirish gapi (intro)** · Vizuallar · Mnemonika · **Almashishlar (turns)**. Har almashishda: **Personaj gapi** · **O'quvchi uchun ishora** · **Kutilgan kalit so'zlar**.

## 5.3. ⚠️ «Nashr qilish» — eng muhim tugma

**Har o'zgarishdan keyin «Nashr qilish» ni bosing.**

Tahrirlash bazani yangilaydi, lekin **kontent versiyasini oshirmaydi**. Ilova esa versiyaga qarab yangilanishni tekshiradi — versiya oshmasa, o'quvchi telefonidagi eski nusxa qolaveradi va o'zgarishlaringizni **hech kim ko'rmaydi**.

## 5.4. Media kutubxonasi

**Media** bo'limida rasm/fayl yuklaysiz, olingan URL'ni mashqning vizuallar maydoniga qo'yasiz. URL qo'yilgan joyda emoji o'rniga rasm ko'rinadi. Rasm yuklanmasa ilova avtomatik emojiga qaytadi — bu **odatiy zaxira**, xato emas.

## 5.5. Kontent yozish qoidalari

Bular tajribadan chiqqan — buzilsa, xato **jimgina** yuzaga keladi (ilova yiqilmaydi, shunchaki noto'g'ri ishlaydi).

**Mnemonika qadamlarining inglizcha nomlari muhim.** Murabbiy qadamni nomidagi kalit so'z orqali taniydi (`example`, `reason`, `opinion`, `summary`, `events`, `emotion`, `location`, `describe`). Nom mos kelmasa o'sha qadam bo'yicha maslahat **umuman berilmaydi** va buni hech narsa ogohlantirmaydi.

**Kalit so'zlarni bola haqiqatda aytadigan qilib yozing.** Sun'iy qo'shma so'zlar (`busride`, `homeward`) hech qachon topilmaydi. Bo'shliqli iborani bitta so'zga qo'shib yozish ham (`soso`) shu xatoning bir ko'rinishi.

**Qisqa so'zlarga ehtiyot bo'ling.** Solishtirish avval oddiy qism satrni qidiradi: `read` so'zi `bread` va `already` ichida ham topiladi. Aniqroq shakl yozing (`reading`).

**«Takrorlang» matnlari uchun:** 10–16 so'z · raqam yo'q · apostrof va qisqartma yo'q (`don't`, `it's` — nutqni tanish modeli ularni ikki so'zga yoyadi) · bitta qiyin tovush jumlada 4+ marta takrorlansin.

**Taymer:** oddiy mashqlar uchun 60 s, hikoyalar uchun 90 s, «Takrorlang» uchun 40 s — mavjud kontentdagi amaliyot shunday.

## 5.6. Yangi kontent chiqarish tartibi

Kontent o'zgargandan keyin **tartib muhim**:

```
1. Kontentni tahrirlash (panel yoki generator skriptlari)
2. «Nashr qilish»      → versiya oshadi, onlayn o'quvchilar yangilanadi
3. export:content      → APK ichidagi zaxira nusxa yangilanadi
4. APK'ni qayta yig'ish → internetsiz o'rnatganlar uchun
5. upload:apk          → yangi APK saytga chiqadi
```

2-qadam qilinmasa — **hech kim** yangilanishni ko'rmaydi.
3–4-qadam qilinmasa — **internetsiz o'rnatgan** bola eski kontentni ko'radi.

> Texnik tafsilotlar (buyruqlar, kalitlar, build) `README.md` da.

---

# 6-qism — Muammolarni bartaraf etish

## Ilova o'rnatilmayapti

| Belgi | Sabab | Yechim |
|---|---|---|
| «Ilova o'rnatilmadi» | Eski versiya boshqa kalit bilan imzolangan | Eski ilovani **o'chiring**, keyin o'rnating |
| «Noma'lum manba» to'sib turibdi | Android himoyasi | Sozlamalar → brauzeringizga «noma'lum ilovalarni o'rnatish» ruxsatini bering |
| Yuklab olish boshlanmaydi | Brauzer APK'ni bloklagan | «Baribir yuklash» ni tanlang yoki boshqa brauzerda oching |
| Joy yetmadi | ~28 MB ilova + ~300 MB model uchun joy | Joy bo'shating |

## Til modeli yuklanmayapti

| Belgi | Sabab | Yechim |
|---|---|---|
| **Foiz o'zgarmayapti, lekin MB o'syapti** | Normal — sekin internet | Kuting, foiz keyin sakraydi |
| **MB ham 0 da turibdi** | Ulanish ishlamayapti | Wi-Fi'ni almashtiring; boshqa tarmoqda sinang |
| Yuklanish uzildi | Tarmoq uzilishi | Qayta boshlang — **o'sha joyidan davom etadi**, noldan emas |
| Ilovadan chiqib ketdim | Muammo emas | Yuklanish fonda davom etadi |
| Har safar noldan boshlanyapti | Xotira siqilgan bo'lishi mumkin | Telefonda joy bo'shatib qayta urinib ko'ring |

## Mikrofon va nutqni tanish

| Belgi | Sabab | Yechim |
|---|---|---|
| «Mikrofonga ruxsat berish» tugmasi bosilmayapti | Ruxsat butunlay rad etilgan | **Sozlamalar → Ilovalar → SpeakUp → Ruxsatlar → Mikrofon → Ruxsat berish.** Ilova ichidan hal qilib bo'lmaydi |
| Personaj qimirlamayapti | Ovoz eshitilmayapti | Balandroq gapiring; telefonni og'zingizga yaqinroq tuting; mikrofon teshigini barmoq bilan yopmang |
| «Balandroq gapiring» chiqyapti | Ovoz past | Yuqoridagidek |
| Transkriptda butunlay boshqa so'zlar | Shovqin yoki aksent | Tinch xonada sinang; sekinroq va aniqroq gapiring |
| Kalit so'zni aytdim, lekin belgilanmadi | So'z boshqacha tanilgan | Yakuniy natijada u topilishi mumkin (ilova bir necha variantni tekshiradi). Topilmasa — sekinroq talaffuz qiling |
| Bir so'z doim noto'g'ri tanilyapti | Qisqa so'zlar qiyin (`dog`/`dock`) | Shu tovushga oid «Takrorlang» mashqini bajaring |
| «Eshitganlarimni tekshiryapman…» uzoq turibdi | Sekin telefon | Kuting, tugmani qayta bosmang |
| To'xtatishni bosdim, hech narsa bo'lmadi | Oxirgi bo'lak tahlil qilinmoqda | Kuting — bu bir necha soniya |

## Brauzer versiyasi

| Belgi | Sabab | Yechim |
|---|---|---|
| «Bu brauzer mikrofonli mashqni qo'llab-quvvatlamaydi» | Firefox (yoki qo'llab-quvvatlanmaydigan brauzer) | **Chrome, Edge yoki Safari** ga o'ting |
| Mikrofon ishlamayapti | Sayt ruxsati yo'q | Manzil qatoridagi qulf belgisini bosib mikrofonga ruxsat bering |
| Yozuv o'z-o'zidan to'xtaydi | Brauzer jimlikda to'xtatadi | Normal — ilova avtomatik qayta ishga tushiradi |
| Progressim yo'qoldi | Brauzer ma'lumotlari tozalangan | Tiklab bo'lmaydi. Android ilovasidan foydalanish barqarorroq |
| Android'dagi darajam bu yerda yo'q | Hisoblar alohida | Bu ataylab shunday — bog'lash imkoni yo'q |

## Kontent va natijalar

| Belgi | Sabab | Yechim |
|---|---|---|
| Admin o'zgartirdi, ilovada ko'rinmayapti | **«Nashr qilish» bosilmagan** | Admin paneldan «Nashr qilish» ni bosing |
| Nashr qilindi, baribir eski | Ilova hali sinxronlanmagan | Ilovani yopib qayta oching (sinxronlash ochilishda bo'ladi) |
| Internetsiz eski kontent ko'rinyapti | APK ichidagi zaxira nusxa eski | Yangi APK chiqarilishi kerak (5.6-bo'lim) |
| Kunning birinchi ochilishida sinxronlash o'tmadi | Server «uyqudan» uzoq uyg'onadi | Bir-ikki daqiqadan keyin ilovani qayta oching |
| Grammatika ustunida «—» | Internet yo'q yoki javob 10 so'zdan qisqa | Normal, muammo emas |
| Mashqni bajardim, o'qituvchida ko'rinmayapti | Internet yo'q edi | Natija telefonda navbatga qo'yiladi va internet paydo bo'lganda avtomatik yuboriladi |
| CSV Excel'da bitta ustunga tushdi | Eski faylni ochyapsiz | Yangidan yuklab oling — hozirgi eksport to'g'ri formatda |

---

# 7-qism — Tez-tez beriladigan savollar

**Ilova pullikmi?**
Yo'q. Platforma butunlay bepul va pullik xizmatlarsiz qurilgan.

**Internet kerakmi?**
Android ilovasida — faqat **bir marta**, til modelini yuklab olish uchun. Undan keyin mashqlar internetsiz ishlaydi. Brauzer versiyasida — doim kerak.

**Nega model 125 MB?**
Chunki nutqni tanish telefonning o'zida ishlaydi. Kichikroq model so'zlarni yomonroq taniydi, kattaroq model esa telefonga sig'maydi. Bir marta yuklanadi va butunlay sizniki bo'lib qoladi.

**Ovozim saqlanadimi?**
**Yo'q — hech qayerda, hech qachon.** Nutq matnga aylantiriladi, ovoz esa darhol yo'qoladi. Android'da bu telefonning o'zida bo'ladi.

**O'qituvchim nimani ko'radi?**
Ismingiz, sinfingiz, mashq nomi, ball, ko'rsatkichlar va **nutqingizning matni**. Ovozingizni emas.

**Ballim past — ingliz tilim yomonmi?**
Shart emas. Eng ko'p uchraydigan sabab — **jim gapirish** yoki **qisqa javob**. Balandroq gapiring va uzunroq javob bering; ball darrov ko'tariladi.

**Mashqni necha marta takrorlasam bo'ladi?**
Cheklov yo'q. Har urinish alohida saqlanadi, «eng yaxshi» esa eng yuqorisi. Takrorlash ballni tushirmaydi.

**Aksentim bilan tanidimi?**
Ko'p hollarda ha. Ilova nutqni tanishning bir necha variantini tekshiradi. Qiyin joylarda «Takrorlang» mashqlari yordam beradi.

**Telefonim almashsa progressim ko'chadimi?**
Yo'q. Daraja, seriya va nishonlar telefonda saqlanadi. Mashq natijalari esa o'qituvchi panelida qoladi.

**Yozuv o'rtasida to'xtab olsam bo'ladimi?**
Ha — **pauza tugmasi** bor (Android'da ham, brauzerda ham). Aytilganlar saqlanadi, taymer to'xtaydi, ballga ta'sir qilmaydi.

**Nega har safar 3 tadan ortiq maslahat berilmaydi?**
Chunki bir vaqtda ko'proq narsani tuzatib bo'lmaydi. Ilova eng muhimini tanlaydi.

**Ilovada reklama yoki xarid bormi?**
Yo'q. Hech qanday reklama, hech qanday to'lov yo'q.

---

# 8-qism — Maxfiylik va xavfsizlik

To'liq matn: <https://mnemonika.vercel.app/maxfiylik>

**Ovoz saqlanmaydi.** Hech qanday audio fayl yozilmaydi va yuborilmaydi.

**Android'da nutqni tanish qurilmaning o'zida** — audio telefondan chiqmaydi.

**Brauzer versiyasida boshqacha:** Web Speech API tovushni brauzer ishlab chiqaruvchisiga (Google) yuboradi. Bu bizning nazoratimizdan tashqarida va shuning uchun ochiq aytilmoqda. **Maxfiylik muhim bo'lsa Android ilovasidan foydalaning.**

**Grammatika tekshiruvi.** Faqat nutqingizning **matni** LanguageTool xizmatiga yuboriladi — ism, sinf yoki boshqa identifikatorsiz.

**Nima saqlanadi:** ism, sinf, qurilma identifikatori, mashq natijalari va nutq transkripti. Bularni **o'qituvchi va admin** ko'radi.

**Zaxiraga tushmaydi.** Android ilovasida avtomatik zaxira **o'chirilgan** — transkriptlar Google Drive'ga nusxalanmaydi.

**Sun'iy intellekt.** AI faqat **kontent tayyorlash paytida** ishlatiladi (mashq matnlari, namuna audio, maslahatlar), mashq vaqtida emas. Bolaning nutqi hech qanday AI xizmatiga yuborilmaydi.

**Ma'lumotni o'chirish.** Ilovani o'chirsangiz telefondagi hamma narsa o'chadi. Serverdagi natijalarni o'chirish uchun o'qituvchi yoki adminga murojaat qiling.

---

# 9-qism — Ma'lum cheklovlar

Ochiq aytilishi kerak bo'lgan narsalar — sinfga tarqatishdan oldin bilib qo'ying.

**1. Real qurilmadagi sinov to'liq emas.** Ilovaning yangi qismlari (audio yozish quvuri, 125 MB modelni yuklab olish, pauza mexanizmi) kodda tekshirilgan, lekin **real telefonda keng sinovdan o'tkazilmagan**. Katta guruhga tarqatishdan oldin 2–3 ta telefonda sinab ko'ring.

**2. Namuna audio hamma joyda yo'q.** Talaffuz mashqlarining bir qismida odam ovoziga o'xshash namuna klipi bor, qolganida telefonning o'z ovoz sintezatori o'qiydi. Ikkinchisi biroz «robot»roq eshitiladi, lekin ishlaydi.

**3. Mashqqa xos maslahatlar hamma mashqda yo'q.** Bir qism mashqlarda murabbiy mavzuga xos maslahat beradi, qolganida umumiy matn. Ikkalasi ham to'g'ri, aniqligi farq qiladi.

**4. Har o'qituvchi barcha o'quvchilarni ko'radi.** Hozircha o'qituvchini aniq sinfga biriktirish imkoni yo'q — panelga kirgan har bir o'qituvchi barcha o'quvchilarning natijalarini va transkriptlarini ko'ra oladi. Hisob berishda buni hisobga oling.

**5. Kunning birinchi ochilishi sekin.** Server uzoq vaqt ishlatilmasa «uyqudan» uyg'onadi va birinchi sinxronlash o'tmasligi mumkin. Ilova bunday holatda mavjud kontentdan ishlashda davom etadi — hech narsa buzilmaydi.

**6. Talaffuz nozik darajada baholanmaydi.** Ilova so'zni tanidimi yoki yo'qmi — shuni biladi; fonemalarni alohida tekshirmaydi. «Takrorlang» mashqlari shu bo'shliqni qisman to'ldiradi.

**7. Firefox'da mikrofonli mashq umuman ishlamaydi.**

---

# Ilovalar

## A. Modullar va mashqlar ro'yxati

| Modul | Turi | Miqdori | Mnemonikalarga misol |
|---|---|---|---|
| 💬 Munozara | Mashq | 15 | PETS, GREEN |
| 📖 Hikoya aytish | Mashq | 13 | OCEAN, FEELS, STORY |
| 🖼️ Rasmli hikoya | Mashq | 12 | WORLD, ALBUM, PHOTO |
| 🎭 Rolli o'yin | Dialog | 7 | ACTORS |
| 🎙️ Intervyu | Dialog | 6 | QUEST |
| 🗣️ Erkin suhbat | Jonli suhbat | 6 | — |

Jami: **40 mashq** (shundan **19 tasi** «Takrorlang» talaffuz mashqi), **13 dialog**, **6 erkin suhbat**.

## B. Atamalar lug'ati

| Atama | Ma'nosi |
|---|---|
| **Mnemonika** | Javobni qurish uchun akronim (PETS, GREEN…). Har harf — bitta qadam |
| **Kalit so'zlar** | Mashqda aytilishi kutilayotgan so'zlar. Aytilganlari yashil belgilanadi |
| **Transkript** | Nutqingizning matnga aylantirilgan ko'rinishi |
| **WPM** | So'z/daqiqa — gapirish tezligi |
| **Noyob so'z** | Nechta *har xil* so'z ishlatilgani (so'z boyligi ko'rsatkichi) |
| **XP** | Tajriba ballari. Har mashq balli shuncha XP beradi |
| **Kunlik seriya** | Ketma-ket necha kun mashq qilingani |
| **Til modeli** | Nutqni tanish uchun telefonga yuklanadigan ~125 MB fayl |
| **«Takrorlang»** | Berilgan jumlani aynan o'qish turidagi talaffuz mashqi |
| **Nashr qilish (publish)** | Admin o'zgarishlarini o'quvchilarga yetkazadigan amal |

## C. Foydali havolalar

| Sahifa | Manzil |
|---|---|
| Bosh sahifa | <https://mnemonika.vercel.app> |
| O'quvchi (brauzer) | <https://mnemonika.vercel.app/student> |
| O'quvchi natijalari | <https://mnemonika.vercel.app/student/progress> |
| Kirish (o'qituvchi/admin) | <https://mnemonika.vercel.app/login> |
| O'qituvchi paneli | <https://mnemonika.vercel.app/teacher> |
| Admin paneli | <https://mnemonika.vercel.app/admin> |
| Maxfiylik siyosati | <https://mnemonika.vercel.app/maxfiylik> |
| Rasmlar manbasi va litsenziyalari | <https://mnemonika.vercel.app/rasmlar> |

## D. Boshqa hujjatlar

| Fayl | Nima uchun |
|---|---|
| `README.md` | Texnik hujjat: arxitektura, API, build, generatorlar |
| `LOYIHA-REJA.md` | To'liq roadmap va bosqichlar |
| `web/public/hero/CREDITS.md` | Fon fotosuratlari mualliflari |
