// Kontent rejasi: qanday mashq/dialoglar bo'lishi kerakligi — MATNsiz.
//
// Nima uchun alohida fayl: generator (`generate-content.ts`) faqat MATN yozadi,
// nima yaratilishini esa shu reja belgilaydi. Shu sababli:
//   - yangi mavzu qo'shish uchun model chaqirilmaydi, shu ro'yxatga qator
//     qo'shiladi (bepul, kvota sarflanmaydi);
//   - ID'lar mavzudan kelib chiqadi va BARQAROR — skript qayta ishga tushsa
//     bir xil mashq ikki marta yaratilmaydi;
//   - mnemonika modelga topshirilmaydi (pastdagi izohga qarang).
//
// MNEMONIKA NEGA BU YERDA QAT'IY YOZILGAN:
// `Coach` mnemonika bosqichini INGLIZCHA NOMI orqali taniydi (`moveOf`:
// "position"/"opinion" → OPINION, "example" → EXAMPLE, …). Model o'zi akronim
// o'ylab topsa, bosqich nomlari tanilmay qoladi va o'sha mashqda struktura
// bo'yicha maslahat umuman ishlamaydi — buni kompilyator ham, test ham
// ushlamaydi, faqat bola maslahat olmaganda bilinadi. Shuning uchun akronimlar
// bu yerda, `assertBankIsCheckable()` bilan tekshirilib turadi.
//
// Qoida: har bir bosqichning `en` matni O'SHA HARF bilan boshlanishi shart
// (akronim shuning uchun akronim) VA `Coach.moveOf` taniydigan so'zni o'z
// ichiga olishi kerak.

import type { MnemonicStep } from "../src/lib/content-types";
import { checkableMoves } from "../src/lib/coach";

export type Acronym = { acronym: string; steps: MnemonicStep[] };

/** Munozara mnemonikalari — fikr bildirish → misol → sabab → xulosa. */
export const DISCUSSION_ACRONYMS: Acronym[] = [
  {
    acronym: "IDEA",
    steps: [
      { letter: "I", en: "Idea and opinion", uz: "Fikringni ayt" },
      { letter: "D", en: "Detailed example", uz: "Aniq misol keltir" },
      { letter: "E", en: "Explain the reason", uz: "Sababini tushuntir" },
      { letter: "A", en: "And a summary", uz: "Qisqa xulosa qil" },
    ],
  },
  {
    acronym: "TOPIC",
    steps: [
      { letter: "T", en: "Take a position", uz: "Nuqtai nazaringni bildir" },
      { letter: "O", en: "Offer an example", uz: "Misol keltir" },
      { letter: "P", en: "Prove with a reason", uz: "Sabab bilan asosla" },
      { letter: "I", en: "Include thoughts of others", uz: "Boshqalarning fikri" },
      { letter: "C", en: "Conclusion", uz: "Xulosa" },
    ],
  },
  {
    acronym: "VIEWS",
    steps: [
      { letter: "V", en: "Voice your opinion", uz: "Fikringni ayt" },
      { letter: "I", en: "Illustrate with an example", uz: "Misol bilan ko'rsat" },
      { letter: "E", en: "Explain the reason", uz: "Sababini ayt" },
      { letter: "W", en: "Weigh the thoughts of others", uz: "Boshqalarning fikrini o'yla" },
      { letter: "S", en: "Sum up in a summary", uz: "Xulosa qil" },
    ],
  },
  {
    acronym: "FACTS",
    steps: [
      { letter: "F", en: "First, your opinion", uz: "Avval fikring" },
      { letter: "A", en: "Add an example", uz: "Misol qo'sh" },
      { letter: "C", en: "Cause and reason", uz: "Sabab" },
      { letter: "T", en: "Thoughts of others", uz: "Boshqalarning fikri" },
      { letter: "S", en: "Short summary", uz: "Qisqa xulosa" },
    ],
  },
];

