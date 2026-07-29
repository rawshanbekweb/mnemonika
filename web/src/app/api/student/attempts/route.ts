import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Bitta bola bir mashqni ~1 daqiqada bajaradi, ya'ni soatiga 30 urinish ham
 * juda saxiy. Sinfda 30 bola bitta maktab Wi-Fi'sidan (bir IP) kirishi mumkin,
 * shuning uchun chegara IP bo'yicha keng: 120/soat.
 */
const RULE = { limit: 120, windowMs: 60 * 60 * 1000 };

/**
 * Web o'quvchi ilovasidan natija qabul qiladi.
 *
 * Nega alohida route? `/api/attempts` `x-ingest-token` talab qiladi, uni esa
 * brauzer JS'ida saqlab bo'lmaydi — kim ochsa ko'radi. Shuning uchun web uchun
 * tokensiz route. Himoya darajasi APK'nikidan yomonroq emas (APK ichidagi
 * token ham ajratib olinishi mumkin), lekin sirni oshkor qilmaydi.
 */
export async function POST(req: NextRequest) {
  // Tekshiruv bazaga tegishdan OLDIN — cheklovning maqsadi aynan Neon'ni
  // himoya qilish.
  const limit = rateLimit(`student-attempts:${clientKey(req)}`, RULE);
  if (!limit.ok) return tooManyRequests(limit, "Juda ko'p urinish yuborildi");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON yaroqsiz" }, { status: 400 });
  }

  const studentId = String(body.studentId ?? "").slice(0, 128);
  // Faqat shu ilova yaratgan ID'larni qabul qilamiz — tasodifiy axlatni to'sadi.
  if (!studentId.startsWith("web_")) {
    return NextResponse.json({ error: "studentId yaroqsiz" }, { status: 400 });
  }

  const studentName = String(body.studentName ?? "").trim().slice(0, 120);
  const classGroup = String(body.classGroup ?? "").trim().slice(0, 40);

  const num = (v: unknown, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : d;
  };
  const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

  try {
    const insert = db
      .insert(schema.students)
      .values({ id: studentId, name: studentName, classGroup });

    await (studentName
      ? insert.onConflictDoUpdate({
          target: schema.students.id,
          set: { name: studentName, classGroup },
        })
      : insert.onConflictDoNothing());

    await db.insert(schema.attempts).values({
      studentId,
      moduleId: String(body.moduleId ?? "").slice(0, 128),
      exerciseId: String(body.exerciseId ?? "").slice(0, 128),
      exerciseTitle: String(body.exerciseTitle ?? "").slice(0, 200),
      overallScore: clamp(num(body.overallScore), 0, 100),
      grammarScore: body.grammarScore == null ? null : clamp(num(body.grammarScore), 0, 100),
      wordsPerMinute: clamp(num(body.wordsPerMinute), 0, 10_000),
      wordCount: clamp(num(body.wordCount), 0, 100_000),
      uniqueWordCount: clamp(num(body.uniqueWordCount), 0, 100_000),
      durationSec: clamp(num(body.durationSec), 0, 86_400),
      keywordCoverage: clamp(num(body.keywordCoverage), 0, 100),
      transcript: String(body.transcript ?? "").slice(0, 4000),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Saqlanmadi" }, { status: 500 });
  }
}
