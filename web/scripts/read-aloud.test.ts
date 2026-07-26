// "Takrorlang" mashqi testi.
//
// Ishga tushirish:  npm run test:readaloud
//
// Nega test kerak: bu yerdagi ball to'g'ridan-to'g'ri bolaning talaffuz bahosi.
// Tekislash (alignment) noto'g'ri bo'lsa, bola to'g'ri o'qigan so'z "aytilmagan"
// deb belgilanadi. Bundan tashqari bu fayl Android'dagi `analysis/ReadAloud.kt`
// bilan AYNAN bir xil bo'lishi shart — teng variantlarda tanlov tartibi ham.

import { analyzeReadAloud } from "../src/lib/read-aloud";

type Case = {
  name: string;
  target: string;
  spoken: string;
  alternatives?: string[];
  expectAccuracy: number;
  expectMissed?: string[];
  expectExtra?: number;
};

const cases: Case[] = [
  {
    name: "mukammal o'qish",
    target: "My dog is very friendly",
    spoken: "my dog is very friendly",
    expectAccuracy: 100,
    expectMissed: [],
  },
  {
    name: "bitta so'z tushib qolgan",
    target: "My dog is very friendly",
    spoken: "my dog is friendly",
    expectAccuracy: 80,
    expectMissed: ["very"],
  },
  {
    name: "bitta so'z noto'g'ri aytilgan",
    target: "My dog is very friendly",
    spoken: "my cat is very friendly",
    expectAccuracy: 80,
    expectMissed: ["dog"],
  },
  {
    name: "ortiqcha so'z qo'shilgan",
    target: "My dog is friendly",
    spoken: "my big dog is very friendly",
    expectAccuracy: 100,
    expectMissed: [],
    expectExtra: 2,
  },
  {
    name: "tartib buzilgan — ikkitasi topilmaydi",
    target: "the cat sat on the mat",
    spoken: "the mat sat on the cat",
    expectAccuracy: 66,
  },
  {
    name: "hech narsa aytilmagan",
    target: "My dog is very friendly",
    spoken: "",
    expectAccuracy: 0,
    expectMissed: ["my", "dog", "is", "very", "friendly"],
  },
  {
    name: "butunlay boshqa gap",
    target: "My dog is friendly",
    spoken: "i like pizza very much",
    expectAccuracy: 0,
  },

  // ── Tanigich noaniqligi bolaning xatosiga aylanmasligi kerak ────
  {
    name: "so'z ikkinchi variantda topiladi",
    target: "My dog is friendly",
    spoken: "my dock is friendly",
    alternatives: ["my dog is friendly"],
    expectAccuracy: 100,
    expectMissed: [],
  },
  {
    name: "variantda ham yo'q — xato bo'lib qoladi",
    target: "My dog is friendly",
    spoken: "my dock is friendly",
    alternatives: ["my duck is friendly"],
    expectAccuracy: 75,
    expectMissed: ["dog"],
  },

  // ── Chegaraviy holatlar ────────────────────────────────────────
  {
    name: "katta-kichik harf va tinish belgilari hisobga olinmaydi",
    target: "My dog, is friendly!",
    spoken: "MY DOG IS FRIENDLY",
    expectAccuracy: 100,
    expectMissed: [],
  },
  {
    name: "takrorlangan so'zlar to'g'ri tekislanadi",
    target: "the big big dog",
    spoken: "the big dog",
    expectAccuracy: 75,
    expectMissed: ["big"],
  },
];

let failed = 0;
for (const c of cases) {
  const r = analyzeReadAloud(c.target, c.spoken, 30, c.alternatives ?? []);
  const missed = r.words.filter((w) => w.status === "MISSED").map((w) => w.word);
  const problems: string[] = [];

  if (r.accuracy !== c.expectAccuracy) {
    problems.push(`aniqlik ${c.expectAccuracy}% kutilgan edi, kelgani ${r.accuracy}%`);
  }
  if (c.expectMissed && missed.join(",") !== c.expectMissed.join(",")) {
    problems.push(`topilmagan [${c.expectMissed.join(", ")}] kutilgan edi, kelgani [${missed.join(", ")}]`);
  }
  if (c.expectExtra !== undefined && r.extraCount !== c.expectExtra) {
    problems.push(`ortiqcha ${c.expectExtra} kutilgan edi, kelgani ${r.extraCount}`);
  }
  // Har doim bitta maqtov bo'lishi kerak (bo'sh matndan tashqari).
  if (r.targetCount > 0 && r.tips[0]?.kind !== "PRAISE") {
    problems.push("birinchi maslahat maqtov emas");
  }
  if (r.correctCount + missed.length !== r.targetCount) {
    problems.push("to'g'ri + topilmagan = jami emas");
  }

  if (problems.length > 0) {
    failed++;
    console.error(`✗ ${c.name}`);
    for (const p of problems) console.error(`    ${p}`);
  } else {
    console.log(`✓ ${c.name}`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} o'tdi`);
if (failed > 0) process.exit(1);
