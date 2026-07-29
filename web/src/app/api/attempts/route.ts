import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Token APK ichida — uni ajratib olish mumkin, shuning uchun token o'zi
 * yetarli himoya emas. Chegara: ilova ochilganda navbatdagi natijalarni
 * ketma-ket yuborishi mumkin (`AttemptUploader.flushPending()`), sinf esa bitta
 * IP'dan chiqadi — shuning uchun web'nikidan kengroq.
 */
const RULE = { limit: 300, windowMs: 60 * 60 * 1000 };

/**
 * Ilova o'quvchi natijasini shu yerga yuboradi (o'qituvchi paneli uchun).
 * Himoya: `x-ingest-token` sarlavhasi ATTEMPTS_INGEST_TOKEN bilan mos kelishi kerak.
 */
export async function POST(req: NextRequest) {
  const limit = rateLimit(`attempts:${clientKey(req)}`, RULE);
  if (!limit.ok) return tooManyRequests(limit, "Juda ko'p urinish yuborildi");

  const expected = process.env.ATTEMPTS_INGEST_TOKEN;
  const got = req.headers.get("x-ingest-token");
  if (!expected || got !== expected) {
    return NextResponse.json({ error: "Token yaroqsiz" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON yaroqsiz" }, { status: 400 });
  }

  const studentId = String(body.studentId ?? "anon").slice(0, 128);
  const studentName = String(body.studentName ?? "").trim().slice(0, 120);
  const classGroup = String(body.classGroup ?? "").trim().slice(0, 40);
  const num = (v: unknown, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : d;
  };

  try {
    // O'quvchini ro'yxatga olamiz. Ilova ism yuborgan bo'lsa — mavjud yozuvni
    // yangilaymiz (o'quvchi profilda ismini o'zgartirgan bo'lishi mumkin).
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
      moduleId: String(body.moduleId ?? ""),
      exerciseId: String(body.exerciseId ?? ""),
      exerciseTitle: String(body.exerciseTitle ?? ""),
      overallScore: num(body.overallScore),
      grammarScore: body.grammarScore == null ? null : num(body.grammarScore),
      wordsPerMinute: num(body.wordsPerMinute),
      wordCount: num(body.wordCount),
      uniqueWordCount: num(body.uniqueWordCount),
      durationSec: num(body.durationSec),
      keywordCoverage: num(body.keywordCoverage),
      transcript: String(body.transcript ?? "").slice(0, 4000),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Saqlanmadi" }, { status: 500 });
  }
}