/** Hikoya mnemonikalari — boshlanish → voqealar → his-tuyg'u → yakun. */
export const STORY_ACRONYMS: Acronym[] = [
  {
    acronym: "STORY",
    steps: [
      { letter: "S", en: "Start with an opening", uz: "Boshlanishini ayt" },
      { letter: "T", en: "Tell the events in order", uz: "Voqealarni tartib bilan" },
      { letter: "O", en: "Observe the appearance of heroes", uz: "Qahramonlarni tasvirla" },
      { letter: "R", en: "Real feelings", uz: "His-tuyg'ular" },
      { letter: "Y", en: "Your ending", uz: "Yakun" },
    ],
  },
  {
    acronym: "MAGIC",
    steps: [
      { letter: "M", en: "Mood at the start", uz: "Boshdagi kayfiyat" },
      { letter: "A", en: "Actions and events", uz: "Harakat va voqealar" },
      { letter: "G", en: "Give a description", uz: "Tasvirlab ber" },
      { letter: "I", en: "Interesting location", uz: "Qiziqarli joy" },
      { letter: "C", en: "Closing conclusion", uz: "Yakuniy xulosa" },
    ],
  },
  {
    acronym: "DREAM",
    steps: [
      { letter: "D", en: "Describe the place", uz: "Joyni tasvirla" },
      { letter: "R", en: "Real events", uz: "Voqealar" },
      { letter: "E", en: "Emotions of the hero", uz: "Qahramon his-tuyg'ulari" },
      { letter: "A", en: "At the end, a conclusion", uz: "Oxirida xulosa" },
      { letter: "M", en: "Moral of the story", uz: "Hikoya saboqi" },
    ],
  },
];

/** Rasmli hikoya mnemonikalari — ko'rgan → joy → kayfiyat → xulosa. */
export const PICTURE_ACRONYMS: Acronym[] = [
  {
    acronym: "PHOTO",
    steps: [
      { letter: "P", en: "People and their appearance", uz: "Odamlar ko'rinishi" },
      { letter: "H", en: "Here: the location", uz: "Qayerda bo'layapti" },
      { letter: "O", en: "Objects in the background", uz: "Fondagi narsalar" },
      { letter: "T", en: "Their mood", uz: "Kayfiyati" },
      { letter: "O", en: "Overall summary", uz: "Umumiy xulosa" },
    ],
  },
  {
    acronym: "FRAME",
    steps: [
      { letter: "F", en: "First, what you see", uz: "Avval ko'rganing" },
      { letter: "R", en: "Right and left location", uz: "O'ng va chap tomon" },
      { letter: "A", en: "Actions: describe them", uz: "Harakatlarni tasvirla" },
      { letter: "M", en: "Mood of the people", uz: "Odamlar kayfiyati" },
      { letter: "E", en: "End with a summary", uz: "Xulosa bilan yakunla" },
    ],
  },
  {
    acronym: "SCENE",
    steps: [
      { letter: "S", en: "Say what you see", uz: "Nimani ko'ryapsan" },
      { letter: "C", en: "Colours and appearance", uz: "Ranglar va ko'rinish" },
      { letter: "E", en: "Every location detail", uz: "Joy tafsilotlari" },
      { letter: "N", en: "Notice the background", uz: "Fonga e'tibor ber" },
      { letter: "E", en: "Emotions on faces", uz: "Yuzlardagi his-tuyg'u" },
    ],
  },
];

/**
 * Dialog mnemonikalari (rolli o'yin / intervyu).
 *
 * MUHIM FARQ: suhbat moduli `Coach` dan foydalanmaydi (u erkin nutq uchun),
 * shuning uchun bu bosqichlar FAQAT ko'rsatish uchun — `moveOf` cheklovi
 * bularga tegishli emas.
 */
