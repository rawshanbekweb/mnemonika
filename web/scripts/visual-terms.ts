// Mashq tasvirlari uchun qidiruv so'zlari: emoji → Wikimedia Commons'da nima
// qidirilsin.
//
// NEGA JADVAL KODDA, MODELDAN SO'RALMAYDI: tasvir mashqning MAZMUNI — bola
// aynan shu narsa haqida gapiradi. Noto'g'ri rasm mashqni buzadi, buni esa na
// kompilyator, na test ushlaydi. Shuning uchun har bir tasvir uchun qidiruv
// so'zi qo'lda yozilgan va rasmlar tasdiqdan o'tkaziladi.
//
// SO'ZLARNI YOZISH QOIDASI (birinchi tekshiruvda 83 tadan ~30 tasi noto'g'ri
// chiqqanidan keyin yozildi): bitta umumiy so'z YETARLI EMAS, chunki Commons
// relevantligi nomdagi so'zga qarab ishlaydi va o'sha so'z boshqa ma'noda
// kelgan fayllar birinchi chiqadi. Haqiqiy misollar: "open book" → "Open Book"
// nomli QOYA (toqqa chiqish yo'nalishi), "puppy" → Jeff Koons HAYKALI,
// "traffic light" → fonida svetofor turgan elektromobil, "statue of liberty" →
// 11-sentabr yong'ini surati. Shuning uchun so'zga KONTEKST qo'shiladi:
// predmet + joy/holat ("open book pages", "city bus vehicle",
// "red fox portrait"). Qo'shimcha so'z natijani toraytiradi, kamaytirmaydi.
//
// `null` = FOTOSURAT QO'YILMAYDI, emoji qoladi. Ikki xil holatda:
//   - mavhum belgilar (⚠️ 🌐 ❤️ 👽 …) — ularning "fotosurati" yo'q;
//   - Commons'da mos surat TOPILMAGANI uchun (har biri 3–4 xil so'rovdan
//     keyin, izohi o'z joyida yozilgan).
//
// His-tuyg'ular (😀 😟 🤩 …) boshida shu ro'yxatda edi, lekin mijoz "odam
// haqidagi mnemonikada bitta ham odam ko'rmadim" dedi — endi ular
// VISUAL_BY_EXERCISE da mashq konteksti bilan qidiriladi.
//
// XAVFSIZLIK: Commons'da bolalar uchun mo'ljallanmagan surat ham bor va u
// betaraf ko'rinadigan so'rovga chiqishi mumkin — "woman and child smiling"
// so'rovi ochiq erotik suratni birinchi natija qildi (tekshiruvda ushlandi).
// `generate-images.ts` dagi REJECT_UNSAFE bunday fayllarning nomi bo'yicha
// kesadi, lekin YAKUNIY QAROR ODAMNIKI: `--sheet` majburiy qadam.

import { visualKey } from "../src/lib/visual-key";

export type VisualTerm = string | null;

/**
 * UMUMIY jadval: emoji → qidiruv so'zi. Bu yerdagi rasm HAMMA mashqda
 * ishlatiladi (🍎 qayerda uchrasa ham bir xil olma).
 *
 * Mashqqa xos rasm kerak bo'lsa `VISUAL_BY_EXERCISE` ga yozing — u shu
 * jadvaldan USTUN turadi.
 */
