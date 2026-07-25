// Android'dagi analysis/SpeechAnalyzer.kt ning aynan porti.
//
// MUHIM: Kotlin'da Int / Int butun sonli bo'lish (kasr qismi tashlanadi).
// Shuning uchun bu yerda ham hamma joyda Math.floor ishlatiladi — aks holda
// bir xil nutq Android'da va web'da turli ball olib, o'qituvchi panelidagi
// raqamlarni taqqoslab bo'lmay qoladi.

export type SpeechResult = {
  transcript: string;
  wordCount: number;
  uniqueWordCount: number;
  durationSec: number;
  wordsPerMinute: number;
  matchedKeywords: string[];
  totalKeywords: number;
  overallScore: number;
  feedback: string[];
  grammarScore: number | null;
  grammarIssues: string[];
  keywordCoverage: number;
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

function buildFeedback(
  wpm: number,
  words: number,
  unique: number,
  matched: string[],
  keywords: string[],
): string[] {
  const tips: string[] = [];

  if (words < 25) {
    tips.push("Ko'proq gapirishga harakat qiling — hikoyangizni kengaytiring.");
  } else {
    tips.push(`Yaxshi! Yetarlicha gapirdingiz (${words} so'z).`);
  }

  if (wpm < 40) {
    tips.push("Biroz tezroq va ravonroq gapirishga urinib ko'ring.");
  } else if (wpm > 140) {
    tips.push("Sekinroq gapiring — har bir so'z aniq eshitilsin.");
  } else {
    tips.push(`Nutq tezligingiz yaxshi (${wpm} so'z/daqiqa).`);
  }

  if (unique < 15) {
    tips.push("Turli xil so'zlardan foydalaning — so'z boyligini oshiring.");
  }

  const missing = keywords.filter((k) => !matched.includes(k));
  if (missing.length > 0) {
    tips.push(`Bu so'zlarni ham qo'shsangiz bo'lardi: ${missing.join(", ")}.`);
  } else if (keywords.length > 0) {
    tips.push("Barcha tavsiya etilgan kalit so'zlarni ishlatdingiz!");
  }

  return tips;
}

export function analyze(
  transcript: string,
  durationSec: number,
  keywords: string[],
): SpeechResult {
  const words = splitWords(transcript);

  const wordCount = words.length;
  const uniqueWordCount = new Set(words).size;
  const safeDuration = Math.max(durationSec, 1);
  const wpm = Math.floor((wordCount * 60) / safeDuration);

  const spoken = new Set(words);
  const lowerTranscript = transcript.toLowerCase();
  const matched = keywords.filter((kw) => {
    const k = kw.toLowerCase();
    return spoken.has(k) || lowerTranscript.includes(k);
  });

  const keywordScore =
    keywords.length === 0 ? 100 : Math.floor((matched.length * 100) / keywords.length);

  const overall = clamp(
    Math.floor(
      (fluencyScore(wpm) + vocabScore(uniqueWordCount) + keywordScore + lengthScore(wordCount)) / 4,
    ),
    0,
    100,
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
    feedback: buildFeedback(wpm, wordCount, uniqueWordCount, matched, keywords),
    grammarScore: null,
    grammarIssues: [],
    keywordCoverage:
      keywords.length === 0 ? 0 : Math.floor((matched.length * 100) / keywords.length),
  };
}

/** Grammatika hisobotini natijaga qo'shadi va umumiy ballni qayta hisoblaydi. */
export function withGrammar(result: SpeechResult, report: GrammarReport): SpeechResult {
  const newOverall = clamp(Math.floor((result.overallScore * 4 + report.score) / 5), 0, 100);
  return {
    ...result,
    overallScore: newOverall,
    grammarScore: report.score,
    grammarIssues: report.issues,
    feedback: [
      ...result.feedback,
      report.issueCount === 0
        ? "Grammatik xatolar topilmadi — juda yaxshi!"
        : `Grammatikada ${report.issueCount} ta e'tibor talab qiladigan joy bor.`,
    ],
  };
}
