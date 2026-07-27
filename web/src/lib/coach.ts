// Android'dagi analysis/Coach.kt ning aynan porti.
//
// Qoidaga asoslangan "murabbiy" — transkriptdan bolaga AYNAN nima qilish
// kerakligini aytadi. Model ham, internet ham kerak emas.
//
// MUHIM PEDAGOGIK QAROR: biz bolaning misol keltirgan-keltirmaganini bila
// olmaymiz — buni aniqlash uchun tilni tushunadigan model kerak. Biz faqat
// **signal iboralarni** (for example, because, I think…) qidiramiz va tavsiyani
// ayblov emas, o'rgatish sifatida beramiz: "'for example' deb boshlab ko'r".
// Bola misolni ibora ishlatmasdan aytgan bo'lsa ham, bu maslahat noto'g'ri
// bo'lmaydi — imtihonda aynan shu signal iboralar baholanadi.
//
// **Coach.kt bilan doim birga o'zgartirilishi shart** (scripts/coach.test.ts).

export type TipKind =
  | "PRAISE"
  | "STRUCTURE"
  | "KEYWORDS"
  | "LENGTH"
  | "FLUENCY"
  | "VOCABULARY"
  | "HABIT"
  | "GRAMMAR";

/** Bitta maslahat. `title` — qisqa sarlavha, `detail` — bir gaplik tavsiya. */
export type CoachTip = { kind: TipKind; title: string; detail: string };

/** Transkriptdan aniqlab bo'ladigan "nutq harakatlari". */
type Move =
  | "OPINION"
  | "EXAMPLE"
  | "REASON"
  | "OTHERS"
  | "SUMMARY"
  | "SEQUENCE"
  | "EMOTION"
  | "PLACE"
  | "DESCRIBE";

const MAX_TIPS = 3;