export const VISUAL_TERMS: Record<string, VisualTerm> = {
  // ── Hayvonlar ────────────────────────────────────────────────
  "🐶": "golden retriever puppy grass",
  "🐕": "dog running grass",
  "🐱": "kitten cat",
  "🐰": "rabbit",
  "🦜": "parrot bird",
  "🐹": "hamster",
  "🐢": "tortoise",
  "🦊": "red fox portrait",
  "🐠": "clownfish",
  "🐙": "octopus",
  "🦈": "shark",
  "🐬": "dolphin",
  "🐚": "seashell",

  // ── Tabiat va atrof-muhit ────────────────────────────────────
  "🌍": "earth globe",
  "♻️": "recycling bins",
  "🗑️": "litter garbage",
  "🌳": "single tree",
  "🌲": "pine trees forest green",
  "🏭": "factory smokestack",
  "💧": "water drop",
  "🌊": "ocean wave",
  "🌧️": "rain drops window",
  "☔": "umbrella rain",
  "🌈": "rainbow over landscape",
  "☁️": "cumulus clouds blue sky",
  "🍂": "fallen autumn leaves ground",
  "🍁": "red maple leaf",
  "🪐": "saturn planet space",

  // ── Maktab va o'qish ─────────────────────────────────────────
  "🏫": "school",
  // Ko'p mashqda 📚 aynan DARSLIK ma'nosida keladi, shuning uchun umumiysi
  // shu; kutubxona javoni va o'qiyotgan bola VISUAL_BY_EXERCISE da.
  //
  // SO'Z UZUNLIGI HAQIDA: Commons qidiruvi so'zlarni VA bilan bog'laydi, ya'ni
  // to'rt-besh so'zli so'rov ko'pincha BO'SH natija beradi ("school textbooks
  // stack desk" → hech narsa). Amalda 2–3 so'z eng yaxshi ishlaydi: kontekst
  // yetarli, lekin natija qurib qolmaydi.
  "📚": "textbooks on desk",
  "📖": "open book reading table",
  "📐": "geometry ruler",
  "🔬": "microscope",
  "✏️": "wooden pencils sharpened",
  "📝": "notebook writing",
  "👩‍🏫": "teacher classroom",
  "🧑‍🎓": "graduation ceremony student gown",

  // ── Taom ─────────────────────────────────────────────────────
  "🍎": "red apple",
  "🥗": "green salad",
  "🍔": "burger fries",
  "🥦": "broccoli",
  "🍌": "bananas",
  "🍉": "watermelon",
  "🍳": "fried egg breakfast plate",
  "🎂": "birthday cake",

  // ── Mashg'ulot va sport ──────────────────────────────────────
  // Ranglar palitrasi: 4 xil so'rovda ham natija muzey eksponati yoki
  // XVIII asr portreti bo'lib chiqdi — emoji aniqroq.
  "🎨": null,
  "⚽": "soccer ball close up",
  "🚴": "cyclist riding bicycle road",
  "🎸": "classical guitar",
  "🏃": "runner running",
  "🏆": "trophy award",
  "🎲": "dice cubes",

  // ── Texnika va ob'ektlar ─────────────────────────────────────
  "📱": "smartphone screen in hand",
  "💻": "laptop computer",
  "⏱️": "stopwatch",
  // Kalit: "keys" so'zi Commons'da ko'proq INFORMATIKA ("hash table keys") va
  // muzey eksponatlarini beradi — oddiy uy kaliti surati chiqmadi.
  "🔑": null,
  "🔍": "magnifier lens",
  "🎟️": "concert ticket",
  "🧳": "travel suitcase luggage",
  "🛍️": "woman carrying shopping bags",
  "🛒": "shopping cart supermarket aisle",
  "🧥": "winter jacket",

  // ── Joylar va sayohat ────────────────────────────────────────
  "🏠": "family house",
  "🏡": "cottage garden house",
  "🏖️": "sandy beach sea sunny",
  "🏙️": "city skyline",
  "🏬": "shopping mall interior",
  "🚂": "steam locomotive railway",
  "🚌": "city bus vehicle",
  "🚕": "taxi city",
  "🚦": "traffic signal lights",
  "🚶‍♂️": "man walking city street",
  "🚀": "rocket liftoff launch pad",
  "👨‍🚀": "astronaut spacesuit",

  // ── Diqqatga sazovor joylar ──────────────────────────────────
  "🗼": "eiffel tower",
  "🗿": "moai easter island",
  "🏯": "castle japan",
  "🕌": "mosque exterior minaret",
  "🎡": "ferris wheel",
  "🗽": "Statue of Liberty statue",

  // ── Odamlar ──────────────────────────────────────────────────
  // Oila: Commons'dagi "oila" suratlari deyarli doim TANIB OLINADIGAN aniq
  // odamlar (masalan mashhur siyosatchi oilasi) — bolaning mashqida bu g'alati
  // va keraksiz. Emoji bu yerda aniqroq va xavfsizroq.
  "👨‍👩‍👧‍👦": null,
  "👵": "grandmother elderly woman",
  // Dehqon: 3 xil so'rovda ham odam ko'rinmadi (bo'sh dala, chizma, velosiped).
  "👨‍🌾": null,

  // ── Emoji qoladi (yuqoridagi izohga qarang) ──────────────────
  "😀": null,
  "😲": null,
  "😟": null,
  "🤩": null,
  "😌": null,
  "😮": null,
  "😊": null,
  "💪": null,
  "❤️": null,
  "💡": null,
  "🧠": null,
  "🤝": null,
  "⚠️": null,
  "🔒": null,
  "🌐": null,
  "🌟": null,
  "👽": null,
  "🔊": null,
  "🗣️": null,
};

