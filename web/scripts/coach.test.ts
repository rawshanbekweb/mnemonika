// Qoidaga asoslangan murabbiy testi.
//
// Ishga tushirish:  npm run test:coach
//
// Nega test kerak: bu mantiq bolaga AYTILADIGAN gapni belgilaydi. Noto'g'ri
// signal ibora ro'yxati bolani "misol keltirmading" deb noto'g'ri ayblaydi,
// juda keng ro'yxat esa tekshiruvni ma'nosiz qiladi (har javob "to'g'ri").
// Bundan tashqari bu fayl Android'dagi `analysis/Coach.kt` bilan AYNAN bir xil
// bo'lishi shart.

import {
  checkableMoves,
  coachTips,
  type CoachTip,
  type TipBankEntry,
  type TipKind,
} from "../src/lib/coach";

/** Haqiqiy kontentdagi mnemonikalar (assets/content/modules.json). */
const PETS = ["Position", "Example", "Thoughts of others", "Summary"];
const OCEAN = ["Opening", "Characters", "Events", "Amazing ending", "Natural flow"];
const QUEST = ["Questions prepared", "Understanding check", "Eye contact", "Short & clear", "Thank the person"];

type Case = {
  name: string;
  transcript: string;
  keywords?: string[];
  matched?: string[];
  steps?: string[];
  wpm?: number;
  /** Shu sarlavha bo'lishi kerak. */
  expectTitle?: string;
  /** Shu turdagi maslahat BO'LMASLIGI kerak. */
  expectNoKind?: TipKind;
  /** Shu sarlavhali maslahat BO'LMASLIGI kerak. */
  expectNoTitle?: string;
  /** Maqtov matnida shu bo'lak bo'lishi kerak. */
  expectPraiseHas?: string;
  /** Mashqqa xos maslahat banki (bo'sh bo'lsa umumiy matnlar). */
  bank?: TipBankEntry[];
  /** Struktura maslahati matni AYNAN shunday bo'lishi kerak. */
  expectDetail?: string;
};