/** speech-analyzer.ts dagi bo'lish bilan bir xil bo'lishi shart. */
function splitWords(transcript: string): string[] {
  return transcript
    .toLowerCase()
    .split(/[^\p{L}']+/u)
    .filter((w) => w.trim().length > 0);
}

const CUES: Record<Move, string[]> = {
  OPINION: [
    "i think", "i believe", "in my opinion", "i feel", "for me",
    "i would", "i like", "i love", "my favourite", "my favorite",
  ],
  EXAMPLE: ["for example", "for instance", "such as", "like when", "one day"],
  REASON: ["because", "since", "that's why", "that is why", "the reason", "so that"],
  OTHERS: [
    "some people", "other people", "people say", "people think",
    "many people", "my friend", "everyone",
  ],
  SUMMARY: ["in conclusion", "to sum up", "finally", "overall", "in the end", "all in all"],
  SEQUENCE: ["first", "then", "after that", "next", "later", "suddenly", "at the end"],
  EMOTION: [
    "happy", "sad", "excited", "scared", "afraid", "angry",
    "surprised", "nervous", "proud", "worried", "glad", "upset",
  ],
  // "in the" / "on the" ataylab yo'q — ular deyarli har gapda uchraydi
  // va tekshiruvni ma'nosiz qilib qo'yadi.
  PLACE: [
    "next to", "behind", "in front of", "at the top", "at the bottom",
    "in the middle", "on the left", "on the right", "background",
  ],
  DESCRIBE: ["there is", "there are", "i can see", "it looks", "wearing"],
};

/**
 * Mnemonika bosqichining inglizcha nomini aniqlab bo'ladigan harakatga
 * bog'laydi. Mos kelmasa `null` — bunday bosqich TEKSHIRILMAYDI.
 * "Eye contact", "Speak clearly" kabi bosqichlar nutq matnidan aniqlanmaydi,
 * shuning uchun ular haqida hech narsa deyilmaydi.
 */
function moveOf(step: string): Move | null {
  const s = step.toLowerCase();
  if (s.includes("position") || s.includes("opinion")) return "OPINION";
  if (s.includes("example")) return "EXAMPLE";
  if (s.includes("reason")) return "REASON";
  if (s.includes("thoughts of")) return "OTHERS";
  if (s.includes("summary") || s.includes("conclusion") || s.includes("next steps")) return "SUMMARY";
  if (s.includes("events") || s.includes("opening") || s.includes("natural flow")) return "SEQUENCE";
  if (s.includes("emotion") || s.includes("feel") || s.includes("mood")) return "EMOTION";
  if (s.includes("location") || s.includes("background")) return "PLACE";
  if (s.includes("describe") || s.includes("what you see") || s.includes("appearance")) return "DESCRIBE";
  return null;
}

function hasMove(move: Move, hay: string): boolean {
  return CUES[move].some((cue) => hay.includes(` ${cue} `));
}

/** Bosqichlar tartibida birinchi yetishmagan (va tekshirsa bo'ladigan) harakat. */
function firstMissingMove(steps: string[], hay: string): Move | null {
  const seen = new Set<Move>();
  for (const step of steps) {
    const move = moveOf(step);
    if (move === null || seen.has(move)) continue;
    seen.add(move);
    if (!hasMove(move, hay)) return move;
  }
  return null;
}

function checkedMoves(steps: string[]): Move[] {
  const out: Move[] = [];
  for (const step of steps) {
    const move = moveOf(step);
    if (move !== null && !out.includes(move)) out.push(move);
  }
  return out;
}

/**
 * Mashqqa xos maslahat banki: `move` → matn. Bo'sh bo'lsa umumiy matn.
 * (Tur `content-types.ts` dagi `StructureTip` bilan bir xil shakl — bu fayl
 * kontent turlariga bog'lanmasligi uchun alohida yozilgan.)
 */
export type TipBankEntry = { move: string; title: string; detail: string };

/**
 * Shu mnemonikada TEKSHIRIB BO'LADIGAN harakatlar ro'yxati.
 *
 * Maslahat generatori shu funksiyadan foydalanadi — shunda faqat Coach
 * haqiqatan aniqlay oladigan bosqichlar uchun matn yaratiladi va ikki joyda
 * bir-biriga mos kelmaydigan ro'yxat paydo bo'lmaydi.
 */
export function checkableMoves(mnemonicSteps: string[]): string[] {
  return checkedMoves(mnemonicSteps);
}

function moveTip(move: Move, bank: TipBankEntry[] = []): CoachTip {
  // Bank birinchi: mavzuga xos matn umumiysidan ustun.
  const custom = bank.find((t) => t.move === move);
  if (custom && custom.detail.trim() !== "") {
    return {
      kind: "STRUCTURE",
      title: custom.title.trim() !== "" ? custom.title : genericMoveTip(move).title,
      detail: custom.detail,
    };
  }
  return genericMoveTip(move);
}

function genericMoveTip(move: Move): CoachTip {
  switch (move) {
    case "OPINION":
      return { kind: "STRUCTURE", title: "Fikringni ayt", detail: 'Javobingni "I think…" yoki "In my opinion…" bilan boshla.' };
    case "EXAMPLE":
      return { kind: "STRUCTURE", title: "Misol keltir", detail: '"For example…" deb bitta misol qo\'sh — javobing ishonchli bo\'ladi.' };
    case "REASON":
      return { kind: "STRUCTURE", title: "Sababini ayt", detail: '"because" so\'zini ishlat — nega shunday deb o\'ylashingni tushuntir.' };
    case "OTHERS":
      return { kind: "STRUCTURE", title: "Boshqalar fikri", detail: '"Some people think…" deb boshqalarning fikrini ham ayt.' };
    case "SUMMARY":
      return { kind: "STRUCTURE", title: "Xulosa qil", detail: 'Oxirida "Finally…" yoki "Overall…" deb qisqa xulosa ayt.' };
    case "SEQUENCE":
      return { kind: "STRUCTURE", title: "Voqealar tartibi", detail: '"First…", "Then…", "After that…" bilan voqealarni tartib bilan ayt.' };
    case "EMOTION":
      return { kind: "STRUCTURE", title: "His-tuyg'u", detail: "O'zingni qanday his qilganingni ayt: happy, excited, scared…" };
    case "PLACE":
      return { kind: "STRUCTURE", title: "Joyni ko'rsat", detail: '"in front of", "behind", "on the left" bilan joyni tasvirla.' };
    case "DESCRIBE":
      return { kind: "STRUCTURE", title: "Tasvirla", detail: '"There is…", "I can see…" deb ko\'rganingni tasvirlab ber.' };
  }
}

const FILLERS = new Set(["um", "uh", "er", "erm", "hmm", "mmm", "ah", "eh"]);

/**
 * Tanigich to'ldiruvchi tovushlarni har doim ham yozmaydi (Web Speech API
 * ularni deyarli tashlab yuboradi), shuning uchun bu qo'shimcha signal —
 * asosiy baholashga ta'sir qilmaydi.
 */
function countFillers(words: string[]): number {
  return words.filter((w) => FILLERS.has(w)).length;
}

const CONNECTORS = ["and", "but", "because", "so", "then", "also", "when", "after", "before"];

function hasConnector(hay: string): boolean {
  return CONNECTORS.some((c) => hay.includes(` ${c} `));
}

/** Mazmunsiz so'zlar — takrorlanishi tabiiy, shuning uchun sanalmaydi. */
const STOPWORDS = new Set([
  "the", "and", "that", "this", "with", "have", "they", "them", "there",
  "very", "like", "about", "would", "because", "when", "what", "your",
  "from", "into", "then", "also", "some", "just", "than", "these", "those",
]);

/** 4+ harfli mazmunli so'z javobning 15%+ ini egallasa — takrorlash. */
function overusedWord(words: string[], wordCount: number): string | null {
  if (wordCount < 15) return null;
  const counts = new Map<string, number>();
  for (const w of words) {
    if (w.length < 4 || STOPWORDS.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  // Teng chiqqanda barqaror natija uchun alifbo tartibi.
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
  if (!top || top[1] < 4) return null;
  return Math.floor((top[1] * 100) / wordCount) >= 15 ? top[0] : null;
}

function praise(
  wordCount: number,
  wpm: number,
  matched: string[],
  keywords: string[],
  steps: string[],
  hay: string,
): CoachTip {
  const checked = checkedMoves(steps);
  let detail: string;
  if (keywords.length > 0 && matched.length === keywords.length) {
    detail = "Barcha kalit so'zlarni ishlatding — zo'r!";
  } else if (checked.length > 0 && checked.every((m) => hasMove(m, hay))) {
    detail = "Javobingni struktura bo'yicha to'liq qurding!";
  } else if (wordCount >= 40) {
    detail = `Juda yaxshi gapirding — ${wordCount} ta so'z!`;
  } else if (wpm >= 60 && wpm <= 120) {
    detail = `Nutq tezliging juda yaxshi (${wpm} so'z/daqiqa).`;
  } else {
    detail = "Boshlaganing yaxshi — yana urinib ko'r, har safar yaxshilanadi.";
  }
  return { kind: "PRAISE", title: "Yaxshi tomoni", detail };
}

/**
 * @param mnemonicSteps mnemonika bosqichlarining inglizcha nomlari
 *   (masalan PETS uchun ["Position", "Example", ...]). Bo'sh bo'lsa
 *   struktura tekshirilmaydi.
 */
export function coachTips(
  transcript: string,
  wordCount: number,
  uniqueWordCount: number,
  wordsPerMinute: number,
  matchedKeywords: string[],
  keywords: string[],
  mnemonicSteps: string[],
  /** Mashqqa xos maslahat banki. Bo'sh bo'lsa umumiy matnlar ishlatiladi. */
  tipBank: TipBankEntry[] = [],
): CoachTip[] {
  const words = splitWords(transcript);
  // Iboralarni so'z chegarasi bilan qidirish uchun bo'shliq bilan o'raymiz.
  const hay = ` ${words.join(" ")} `;

  const out: CoachTip[] = [
    praise(wordCount, wordsPerMinute, matchedKeywords, keywords, mnemonicSteps, hay),
  ];
  const ranked: CoachTip[] = [];

  // 1) Struktura — eng muhimi. Faqat BITTA yetishmagan bosqich aytiladi,
  // aks holda bola bir vaqtda 4 ta narsani tuzatishga urinadi.
  const missingMove = firstMissingMove(mnemonicSteps, hay);
  if (missingMove !== null) ranked.push(moveTip(missingMove, tipBank));

  // 2) Kalit so'zlar
  const missing = keywords.filter((k) => !matchedKeywords.includes(k));
  if (missing.length > 0) {
    ranked.push({
      kind: "KEYWORDS",
      title: "Kalit so'zlar",
      detail: `Bu so'zlarni ham ishlatib ko'r: ${missing.slice(0, 3).join(", ")}.`,
    });
  }

  // 3) Uzunlik
  if (wordCount < 25) {
    ranked.push({
      kind: "LENGTH",
      title: "Kengaytir",
      detail: `Javobing qisqa (${wordCount} so'z). Har bir fikringga bittadan gap qo'shib ko'r.`,
    });
  }

  // 4) Odatlar: to'ldiruvchi so'zlar va takrorlash
  const fillers = countFillers(words);
  if (fillers >= 3) {
    ranked.push({
      kind: "HABIT",
      title: "To'xtashlar",
      detail: `"um", "uh" kabi tovushlarni ${fillers} marta ishlatding — o'rniga bir soniya jim tur.`,
    });
  }
  const overused = overusedWord(words, wordCount);
  if (overused !== null) {
    ranked.push({
      kind: "VOCABULARY",
      title: "Takrorlash",
      detail: `"${overused}" so'zini juda ko'p takrorlading — unga sinonim topib ko'r.`,
    });
  }
  if (wordCount >= 12 && !hasConnector(hay)) {
    ranked.push({
      kind: "HABIT",
      title: "Gaplarni bog'la",
      detail: 'Gaplaringni "and", "but", "because" bilan bog\'la — nutqing ravonroq bo\'ladi.',
    });
  }

  // 5) Tezlik
  if (wordsPerMinute < 40) {
    ranked.push({ kind: "FLUENCY", title: "Tezlik", detail: "Biroz tezroq gapir — uzoq to'xtamaslikka harakat qil." });
  } else if (wordsPerMinute > 140) {
    ranked.push({ kind: "FLUENCY", title: "Tezlik", detail: "Sekinroq gapir — har bir so'z aniq eshitilsin." });
  }

  // 6) So'z boyligi
  if (uniqueWordCount < 15) {
    ranked.push({
      kind: "VOCABULARY",
      title: "So'z boyligi",
      detail: "Turli xil so'zlardan foydalan — bir xil so'zlarni takrorlama.",
    });
  }

  // Bola bir vaqtda 3 tadan ko'p narsani tuzata olmaydi.
  return [...out, ...ranked.slice(0, MAX_TIPS)];
}

/** Grammatika hisoboti kelganda qo'shiladigan maslahat. */
export function grammarTip(issueCount: number): CoachTip {
  return issueCount === 0
    ? { kind: "GRAMMAR", title: "Grammatika", detail: "Grammatik xatolar topilmadi — juda yaxshi!" }
    : {
        kind: "GRAMMAR",
        title: "Grammatika",
        detail: `Grammatikada ${issueCount} ta e'tibor talab qiladigan joy bor.`,
      };
}