/**
 * MASHQQA XOS qidiruv so'zlari: mashq ID → emoji → so'z.
 *
 * NEGA KERAK (mijoz e'tirozi, 2026-08-02): umumiy jadvalda kalit faqat
 * EMOJI edi, ya'ni 📚 hamma joyda bitta xil rasm — "Maktab hayoti" da ham,
 * "Kitob va o'qish" da ham, "Bo'sh vaqt" da ham. Natijada rasm mashqning
 * MAVZUSIDAN uzoqlashib qolardi. Bu yerda 📚 har bir mashqda o'z rasmini
 * oladi: darslik, kutubxona javoni, kitob o'qiyotgan bola.
 *
 * IKKINCHI E'TIROZ — ODAM KO'RINMAYDI: his-tuyg'ular (😀😟🤩), oila
 * (👨‍👩‍👧‍👦), dehqon (👨‍🌾) umumiy jadvalda `null` edi, ya'ni emoji bo'lib
 * qolardi. Odam haqidagi mashqda esa bola ODAMNI ko'rishi kerak.
 *
 * SO'Z YOZISH QOIDASI (4 bosqichli tekshiruvdan keyin): Commons aniq
 * HARAKAT yoki NARSA nomlangan so'rovda yaxshi ishlaydi ("children running
 * track", "market vendor selling vegetables"), MUNOSABAT yoki HIS-TUYG'U
 * nomlangan so'rovda esa deyarli doim yanglishadi ("family", "helping",
 * "handshake", "travelling" → chizma, harbiy portret, bo'sh perron). Ikki
 * qo'shimcha qoida: 2–3 so'z eng yaxshi (Commons so'zlarni VA bilan
 * bog'laydi, uzun so'rov bo'sh natija beradi), va odamni TAVSIFLAB
 * qidirmaslik kerak — aynan shunday so'rov ("woman and child smiling")
 * kattalar uchun mo'ljallangan suratni birinchi natija qildi.
 *
 * `null` — 3–4 urinishdan keyin ham mos surat topilmadi. Emoji qoladi:
 * noto'g'ri rasm mashqni buzadi, emoji esa buzmaydi.
 *
 * Bu yerda yo'q emoji umumiy jadvaldagi rasmni oladi — ro'yxat to'liq
 * bo'lishi shart emas, faqat FARQ qilishi kerak joylar yoziladi.
 */