function run(c: Case): CoachTip[] {
  const words = c.transcript.toLowerCase().split(/[^\p{L}']+/u).filter((w) => w.length > 0);
  return coachTips(
    c.transcript,
    words.length,
    new Set(words).size,
    c.wpm ?? 80,
    c.matched ?? [],
    c.keywords ?? [],
    c.steps ?? [],
    c.bank ?? [],
  );
}

const cases: Case[] = [
  // ── Struktura: yetishmagan bosqich topilishi kerak ──────────────
  {
    name: "PETS — fikr bildirilmagan",
    transcript: "dogs are nice animals for example my friend has a dog",
    steps: PETS,
    expectTitle: "Fikringni ayt",
  },
  {
    name: "PETS — fikr bor, misol yo'q",
    transcript: "i think dogs are the best pets because they are friendly and loyal",
    steps: PETS,
    expectTitle: "Misol keltir",
  },
  {
    name: "OCEAN — voqealar tartibi yo'q",
    transcript: "the boy was very happy and the ending was amazing for everyone",
    steps: OCEAN,
    expectTitle: "Voqealar tartibi",
  },
  {
    name: "OCEAN — tartib bor, struktura shikoyati yo'q",
    transcript: "first the boy went to the sea then he saw a fish after that he swam home",
    steps: OCEAN,
    expectNoKind: "STRUCTURE",
  },

  // ── Aniqlab bo'lmaydigan bosqichlar haqida GAPIRMASLIK kerak ────
  {
    name: "QUEST — hamma bosqich xatti-harakat, struktura tekshirilmaydi",
    transcript: "hello my name is ali and i want to ask you some questions about sport",
    steps: QUEST,
    expectNoKind: "STRUCTURE",
  },
  {
    name: "mnemonikasiz mashq — struktura tekshirilmaydi",
    transcript: "i went to the park and played with my friends it was a good day",
    steps: [],
    expectNoKind: "STRUCTURE",
  },

  // ── Signal iboralar so'z chegarasi bilan topilishi kerak ────────
  {
    name: "'because' so'z ichida bo'lsa hisoblanmaydi",
    // "becauseful" yo'q so'z, lekin qidiruv so'z chegarasisiz bo'lsa topilardi
    transcript: "i think dogs are nice becauseful reasons for example this one",
    steps: ["Give reasons"],
    expectTitle: "Sababini ayt",
  },

  // ── Odatlar ────────────────────────────────────────────────────
  {
    name: "to'ldiruvchi tovushlar",
    transcript: "um i think um dogs are nice um they are friendly for example my dog",
    steps: [],
    expectTitle: "To'xtashlar",
  },
  {
    name: "bir so'zni ko'p takrorlash",
    transcript: "dogs dogs are nice dogs play with dogs and dogs run fast every day here",
    steps: [],
    expectTitle: "Takrorlash",
  },
  {
    // 15 so'zdan qisqa javobda "sinonim topib ko'r" degan maslahat ma'nosiz —
    // "So'z boyligi" maslahati esa o'rinli, shuning uchun u chiqishi mumkin.
    name: "qisqa javobda takrorlash maslahati chiqmaydi",
    transcript: "dogs dogs dogs dogs",
    steps: [],
    expectNoTitle: "Takrorlash",
  },

  // ── Maqtov ─────────────────────────────────────────────────────
  {
    name: "barcha kalit so'zlar ishlatilgan",
    transcript: "i think my dog is friendly and i play with him every day",
    keywords: ["dog", "play"],
    matched: ["dog", "play"],
    steps: [],
    expectPraiseHas: "Barcha kalit so'zlarni",
  },
  {
    name: "struktura to'liq",
    transcript:
      "i think dogs are best for example my dog is kind some people think cats are better but finally i choose dogs",
    steps: PETS,
    expectPraiseHas: "struktura",
  },

  // ── Maslahatlar soni cheklangan ────────────────────────────────
  {
    name: "eng ko'pi bilan 3 ta maslahat + 1 maqtov",
    transcript: "um um um dog",
    keywords: ["cat", "house", "garden"],
    matched: [],
    steps: PETS,
    wpm: 10,
  },

  // ── Maslahat banki (mashqqa xos matn) ──────────────────────────
  // Bank faqat KO'RSATILADIGAN MATNni almashtiradi; qaysi bosqich
  // yetishmaganini Coach o'zi aniqlaydi. Shuni tekshiramiz.
  {
    name: "bank — mavzuga xos matn umumiysini almashtiradi",
    transcript: "dogs are nice animals for example my friend has a dog",
    steps: PETS,
    bank: [{ move: "OPINION", title: "Fikring", detail: 'Hayvon haqida "I think…" deb boshla.' }],
    expectTitle: "Fikring",
    expectDetail: 'Hayvon haqida "I think…" deb boshla.',
  },
  {
    name: "bank — boshqa harakat uchun yozuv ishlatilmaydi",
    transcript: "dogs are nice animals for example my friend has a dog",
    steps: PETS,
    // Yetishmagani OPINION, bankda esa faqat REASON bor — umumiy matn qolishi kerak.
    bank: [{ move: "REASON", title: "Sabab", detail: "Bu ishlatilmasligi kerak." }],
    expectTitle: "Fikringni ayt",
    expectNoTitle: "Sabab",
  },
  {
    name: "bank — bo'sh matn umumiysiga qaytadi",
    transcript: "dogs are nice animals for example my friend has a dog",
    steps: PETS,
    bank: [{ move: "OPINION", title: "Fikring", detail: "   " }],
    expectTitle: "Fikringni ayt",
  },
  {
    name: "bank — sarlavha bo'sh bo'lsa umumiy sarlavha olinadi",
    transcript: "dogs are nice animals for example my friend has a dog",
    steps: PETS,
    bank: [{ move: "OPINION", title: "", detail: "Sevimli hayvoningni ayt." }],
    expectTitle: "Fikringni ayt",
    expectDetail: "Sevimli hayvoningni ayt.",
  },
];

let failed = 0;
for (const c of cases) {
  const tips = run(c);
  const titles = tips.map((t) => t.title);
  const problems: string[] = [];

  if (tips.length > 4) problems.push(`4 tadan ko'p maslahat: ${tips.length}`);
  if (tips[0]?.kind !== "PRAISE") problems.push("birinchi element maqtov emas");

  if (c.expectTitle && !titles.includes(c.expectTitle)) {
    problems.push(`"${c.expectTitle}" kutilgan edi, kelgani: ${titles.join(" | ")}`);
  }
  if (c.expectNoKind && tips.some((t) => t.kind === c.expectNoKind)) {
    problems.push(`${c.expectNoKind} turidagi maslahat bo'lmasligi kerak edi`);
  }
  if (c.expectNoTitle && titles.includes(c.expectNoTitle)) {
    problems.push(`"${c.expectNoTitle}" maslahati bo'lmasligi kerak edi`);
  }
  if (c.expectPraiseHas && !tips[0].detail.includes(c.expectPraiseHas)) {
    problems.push(`maqtovda "${c.expectPraiseHas}" kutilgan edi, kelgani: "${tips[0].detail}"`);
  }
  if (c.expectDetail) {
    const structure = tips.find((t) => t.kind === "STRUCTURE");
    if (!structure) {
      problems.push("struktura maslahati kutilgan edi, kelmadi");
    } else if (structure.detail !== c.expectDetail) {
      problems.push(`matn "${c.expectDetail}" kutilgan edi, kelgani: "${structure.detail}"`);
    }
  }

  if (problems.length > 0) {
    failed++;
    console.error(`✗ ${c.name}`);
    for (const p of problems) console.error(`    ${p}`);
  } else {
    console.log(`✓ ${c.name}`);
  }
}

// checkableMoves — generatsiya skripti shu ro'yxatga tayanadi, shuning uchun
// aniqlab bo'lmaydigan bosqichlar unga tushmasligini alohida tekshiramiz.
{
  const pets = checkableMoves(PETS);
  const quest = checkableMoves(QUEST);
  const problems: string[] = [];
  if (pets.join(",") !== "OPINION,EXAMPLE,OTHERS,SUMMARY") {
    problems.push(`PETS: kutilgan OPINION,EXAMPLE,OTHERS,SUMMARY — kelgani ${pets.join(",")}`);
  }
  // "Eye contact", "Short & clear", "Thank the person" nutq matnidan
  // aniqlanmaydi — ular ro'yxatga tushmasligi kerak.
  if (quest.length !== 0) {
    problems.push(`QUEST: aniqlanadigan bosqich bo'lmasligi kerak — kelgani ${quest.join(",")}`);
  }
  if (problems.length > 0) {
    failed++;
    console.error("✗ checkableMoves");
    for (const p of problems) console.error(`    ${p}`);
  } else {
    console.log("✓ checkableMoves");
  }
}

const total = cases.length + 1; // + checkableMoves
console.log(`\n${total - failed}/${total} o'tdi`);
if (failed > 0) process.exit(1);
