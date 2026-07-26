import { NextResponse, type NextRequest } from "next/server";
import { and, desc, gte, inArray } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

/** Bir so'rovda ko'riladigan urinishlar chegarasi (jamlanmalar shundan hisoblanadi). */
const MAX_ATTEMPTS = 500;

/**
 * O'qituvchi paneli uchun umumlashtirilgan statistika.
 *
 * `?class=5-A` — faqat shu sinf, `?days=7` — faqat oxirgi 7 kun.
 * MUHIM: ikkala filtr ham SQL darajasida qo'llanadi. Avval oxirgi 500 ta
 * urinishni olib, keyin xotirada filtrlash sinf statistikasini buzadi —
 * faol sinf boshqalarni ro'yxatdan siqib chiqaradi.
 */
export async function GET(req: NextRequest) {
  const classGroup = (req.nextUrl.searchParams.get("class") ?? "").trim();
  const days = Number(req.nextUrl.searchParams.get("days") ?? "0");

  const [students, modules] = await Promise.all([
    db.select().from(schema.students),
    db.select().from(schema.modules),
  ]);

  const studentById = new Map(students.map((s) => [s.id, s]));
  const moduleTitleById = new Map(modules.map((m) => [m.id, m.titleUz]));
  // Dropdown to'liq bo'lishi uchun sinflar ro'yxati filtrdan qat'i nazar qaytadi.
  const classes = [...new Set(students.map((s) => s.classGroup).filter(Boolean))].sort();

  const conds = [];
  if (Number.isFinite(days) && days > 0) {
    conds.push(gte(schema.attempts.createdAt, new Date(Date.now() - days * 86_400_000)));
  }

  // Bo'sh sinf: inArray([]) SQL xatosi beradi, shuning uchun so'rovni umuman qilmaymiz.
  let noStudentsInClass = false;
  if (classGroup) {
    const ids = students.filter((s) => s.classGroup === classGroup).map((s) => s.id);
    if (ids.length === 0) noStudentsInClass = true;
    else conds.push(inArray(schema.attempts.studentId, ids));
  }

  const recent = noStudentsInClass
    ? []
    : await db
        .select()
        .from(schema.attempts)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(schema.attempts.createdAt))
        .limit(MAX_ATTEMPTS);

  const avg = (nums: number[]) =>
    nums.length ? Math.round(nums.reduce((s, n) => s + n, 0) / nums.length) : 0;

  // Modul bo'yicha o'rtacha ball.
  const byModuleMap = new Map<string, number[]>();
  for (const a of recent) {
    const list = byModuleMap.get(a.moduleId) ?? [];
    list.push(a.overallScore);
    byModuleMap.set(a.moduleId, list);
  }
  const byModule = [...byModuleMap.entries()]
    .map(([moduleId, scores]) => ({
      moduleId,
      // Modul o'chirilgan bo'lsa ham urinishlar qoladi — shunda ID ko'rsatiladi.
      moduleTitle: moduleTitleById.get(moduleId) ?? moduleId,
      attempts: scores.length,
      avgScore: avg(scores),
    }))
    .sort((a, b) => b.attempts - a.attempts);

  // O'quvchi bo'yicha jamlanma — o'qituvchi kim qanday ishlayotganini ko'radi.
  const byStudentMap = new Map<
    string,
    { scores: number[]; words: number; lastActive: string }
  >();
  for (const a of recent) {
    const entry = byStudentMap.get(a.studentId) ?? {
      scores: [],
      words: 0,
      lastActive: a.createdAt as unknown as string,
    };
    entry.scores.push(a.overallScore);
    entry.words += a.wordCount;
    byStudentMap.set(a.studentId, entry);
  }
  const byStudent = [...byStudentMap.entries()]
    .map(([studentId, e]) => ({
      studentId,
      name: studentById.get(studentId)?.name || "",
      classGroup: studentById.get(studentId)?.classGroup || "",
      attempts: e.scores.length,
      avgScore: avg(e.scores),
      bestScore: Math.max(...e.scores),
      words: e.words,
      lastActive: e.lastActive,
    }))
    .sort((a, b) => b.attempts - a.attempts);

  return NextResponse.json({
    totalAttempts: recent.length,
    totalStudents: byStudentMap.size,
    avgScore: avg(recent.map((a) => a.overallScore)),
    avgWpm: avg(recent.map((a) => a.wordsPerMinute)),
    classes,
    byModule,
    byStudent,
    // Ro'yxatda ID o'rniga ism ko'rinishi uchun har bir yozuvga ism qo'shamiz.
    recent: recent.slice(0, 100).map((a) => ({
      ...a,
      studentName: studentById.get(a.studentId)?.name || "",
      classGroup: studentById.get(a.studentId)?.classGroup || "",
      moduleTitle: moduleTitleById.get(a.moduleId) ?? a.moduleId,
    })),
  });
}
