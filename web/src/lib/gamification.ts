// Android'dagi analysis/Gamification.kt ning aynan porti.
//
// MUHIM: Kotlin'da Int / Int butun sonli bo'lish — shuning uchun bu yerda ham
// Math.floor. Ikkala platformada bir xil daraja va XP chiqishi kerak.
// Bu ikki fayl doim birga o'zgartiriladi.

import type { StoredAttempt } from "./attempts-store";

export type Badge = {
  id: string;
  emoji: string;
  title: string;
  hint: string;
  unlocked: boolean;
};

export type GameStats = {
  totalXp: number;
  level: number;
  levelTitle: string;
  xpInLevel: number;
  xpPerLevel: number;
  streakDays: number;
  bestStreak: number;
  practicedToday: boolean;
  totalAttempts: number;
  totalWords: number;
  badges: Badge[];
  levelProgress: number;
  unlockedBadges: number;
};

const XP_PER_LEVEL = 400;

const LEVEL_TITLES = [
  "Yangi boshlovchi",
  "Mashqchi",
  "Suhbatdosh",
  "Notiq",
  "Usta notiq",
  "Chempion",
];

/** Mahalliy vaqt mintaqasidagi kun raqami (1970-01-01 dan boshlab). */
function dayIndex(timestamp: number): number {
  // getTimezoneOffset shu lahza uchun (DST hisobga olingan holda) daqiqada qaytaradi.
  const offset = -new Date(timestamp).getTimezoneOffset() * 60_000;
  return Math.floor((timestamp + offset) / 86_400_000);
}

/**
 * Joriy seriya: bugundan (yoki kechadan — bugun hali mashq qilmagan bo'lsa)
 * orqaga qarab uzluksiz kunlar soni.
 */
function currentStreak(days: Set<number>, today: number): number {
  let cursor: number;
  if (days.has(today)) cursor = today;
  else if (days.has(today - 1)) cursor = today - 1;
  else return 0;

  let count = 0;
  while (days.has(cursor)) {
    count++;
    cursor--;
  }
  return count;
}

/** Eng uzun uzluksiz kunlar seriyasi (butun tarix bo'yicha). */
function bestStreak(days: Set<number>): number {
  if (days.size === 0) return 0;
  const sorted = [...days].sort((a, b) => a - b);
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

export function computeGameStats(
  attempts: StoredAttempt[],
  moduleCount: number,
): GameStats {
  const totalXp = attempts.reduce((s, a) => s + a.overallScore, 0);
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXp % XP_PER_LEVEL;

  const days = new Set(attempts.map((a) => dayIndex(a.timestamp)));
  const today = dayIndex(Date.now());
  const streak = currentStreak(days, today);
  const best = bestStreak(days);

  const totalWords = attempts.reduce((s, a) => s + a.wordCount, 0);
  const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.overallScore)) : 0;
  const modulesTried = new Set(attempts.map((a) => a.moduleId)).size;

  const badges: Badge[] = [
    { id: "first", emoji: "🌟", title: "Birinchi qadam", hint: "Birinchi mashqni bajar", unlocked: attempts.length > 0 },
    { id: "five", emoji: "🔥", title: "5 ta mashq", hint: "5 ta mashq bajar", unlocked: attempts.length >= 5 },
    { id: "twenty", emoji: "💪", title: "20 ta mashq", hint: "20 ta mashq bajar", unlocked: attempts.length >= 20 },
    { id: "score80", emoji: "🏆", title: "Zo'r natija", hint: "80+ ball to'pla", unlocked: bestScore >= 80 },
    { id: "score95", emoji: "👑", title: "Mukammal", hint: "95+ ball to'pla", unlocked: bestScore >= 95 },
    { id: "streak3", emoji: "📅", title: "3 kun ketma-ket", hint: "3 kun to'xtamay mashq qil", unlocked: best >= 3 },
    { id: "streak7", emoji: "🗓️", title: "Bir hafta", hint: "7 kun to'xtamay mashq qil", unlocked: best >= 7 },
    { id: "explorer", emoji: "🧭", title: "Kashfiyotchi", hint: "Barcha modullarni sinab ko'r", unlocked: moduleCount > 0 && modulesTried >= moduleCount },
    { id: "talker", emoji: "💬", title: "500 so'z", hint: "Jami 500 ta so'z gapir", unlocked: totalWords >= 500 },
  ];

  return {
    totalXp,
    level,
    levelTitle: LEVEL_TITLES[level - 1] ?? LEVEL_TITLES[LEVEL_TITLES.length - 1],
    xpInLevel,
    xpPerLevel: XP_PER_LEVEL,
    streakDays: streak,
    bestStreak: best,
    practicedToday: days.has(today),
    totalAttempts: attempts.length,
    totalWords,
    badges,
    levelProgress: xpInLevel / XP_PER_LEVEL,
    unlockedBadges: badges.filter((b) => b.unlocked).length,
  };
}
