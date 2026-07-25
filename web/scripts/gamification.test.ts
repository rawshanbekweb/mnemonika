// Gamifikatsiya testi.
//
// Ishga tushirish:  npm run test:gamification
//
// Seriya hisobi nozik: kun chegaralari mahalliy vaqt mintaqasida hisoblanadi,
// "bugun mashq qilmagan, lekin kecha qilgan" holati seriyani uzmasligi kerak,
// va bu mantiq Android'dagi analysis/Gamification.kt bilan bir xil bo'lishi shart.

import { computeGameStats } from "../src/lib/gamification";
import type { StoredAttempt } from "../src/lib/attempts-store";

const DAY = 86_400_000;

/** Bugundan `daysAgo` kun oldin bajarilgan urinish (mahalliy tush payti). */
function attemptDaysAgo(daysAgo: number, score = 50, moduleId = "m1"): StoredAttempt {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  return {
    id: `a${daysAgo}-${Math.random()}`,
    moduleId,
    exerciseId: "e1",
    exerciseTitle: "Test",
    timestamp: d.getTime() - daysAgo * DAY,
    overallScore: score,
    wordCount: 10,
    uniqueWordCount: 8,
    wordsPerMinute: 60,
    durationSec: 10,
    keywordCoverage: 50,
    grammarScore: null,
  };
}

let failed = 0;
function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`  ok    ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}: kutilgan=${JSON.stringify(expected)} olingan=${JSON.stringify(actual)}`);
  }
}

// ── Seriya ──────────────────────────────────────────────────────
check("bo'sh ro'yxat: seriya 0", computeGameStats([], 3).streakDays, 0);

check(
  "bugun mashq qilgan: seriya 1",
  computeGameStats([attemptDaysAgo(0)], 3).streakDays,
  1,
);

check(
  "bugun+kecha+avvalgi kun: seriya 3",
  computeGameStats([attemptDaysAgo(0), attemptDaysAgo(1), attemptDaysAgo(2)], 3).streakDays,
  3,
);

check(
  "bugun yo'q, kecha bor: seriya saqlanadi (1)",
  computeGameStats([attemptDaysAgo(1)], 3).streakDays,
  1,
);

check(
  "2 kun oldin oxirgi: seriya uzilgan (0)",
  computeGameStats([attemptDaysAgo(2), attemptDaysAgo(3)], 3).streakDays,
  0,
);

check(
  "bir kunda bir necha urinish: seriya 1",
  computeGameStats([attemptDaysAgo(0), attemptDaysAgo(0), attemptDaysAgo(0)], 3).streakDays,
  1,
);

check(
  "uzilgan tarix, eng uzun seriya 3",
  computeGameStats(
    [attemptDaysAgo(10), attemptDaysAgo(11), attemptDaysAgo(12), attemptDaysAgo(20)],
    3,
  ).bestStreak,
  3,
);

// ── XP va daraja (Kotlin bilan bir xil butun sonli bo'lish) ──────
check("400 XP dan kam: 1-daraja", computeGameStats([attemptDaysAgo(0, 100)], 3).level, 1);

check(
  "aynan 400 XP: 2-daraja",
  computeGameStats(Array.from({ length: 4 }, () => attemptDaysAgo(0, 100)), 3).level,
  2,
);

check(
  "450 XP: daraja ichida 50 XP",
  computeGameStats(
    [...Array.from({ length: 4 }, () => attemptDaysAgo(0, 100)), attemptDaysAgo(0, 50)],
    3,
  ).xpInLevel,
  50,
);

// ── Nishonlar ───────────────────────────────────────────────────
const explorer = (ids: string[]) =>
  computeGameStats(
    ids.map((m) => attemptDaysAgo(0, 50, m)),
    3,
  ).badges.find((b) => b.id === "explorer")!.unlocked;

check("kashfiyotchi: 2/3 modul — yopiq", explorer(["m1", "m2"]), false);
check("kashfiyotchi: 3/3 modul — ochiq", explorer(["m1", "m2", "m3"]), true);

check(
  "mukammal nishon: 95+ ball",
  computeGameStats([attemptDaysAgo(0, 95)], 3).badges.find((b) => b.id === "score95")!.unlocked,
  true,
);

console.log(failed === 0 ? "\nHammasi o'tdi" : `\n${failed} ta test yiqildi`);
if (failed > 0) process.exit(1);