export const ROLEPLAY_ACRONYMS: Acronym[] = [
  {
    acronym: "GREET",
    steps: [
      { letter: "G", en: "Greet politely", uz: "Xushmuomala salomlash" },
      { letter: "R", en: "Respond naturally", uz: "Tabiiy javob ber" },
      { letter: "E", en: "Explain what you need", uz: "Nima kerakligini tushuntir" },
      { letter: "E", en: "Extra questions", uz: "Qo'shimcha savol ber" },
      { letter: "T", en: "Thank and finish", uz: "Rahmat aytib yakunla" },
    ],
  },
  {
    acronym: "STYLE",
    steps: [
      { letter: "S", en: "Setting", uz: "Muhit" },
      { letter: "T", en: "Tone", uz: "Ohang" },
      { letter: "Y", en: "Your character", uz: "Sening roling" },
      { letter: "L", en: "Listen actively", uz: "Faol tingla" },
      { letter: "E", en: "Expressions", uz: "Iboralar" },
    ],
  },
];

export const INTERVIEW_ACRONYMS: Acronym[] = [
  {
    acronym: "LEARN",
    steps: [
      { letter: "L", en: "Listen carefully", uz: "Diqqat bilan tingla" },
      { letter: "E", en: "Easy, short questions", uz: "Qisqa savol ber" },
      { letter: "A", en: "Ask follow-up questions", uz: "Qo'shimcha savol ber" },
      { letter: "R", en: "Repeat to check", uz: "Tushunganingni tekshir" },
      { letter: "N", en: "Nice thank you", uz: "Chiroyli rahmat" },
    ],
  },
  {
    acronym: "QUEST",
    steps: [
      { letter: "Q", en: "Questions prepared", uz: "Savollar tayyor" },
      { letter: "U", en: "Understanding check", uz: "Tushunganini tekshir" },
      { letter: "E", en: "Eye contact", uz: "Ko'z aloqasi" },
      { letter: "S", en: "Short and clear", uz: "Qisqa va aniq" },
      { letter: "T", en: "Thank the person", uz: "Rahmat ayt" },
    ],
  },
];

export type PlanItem = {
  /** Bazadagi modul ID'si. */
  moduleId: string;
  /** Nima yaratiladi. `readaloud` — model bitta jumla yozadi (targetText). */
  kind: "exercise" | "dialog" | "readaloud";
  /** Darslik mavzusi (inglizcha) — mashqning `topic` maydoni. */
  topic: string;
  /** ID uchun qisqa kalit — mavzu o'zgarsa ham ID o'zgarmasin. */
  slug: string;
  /** Modelga vaziyat izohi (o'zbekcha) — nima haqida bo'lishi kerak. */
  brief: string;
  /** Mnemonika (dialog uchun ham). `readaloud` da ishlatilmaydi. */
  mnemonic?: Acronym;
  /** Sekundlarda. */
  timeLimitSec: number;
};

const D = DISCUSSION_ACRONYMS;
const S = STORY_ACRONYMS;
const P = PICTURE_ACRONYMS;
const R = ROLEPLAY_ACRONYMS;
const I = INTERVIEW_ACRONYMS;

/**
 * Reja. Mavzular 5–6 sinf ingliz tili darsliklaridagi mavzular doirasidan
 * olingan — bola darsda o'rgangan so'z boyligi bilan gapira olishi uchun.
 */
