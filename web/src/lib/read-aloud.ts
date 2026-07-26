// Android'dagi analysis/ReadAloud.kt ning aynan porti.
//
// "Takrorlang" mashqi: bola ekrandagi jumlani o'qiydi.
//
// Nega bu alohida turadi: erkin nutqda biz bola nima demoqchi bo'lganini
// bilmaymiz, shuning uchun talaffuzni baholay olmaymiz. Bu yerda kutilgan matn
// OLDINDAN MA'LUM — demak har bir so'zni solishtirib, haqiqiy aniqlik foizini
// chiqarish mumkin. Loyihadagi yagona o'lchanadigan talaffuz bahosi shu.
//
// **ReadAloud.kt bilan doim birga o'zgartiriladi** (scripts/read-aloud.test.ts).

import type { CoachTip } from "./coach";

export type WordStatus = "CORRECT" | "MISSED";

/** Kutilgan matnning bitta so'zi va uning holati. */
export type ReadWord = { word: string; status: WordStatus };

export type ReadAloudResult = {
  words: ReadWord[];
  correctCount: number;
  targetCount: number;
  /** Matnda yo'q, lekin aytilgan so'zlar soni. */
  extraCount: number;
  accuracy: number;
  tips: CoachTip[];
};

/** Juda uzun kirishda DP jadvali kattalashib ketmasligi uchun chegara. */
const MAX_WORDS = 200;

/** speech-analyzer.ts va coach.ts dagi bo'lish bilan bir xil bo'lishi shart. */
function splitWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}']+/u)
    .filter((w) => w.trim().length > 0);
}

/**
 * Kutilgan va aytilgan so'z ketma-ketligini tekislaydi (so'z darajasidagi
 * Levenshtein). Qaytaradi: har bir kutilgan so'zning holati + ortiqcha
 * aytilgan so'zlar soni.
 *
 * Teng variantlar bo'lganda tanlov tartibi QAT'IY (moslik → almashtirish →
 * tushirish → qo'shish), aks holda Kotlin va TS turli natija berardi.
 */
function align(target: string[], spoken: string[]): { statuses: WordStatus[]; extras: number } {
  const n = target.length;
  const m = spoken.length;
  const d: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i][0] = i;
  for (let j = 0; j <= m; j++) d[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = target[i - 1] === spoken[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j - 1] + cost, d[i - 1][j] + 1, d[i][j - 1] + 1);
    }
  }

  const statuses: WordStatus[] = new Array<WordStatus>(n).fill("MISSED");
  let extras = 0;
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && target[i - 1] === spoken[j - 1] && d[i][j] === d[i - 1][j - 1]) {
      statuses[i - 1] = "CORRECT";
      i--;
      j--;
    } else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + 1) {
      i--; // almashtirilgan
      j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      i--; // aytilmagan
    } else {
      extras++; // ortiqcha
      j--;
    }
  }
  return { statuses, extras };
}

function buildTips(accuracy: number, words: ReadWord[], extras: number, wpm: number): CoachTip[] {
  const out: CoachTip[] = [];

  let praise: string;
  if (accuracy >= 90) praise = `Deyarli mukammal o'qiding — ${accuracy}% to'g'ri!`;
  else if (accuracy >= 70) praise = `Yaxshi o'qiding — ${accuracy}% to'g'ri.`;
  else if (accuracy >= 40) praise = "Yarmidan ko'pini to'g'ri o'qiding. Yana bir marta urinib ko'r.";
  else praise = "Boshlash qiyin — matnni sekin, so'zma-so'z o'qib ko'r.";
  out.push({ kind: "PRAISE", title: "Yaxshi tomoni", detail: praise });

  const missed = words.filter((w) => w.status === "MISSED").map((w) => w.word);
  if (missed.length > 0) {
    out.push({
      kind: "STRUCTURE",
      title: "Qiynalgan so'zlar",
      detail: `Bu so'zlarni qaytadan ayt: ${missed.slice(0, 4).join(", ")}.`,
    });
  }

  if (extras >= 3) {
    out.push({
      kind: "HABIT",
      title: "Faqat matnni o'qi",
      detail: "Matnda yo'q so'zlar qo'shding — ekranda yozilganini aynan o'qishga harakat qil.",
    });
  }

  if (wpm >= 1 && wpm <= 49) {
    out.push({ kind: "FLUENCY", title: "Tezlik", detail: "Biroz tezroq o'qi — so'zlar orasida uzoq to'xtama." });
  } else if (wpm > 160) {
    out.push({ kind: "FLUENCY", title: "Tezlik", detail: "Sekinroq o'qi — shoshilsang so'zlar tushib qoladi." });
  }

  return out;
}

/**
 * @param alternatives tanigichning boshqa variantlari. Birinchi solishtirishda
 *   topilmagan so'z shu variantlarning birida bo'lsa — TO'G'RI hisoblanadi.
 *   Sabab keyword-matcher.ts dagi bilan bir xil: tanigichning noaniqligi
 *   bolaning xatosiga aylanmasligi kerak.
 */
export function analyzeReadAloud(
  targetText: string,
  transcript: string,
  durationSec: number,
  alternatives: string[] = [],
): ReadAloudResult {
  const target = splitWords(targetText).slice(0, MAX_WORDS);
  const spoken = splitWords(transcript).slice(0, MAX_WORDS);

  if (target.length === 0) {
    return { words: [], correctCount: 0, targetCount: 0, extraCount: 0, accuracy: 0, tips: [] };
  }

  const { statuses, extras } = align(target, spoken);

  // Ikkinchi bosqich: topilmagan so'z tanigichning boshqa variantida bormi?
  const altWords = new Set(alternatives.flatMap((a) => splitWords(a)));
  for (let i = 0; i < statuses.length; i++) {
    if (statuses[i] === "MISSED" && altWords.has(target[i])) statuses[i] = "CORRECT";
  }

  const words: ReadWord[] = target.map((w, i) => ({ word: w, status: statuses[i] }));
  const correct = statuses.filter((s) => s === "CORRECT").length;
  const accuracy = Math.floor((correct * 100) / target.length);
  const wpm = Math.floor((spoken.length * 60) / Math.max(durationSec, 1));

  return {
    words,
    correctCount: correct,
    targetCount: target.length,
    extraCount: extras,
    accuracy,
    tips: buildTips(accuracy, words, extras, wpm),
  };
}