export const VISUAL_BY_EXERCISE: Record<string, Record<string, VisualTerm>> = {
  // ── Munozara ─────────────────────────────────────────────────
  discussion_family_pets_dream: {
    // "Mening orzuimdagi uy hayvoni" — bola hayvonni EGASI bilan ko'rsin.
    "🐶": "boy hugging dog",
    "🐱": "kitten held in hands",
    "🐹": "hamster in hands pet",
  },
  discussion_nature_environment: {
    // Tabiatni kim tozalaydi — odamlar; bo'sh chelak buni ko'rsatmaydi.
    "🗑️": "volunteers collecting litter cleanup",
  },
  discussion_read_aloud_pets: {
    "🗣️": "girl speaking into microphone",
  },
  discussion_school_life: {
    "🔬": "student using microscope classroom",
  },
  discussion_healthy_food: {
    "💪": "boy eating apple",
  },
  discussion_hobbies: {
    // Mashg'ulot — HARAKAT: bolaning o'zi qilayotgani ko'rinsin.
    "📚": "child reading book",
    "🎨": "child painting art class",
    "⚽": "kids playing football",
    "🚴": "boy riding bicycle",
    // 🎸 uchun mashqqa xos yozuv YO'Q: "boy/child/girl playing guitar"
    // uchalasi ham kattalar, chizma yoki devor rasmini berdi. Umumiy
    // jadvaldagi gitara surati aniqroq.
  },
  discussion_books: {
    "📚": "library bookshelves",
    "🧠": "boy reading book",
    "💡": "incandescent light bulb",
  },
  discussion_internet_safety: {
    "💻": "child using laptop computer",
    "🔒": "padlock closed door",
  },
  discussion_sports_health: {
    "🏃": "children running track",
    "💪": "young athletes training",
  },

  // ── Hikoya ───────────────────────────────────────────────────
  storytelling_feelings_day: {
    // BUTUN mashq his-tuyg'ular haqida edi va beshtasi ham emoji bo'lib
    // qolgandi — bola bitta ham odam yuzini ko'rmasdi.
    "😀": "children laughing happy",
    "😲": "surprised girl face",
    "😟": "sad boy face",
    "🤩": "excited children cheering",
    "😌": "girl smiling outdoors",
  },
  storytelling_journey_train: {
    // "child looking out train window", "boy train window", "girl looking
    // out window", "children on train", "family boarding train",
    // "passengers on train", "family travelling" → vitraj, klassik rasm,
    // bo'sh perron, vitrina. Poyezd va chipta rasmlari mashqda bor.
    "😮": null,
    "😊": null,
  },
  storytelling_lost_and_found: {
    // "keys" so'zi Commons'da informatika diagrammasini berardi — QO'L
    // qo'shilishi so'rovni uy kalitiga qaytaradi.
    "🔑": "house key in hand door",
    // Qo'l berish: "two people shaking hands", "handshake", "shaking hands",
    // "two men shaking hands" → tarixiy marosim, olomon, karikatura.
    "🤝": null,
    "😊": "smiling boy portrait",
  },
  storytelling_rainy_day: {
    "😊": "family playing board game home",
  },
  storytelling_helping_neighbour: {
    // "yordam" tushunchasi Commons'da eng qiyini bo'ldi: "young person
    // helping elderly woman" → tinchlikparvar askar, "caregiver elderly
    // woman" → boshqa mavzu, "volunteer helping" → telefonga qarab turgan
    // olomon, "helping hands" → jamg'arma jileti, "children helping" →
    // dala haydash. Buvi (👵) va xarid (🛍️) rasmlari mashqda bor, ya'ni
    // odam baribir ko'rinadi.
    "🤝": null,
    "😊": null,
  },
  storytelling_space_trip: {
    "🌟": "night sky stars",
  },

  // ── Rasmli hikoya ────────────────────────────────────────────
  picture_family_album: {
    // "family", "family walking park", "parents and children", "family group
    // photo" — to'rttasi ham oila ko'rinmaydigan kadr berdi. Ishlagani —
    // oilaning nima QILAYOTGANI nomlangani: dasturxon atrofidagi oila.
    // Eski surat, lekin mashq nomi ham "Oila albomi".
    "👨‍👩‍👧‍👦": "family dinner table",
  },
  picture_narrating_market: {
    // "farmer" so'zi bo'sh dala va chizma berardi; bozorda savdo qilayotgan
    // odam bu mashqning mavzusiga ham yaqinroq.
    "👨‍🌾": "market vendor selling vegetables stall",
  },
  picture_narrating_seasons: {
    // "child autumn leaves", "children in park autumn", "children playing
    // snow", "children in snow" → bo'sh maydonchа, ukiyo-e bosma, uzoqdagi
    // qorli o'rmon. Fasl rasmlari (🍂 🍁 ☁️) shu mashqda allaqachon bor,
    // shuning uchun bu o'rin emoji bo'lib qolgani zarar qilmaydi.
    "😊": null,
  },
  picture_narrating_classroom: {
    // Bitiruv marosimi 5-6 sinf sinfxonasiga to'g'ri kelmaydi.
    "🧑‍🎓": "students in classroom",
  },
};

/**
 * Tasvir uchun qidiruv so'zi. `exerciseId` berilsa avval MASHQQA XOS jadval
 * ko'riladi, keyin umumiy jadval. Ikkalasida ham yo'q bo'lsa `undefined` —
 * generator bunda to'xtaydi (yangi kontent jimgina rasmsiz qolmasin).
 */
export function termFor(token: string, exerciseId?: string): VisualTerm | undefined {
  if (exerciseId) {
    const own = VISUAL_BY_EXERCISE[exerciseId];
    if (own && token in own) return own[token];
  }
  return VISUAL_TERMS[token];
}

/**
 * `visual_images.token` ustuniga yoziladigan kalit.
 *
 * Mashqqa xos so'z bo'lsa — "exerciseId:emoji" (o'sha mashqdagina
 * ishlatiladi), aks holda emojining o'zi (hamma mashq baham ko'radi).
 * Ikki shakl bir jadvalda yashaydi: mashq uchun yozuv topilmasa umumiysiga
 * qaytiladi, ya'ni eski yozuvlar o'z kuchida qoladi.
 */
export function keyFor(token: string, exerciseId: string): string {
  const own = VISUAL_BY_EXERCISE[exerciseId];
  return own && token in own ? visualKey(exerciseId, token) : token;
}
