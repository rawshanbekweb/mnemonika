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
// `null` = FOTOSURAT QO'YILMAYDI, emoji qoladi. Bu ataylab:
//   - his-tuyg'ular (😀 😟 🤩 …) — notanish odam yuzining surati emojidan
//     yomonroq ifodalaydi va bolalar ilovasida keraksiz xavf;
//   - mavhum belgilar (💡 🧠 🔒 ⚠️ 🌐 …) — ularning "fotosurati" yo'q.
// Qolganlari (hayvon, joy, taom, ob'ekt, kasb) uchun haqiqiy rasm yaxshiroq.

export type VisualTerm = string | null;

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
  "📚": "stack of books",
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

/** Tasvir uchun qidiruv so'zi; jadvalda yo'q bo'lsa `undefined`. */
export function termFor(token: string): VisualTerm | undefined {
  return VISUAL_TERMS[token];
}
