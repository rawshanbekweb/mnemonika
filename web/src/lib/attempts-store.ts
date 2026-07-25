"use client";

/**
 * O'quvchining natijalari — brauzerda (localStorage) saqlanadi.
 *
 * Nega serverdan o'qimaymiz? Natijalar serverga ham yuboriladi (o'qituvchi paneli
 * uchun), lekin ularni qaytib o'qish uchun autentifikatsiyasiz endpoint kerak
 * bo'lardi va u bolaning ballari va transkriptlarini ID'ni bilgan har kimga
 * ochib qo'yardi. Android ham progressni mahalliy bazadan hisoblaydi —
 * shu bilan ikkala platforma izchil qoladi.
 */

export type StoredAttempt = {
  id: string;
  moduleId: string;
  exerciseId: string;
  exerciseTitle: string;
  timestamp: number;
  overallScore: number;
  wordCount: number;
  uniqueWordCount: number;
  wordsPerMinute: number;
  durationSec: number;
  keywordCoverage: number;
  grammarScore: number | null;
};

const KEY = "speakup_attempts";

/** Cheksiz o'smasligi uchun eng yangi shuncha urinish saqlanadi. */
const MAX_ATTEMPTS = 500;

export function loadAttempts(): StoredAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredAttempt[]) : [];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: Omit<StoredAttempt, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;
  const entry: StoredAttempt = {
    ...attempt,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  try {
    const all = [entry, ...loadAttempts()].slice(0, MAX_ATTEMPTS);
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // localStorage to'lgan yoki o'chirilgan bo'lsa ham mashq buzilmasin.
  }
}

export type ExerciseStat = {
  exerciseId: string;
  attempts: number;
  bestScore: number;
  lastAt: number;
};

/**
 * Mashq bo'yicha jamlanma — modullar ro'yxatida "bajarildi / eng yaxshi ball"
 * ko'rsatish uchun. Web'ga xos: Android bu ma'lumotni Room'dan boshqacha oladi.
 */
export function exerciseStats(attempts: StoredAttempt[]): Map<string, ExerciseStat> {
  const out = new Map<string, ExerciseStat>();
  for (const a of attempts) {
    const prev = out.get(a.exerciseId);
    if (!prev) {
      out.set(a.exerciseId, {
        exerciseId: a.exerciseId,
        attempts: 1,
        bestScore: a.overallScore,
        lastAt: a.timestamp,
      });
      continue;
    }
    prev.attempts++;
    if (a.overallScore > prev.bestScore) prev.bestScore = a.overallScore;
    if (a.timestamp > prev.lastAt) prev.lastAt = a.timestamp;
  }
  return out;
}

export type ModuleStat = {
  moduleId: string;
  attempts: number;
  avgScore: number;
  bestScore: number;
};

/** Modul bo'yicha jamlanma (Android'dagi ModuleStat bilan bir xil). */
export function moduleStats(attempts: StoredAttempt[]): ModuleStat[] {
  const byModule = new Map<string, number[]>();
  for (const a of attempts) {
    const list = byModule.get(a.moduleId) ?? [];
    list.push(a.overallScore);
    byModule.set(a.moduleId, list);
  }
  return [...byModule.entries()].map(([moduleId, scores]) => ({
    moduleId,
    attempts: scores.length,
    avgScore: Math.floor(scores.reduce((s, n) => s + n, 0) / scores.length),
    bestScore: Math.max(...scores),
  }));
}
