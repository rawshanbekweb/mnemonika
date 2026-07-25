import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * LanguageTool ochiq API'siga proxy (Android'dagi GrammarChecker.kt bilan bir xil mantiq).
 *
 * Nega proxy? Brauzerdan to'g'ridan-to'g'ri chaqirsak CORS to'sadi.
 * Xatolik bo'lsa `null` qaytadi — baholash grammatikasiz davom etadi.
 */
const API_URL = "https://api.languagetool.org/v2/check";

// Bu qiymatlar Android'dagi GrammarChecker.kt bilan AYNAN bir xil bo'lishi shart —
// aks holda bir xil nutq ikki platformada turli grammatika balli oladi.
const MIN_WORDS = 10;
const PENALTY_PER_ERROR_PCT = 3;

type LtMatch = {
  message?: string;
  shortMessage?: string;
  replacements?: { value?: string }[];
};

export async function POST(req: NextRequest) {
  let body: { text?: string; wordCount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(null);
  }

  const text = String(body.text ?? "").slice(0, 4000);
  const wordCount = Number(body.wordCount ?? 0);
  // Qisqa javobda bitta xato ham foizni keskin oshiradi — baholamaymiz.
  if (!text.trim() || !Number.isFinite(wordCount) || wordCount < MIN_WORDS) {
    return NextResponse.json(null);
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({ text, language: "en-US", level: "default" }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return NextResponse.json(null);

    const data = (await res.json()) as { matches?: LtMatch[] };
    const matches = data.matches ?? [];
    const count = matches.length;

    const issues = matches.slice(0, 5).map((m) => {
      const message = (m.shortMessage || m.message || "").trim();
      const suggestion = m.replacements?.[0]?.value ?? "";
      return suggestion ? `${message} → "${suggestion}"` : message;
    });

    // Har 100 so'zga to'g'ri keladigan xato asosida ball (Kotlin bilan bir xil).
    const errorsPer100 = (count * 100) / wordCount;
    const score = Math.min(
      Math.max(Math.trunc(100 - errorsPer100 * PENALTY_PER_ERROR_PCT), 0),
      100,
    );

    return NextResponse.json({ score, issueCount: count, issues });
  } catch {
    return NextResponse.json(null);
  }
}