export const PLAN: PlanItem[] = [
  // ——— Munozara ———
  { moduleId: "discussion", kind: "exercise", topic: "School Life", slug: "school_life", brief: "Maktabdagi kun tartibi, darslar, sevimli fan — qaysi fan foydaliroq degan munozara.", mnemonic: D[0], timeLimitSec: 60 },
  { moduleId: "discussion", kind: "exercise", topic: "Healthy Food", slug: "healthy_food", brief: "Sog'lom ovqatlanish: mevalar va fast food, nima uchun sog'lom taom muhim.", mnemonic: D[1], timeLimitSec: 60 },
  { moduleId: "discussion", kind: "exercise", topic: "Free Time and Hobbies", slug: "hobbies", brief: "Bo'sh vaqt va sevimli mashg'ulotlar: kitob, sport, chizish — qaysi biri qiziqroq.", mnemonic: D[2], timeLimitSec: 60 },
  { moduleId: "discussion", kind: "exercise", topic: "Books and Reading", slug: "books", brief: "Kitob o'qish va telefon: kitob o'qish nima beradi, qog'oz kitobmi yoki elektronmi.", mnemonic: D[3], timeLimitSec: 60 },
  { moduleId: "discussion", kind: "exercise", topic: "Internet and Safety", slug: "internet_safety", brief: "Internet foydasi va xavfi, ekran oldida qancha vaqt o'tirish kerak.", mnemonic: D[0], timeLimitSec: 60 },
  { moduleId: "discussion", kind: "exercise", topic: "Sports and Health", slug: "sports_health", brief: "Sport bilan shug'ullanish nega kerak, jamoaviy va yakka sport turlari.", mnemonic: D[1], timeLimitSec: 60 },
  { moduleId: "discussion", kind: "readaloud", topic: "Talaffuz mashqi", slug: "read_school", brief: "Maktab haqida bitta ravon jumla — 'th', 'sch' kabi tovushlar bo'lsin.", timeLimitSec: 40 },

  // ——— Hikoya aytish ———
  { moduleId: "storytelling", kind: "exercise", topic: "A Journey", slug: "journey_train", brief: "Poyezdda sayohat: yo'lda kutilmagan voqea sodir bo'ladi.", mnemonic: S[0], timeLimitSec: 90 },
  { moduleId: "storytelling", kind: "exercise", topic: "Lost and Found", slug: "lost_and_found", brief: "Yo'qolgan narsa (kalit, telefon, mushuk) topiladi — kim yordam berdi.", mnemonic: S[1], timeLimitSec: 90 },
  { moduleId: "storytelling", kind: "exercise", topic: "A Rainy Day", slug: "rainy_day", brief: "Yomg'irli kun: reja buzildi, lekin kun baribir esda qolarli bo'ldi.", mnemonic: S[2], timeLimitSec: 90 },
  { moduleId: "storytelling", kind: "exercise", topic: "Helping Others", slug: "helping_neighbour", brief: "Qo'shniga yoki notanish odamga yordam berish hikoyasi.", mnemonic: S[0], timeLimitSec: 90 },
  { moduleId: "storytelling", kind: "exercise", topic: "Space and Stars", slug: "space_trip", brief: "Kosmosga sayohat haqida xayoliy hikoya: raketa, sayyora, kashfiyot.", mnemonic: S[1], timeLimitSec: 90 },
  { moduleId: "storytelling", kind: "readaloud", topic: "Talaffuz mashqi", slug: "read_story", brief: "Sarguzasht haqida bitta jumla — o'tgan zamon fe'llari bo'lsin.", timeLimitSec: 40 },

  // ——— Rasmli hikoya ———
  { moduleId: "picture_narrating", kind: "exercise", topic: "City Life", slug: "city_street", brief: "Shahar ko'chasi: odamlar, transport, do'konlar tasvirlanadi.", mnemonic: P[0], timeLimitSec: 60 },
  { moduleId: "picture_narrating", kind: "exercise", topic: "At the Market", slug: "market", brief: "Bozor: sotuvchilar, mevalar, xaridorlar — rang va harakat ko'p.", mnemonic: P[1], timeLimitSec: 60 },
  { moduleId: "picture_narrating", kind: "exercise", topic: "Seasons and Weather", slug: "seasons", brief: "Fasl manzarasi: ob-havo, kiyim, odamlar nima qilyapti.", mnemonic: P[2], timeLimitSec: 60 },
  { moduleId: "picture_narrating", kind: "exercise", topic: "In the Classroom", slug: "classroom", brief: "Sinfxona: o'quvchilar, o'qituvchi, doska, partadagi narsalar.", mnemonic: P[0], timeLimitSec: 60 },
  { moduleId: "picture_narrating", kind: "readaloud", topic: "Talaffuz mashqi", slug: "read_picture", brief: "Rasmni tasvirlaydigan bitta jumla — 'there is/are' bo'lsin.", timeLimitSec: 40 },

  // ——— Rolli o'yin ———
  { moduleId: "roleplay", kind: "dialog", topic: "At the Doctor", slug: "doctor", brief: "Shifokor qabulida: bola shamollagan, shifokor savol beradi va maslahat aytadi.", mnemonic: R[0], timeLimitSec: 60 },
  { moduleId: "roleplay", kind: "dialog", topic: "In a Cafe", slug: "cafe", brief: "Kafeda buyurtma berish: ofitsiant menyu taklif qiladi, narx va tanlov.", mnemonic: R[1], timeLimitSec: 60 },
  { moduleId: "roleplay", kind: "dialog", topic: "Asking for Directions", slug: "directions", brief: "Ko'chada yo'l so'rash: o'tkinchidan muzeyga qanday borishni so'raydi.", mnemonic: R[0], timeLimitSec: 60 },
  { moduleId: "roleplay", kind: "dialog", topic: "At the Library", slug: "library", brief: "Kutubxonada: kitobxona kartasi, kitob tanlash, qaytarish muddati.", mnemonic: R[1], timeLimitSec: 60 },
  { moduleId: "roleplay", kind: "dialog", topic: "Shopping for Clothes", slug: "clothes_shop", brief: "Kiyim do'konida: o'lcham, rang, narx, kiyib ko'rish.", mnemonic: R[0], timeLimitSec: 60 },

  // ——— Intervyu ———
  { moduleId: "interview", kind: "dialog", topic: "A Famous Chef", slug: "chef", brief: "Mashhur oshpaz bilan intervyu: sevimli taom, ish kuni, maslahat.", mnemonic: I[0], timeLimitSec: 60 },
  { moduleId: "interview", kind: "dialog", topic: "My Teacher", slug: "teacher", brief: "O'qituvchi bilan intervyu: kasb tanlashi, sevimli darsi, o'quvchilarga tilagi.", mnemonic: I[1], timeLimitSec: 60 },
  { moduleId: "interview", kind: "dialog", topic: "A Traveller", slug: "traveller", brief: "Sayohatchi bilan intervyu: qaysi mamlakatlarda bo'lgan, eng yodda qolgani.", mnemonic: I[0], timeLimitSec: 60 },
  { moduleId: "interview", kind: "dialog", topic: "A Young Inventor", slug: "inventor", brief: "Yosh ixtirochi bilan intervyu: nima ixtiro qilgan, qanday fikr kelgan.", mnemonic: I[1], timeLimitSec: 60 },
];

