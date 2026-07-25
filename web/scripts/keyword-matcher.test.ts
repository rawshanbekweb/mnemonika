// Kalit so'z solishtirish testi.
//
// Ishga tushirish:  npm run test:matcher
//
// Nega test kerak: bu mantiq nozik. Juda bo'sh qoida "house" ni "horse" deb
// hisoblab, kalit so'z metrikasini ma'nosiz qiladi; juda qattiq qoida esa
// tanigichning xatosini bolaning xatosiga aylantiradi. Bundan tashqari bu fayl
// Android'dagi `analysis/KeywordMatcher.kt` bilan AYNAN bir xil bo'lishi shart.

import { matchedKeywords } from "../src/lib/keyword-matcher";

type Case = {
  transcript: string;
  keywords: string[];
  alternatives?: string[];
  expect: string[];
  why: string;
};

const cases: Case[] = [
  // ── Tanigich variantlari orqali topilishi kerak ────────────────
  {
    transcript: "i have a dock at home",
    alternatives: ["i have a dog at home"],
    keywords: ["dog"],
    expect: ["dog"],
    why: "qisqa so'z ikkinchi variantda",
  },
  {
    transcript: "my pat is small",
    alternatives: ["my pet is small", "my pot is small"],
    keywords: ["pet"],
    expect: ["pet"],
    why: "qisqa so'z uchinchi variantda",
  },
  {
    transcript: "i have a dock at home",
    alternatives: ["i have a duck at home"],
    keywords: ["dog"],
    expect: [],
    why: "hech qaysi variantda yo'q — topilmasligi kerak",
  },

  // ── Topilishi kerak (so'z shakli yoki uzun so'zdagi ASR xatosi) ─
  { transcript: "i like playing football", keywords: ["play"], expect: ["play"], why: "o'zak: play/playing" },
  { transcript: "my friends are kind", keywords: ["friend"], expect: ["friend"], why: "substring" },
  { transcript: "i have two cats", keywords: ["cat"], expect: ["cat"], why: "substring ko'plik" },
  { transcript: "she is my siter", keywords: ["sister"], expect: ["sister"], why: "harf tushib qolgan" },
  { transcript: "we visited the musium", keywords: ["museum"], expect: ["museum"], why: "6 harfli, 1 farq" },
  { transcript: "we went to the restarant", keywords: ["restaurant"], expect: ["restaurant"], why: "uzun so'z" },

  // ── Topilmasligi kerak (boshqa so'z) ───────────────────────────
  { transcript: "i wear a cap", keywords: ["cat"], expect: [], why: "qisqa so'z aynan bo'lishi shart" },
  { transcript: "i saw a bat", keywords: ["bad"], expect: [], why: "3 harfli taxmin qilinmaydi" },
  { transcript: "the house is big", keywords: ["horse"], expect: [], why: "house != horse (5 harf)" },
  { transcript: "my father is here", keywords: ["rather"], expect: [], why: "birinchi harf farqi" },
  { transcript: "i like tea", keywords: ["sea"], expect: [], why: "3 harfli" },
  { transcript: "nothing relevant here", keywords: ["elephant"], expect: [], why: "umuman boshqa" },

  // ── Ko'p so'zli ibora ──────────────────────────────────────────
  { transcript: "my best friend is ali", keywords: ["best friend"], expect: ["best friend"], why: "ibora aynan bor" },
  { transcript: "my bost frend is ali", keywords: ["best friend"], expect: [], why: "iborada taxmin yo'q" },
];

let failed = 0;
for (const c of cases) {
  const got = matchedKeywords(c.transcript, c.keywords, c.alternatives ?? []);
  if (JSON.stringify(got) === JSON.stringify(c.expect)) {
    console.log(`  ok    ${c.why}`);
  } else {
    failed++;
    console.error(`  FAIL  ${c.why}`);
    console.error(`        "${c.transcript}" / kalit=[${c.keywords}]`);
    console.error(`        kutilgan=[${c.expect}] olingan=[${got}]`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} o'tdi`);
if (failed > 0) process.exit(1);
