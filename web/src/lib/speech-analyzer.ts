// Android'dagi analysis/SpeechAnalyzer.kt ning aynan porti.
//
// MUHIM: Kotlin'da Int / Int butun sonli bo'lish (kasr qismi tashlanadi).
// Shuning uchun bu yerda ham hamma joyda Math.floor ishlatiladi — aks holda
// bir xil nutq Android'da va web'da turli ball olib, o'qituvchi panelidagi
// raqamlarni taqqoslab bo'lmay qoladi.

import { matchedKeywords } from "./keyword-matcher";
import { coachTips, grammarTip, type CoachTip } from "./coach";

export type SpeechResult = {
  transcript: string;
  wordCount: number;
  uniqueWordCount: number;
  durationSec: number;
  wordsPerMinute: number;
  matchedKeywords: string[];
  totalKeywords: number;
  overallScore: number;
  /** Ko'rsatiladigan matnlar — `tips` dan olinadi (qarang: coach.ts). */
  feedback: string[];
  grammarScore: number | null;
  grammarIssues: string[];
  keywordCoverage: number;
  /** Sarlavhali, turkumlangan maslahatlar. */
  tips: CoachTip[];
};

export type GrammarReport = {
  score: number;
  issueCount: number;
  issues: string[];
};

/** Kotlin'dagi `transcript.split(Regex("[^\\p{L}']+"))` bilan bir xil. */
function splitWords(transcript: string): string[] {
  return transcript
    .toLowerCase()
    .split(/[^\p{L}']+/u)
    .filter((w) => w.trim().length > 0);
}

// 5-6 sinf uchun ~60-110 wpm yaxshi oraliq
function fluencyScore(wpm: number): number {
  if (wpm >= 90) return 100;
  if (wpm >= 60) return 80;
  if (wpm >= 40) return 60;
  if (wpm >= 20) return 40;
  return 20;
}

function vocabScore(unique: number): number {
  if (unique >= 40) return 100;
  if (unique >= 25) return 80;
  if (unique >= 15) return 60;
  if (unique >= 8) return 40;
  return 20;
}

function lengthScore(words: number): number {
  if (words >= 60) return 100;
  if (words >= 40) return 80;
  if (words >= 25) return 60;
  if (words >= 12) return 40;
  return 20;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/**
 * @param alternatives tanigichning qo'shimcha variantlari — FAQAT kalit so'z
 *   qidirishda ishlatiladi. So'z soni va tezlik asosiy transkriptdan olinadi,
 *   aks holda variantlar so'zlarni ikki marta sanab yuborardi.
 */
export function analyze(
  transcript: string,
  durationSec: number,
  keywords: string[],
  alternatives: string[] = [],
  mnemonicSteps: string[] = [],
): SpeechResult {
  const words = splitWords(transcript);

  const wordCount = words.length;
  const uniqueWordCount = new Set(words).size;
  const safeDuration = Math.max(durationSec, 1);
  const wpm = Math.floor((wordCount * 60) / safeDuration);

  // ASR xatolariga chidamli solishtirish (qarang: keyword-matcher.ts).
  const matched = matchedKeywords(transcript, keywords, alternatives);

  const keywordScore =
    keywords.length === 0 ? 100 : Math.floor((matched.length * 100) / keywords.length);

  const overall = clamp(
    Math.floor(
      (fluencyScore(wpm) + vocabScore(uniqueWordCount) + keywordScore + lengthScore(wordCount)) / 4,
    ),
    0,
    100,
  );

  // Maslahatlar BALLGA TA'SIR QILMAYDI — formula o'zgarmadi, aks holda
  // eski urinishlar bilan taqqoslab bo'lmay qolardi.
  const tips = coachTips(
    transcript,
    wordCount,
    uniqueWordCount,
    wpm,
    matched,
    keywords,
    mnemonicSteps,
  );

  return {
    transcript: transcript.trim(),
    wordCount,
    uniqueWordCount,
    durationSec,
    wordsPerMinute: wpm,
    matchedKeywords: matched,
    totalKeywords: keywords.length,
    overallScore: overall,
    feedback: tips.map((t) => t.detail),
    grammarScore: null,
    grammarIssues: [],
    keywordCoverage:
      keywords.length === 0 ? 0 : Math.floor((matched.length * 100) / keywords.length),
    tips,
  };
}

/** Grammatika hisobotini natijaga qo'shadi va umumiy ballni qayta hisoblaydi. */
export function withGrammar(result: SpeechResult, report: GrammarReport): SpeechResult {
  const newOverall = clamp(Math.floor((result.overallScore * 4 + report.score) / 5), 0, 100);
  const tip = grammarTip(report.issueCount);
  return {
    ...result,
    overallScore: newOverall,
    grammarScore: report.score,
    grammarIssues: report.issues,
    feedback: [...result.feedback, tip.detail],
    tips: [...result.tips, tip],
  };
}