/** Bazadagi ID — mavzu matni tahrirlansa ham o'zgarmaydi. */
export function itemId(item: PlanItem): string {
  return `${item.moduleId}_${item.slug}`;
}

/**
 * Har bir mnemonika `Coach` ga tushunarli ekanini tekshiradi.
 *
 * Nima uchun kerak: bosqich nomini "Amazing ending" deb yozsak ham hech narsa
 * xato bermaydi — shunchaki o'sha mashqda struktura maslahati JIM qoladi.
 * Shuning uchun tekshiruv skript boshida ishlaydi va yiqiladi.
 *
 * Dialog mnemonikalari tekshirilmaydi — suhbat moduli Coach'siz ishlaydi.
 */
export function assertBankIsCheckable(): void {
  const banks: [string, Acronym[]][] = [
    ["Munozara", DISCUSSION_ACRONYMS],
    ["Hikoya", STORY_ACRONYMS],
    ["Rasmli hikoya", PICTURE_ACRONYMS],
  ];
  const problems: string[] = [];

  for (const [name, bank] of banks) {
    for (const a of bank) {
      const moves = checkableMoves(a.steps.map((s) => s.en));
      // 2 tadan kam bo'lsa mnemonikaning ma'nosi qolmaydi.
      if (moves.length < 2) {
        problems.push(`${name}/${a.acronym}: Coach faqat ${moves.length} bosqichni taniydi`);
      }
      for (const s of a.steps) {
        if (!s.en.toUpperCase().startsWith(s.letter.toUpperCase())) {
          problems.push(`${name}/${a.acronym}: "${s.en}" "${s.letter}" harfi bilan boshlanmaydi`);
        }
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(`Mnemonika banki noto'g'ri:\n  ${problems.join("\n  ")}`);
  }
}
