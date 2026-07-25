import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

/** O'qituvchi paneli uchun umumlashtirilgan statistika. */
export async function GET() {
  const [recent, students] = await Promise.all([
    db
      .select()
      .from(schema.attempts)
      .orderBy(desc(schema.attempts.createdAt))
      .limit(500),
    db.select().from(schema.students),
  ]);

  // O'quvchi ID → ism/sinf (ilova profilida kiritilgan).
  const studentById = new Map(students.map((s) => [s.id, s]));

  const totalAttempts = recent.length;
  const avg = (nums: number[]) =>
    nums.length ? Math.round(nums.reduce((s, n) => s + n, 0) / nums.length) : 0;

  const avgScore = avg(recent.map((a) => a.overallScore));
  const avgWpm = avg(recent.map((a) => a.wordsPerMinute));

  // Modul bo'yicha o'rtacha ball.
  const byModuleMap = new Map<string, number[]>();
  for (const a of recent) {
    const list = byModuleMap.get(a.moduleId) ?? [];
    list.push(a.overallScore);
    byModuleMap.set(a.moduleId, list);
  }
  const byModule = [...byModuleMap.entries()].map(([moduleId, scores]) => ({
    moduleId,
    attempts: scores.length,
    avgScore: avg(scores),
  }));

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
    totalAttempts,
    totalStudents: byStudentMap.size,
    avgScore,
    avgWpm,
    byModule,
    byStudent,
    // Ro'yxatda ID o'rniga ism ko'rinishi uchun har bir yozuvga ism qo'shamiz.
    recent: recent.slice(0, 100).map((a) => ({
      ...a,
      studentName: studentById.get(a.studentId)?.name || "",
      classGroup: studentById.get(a.studentId)?.classGroup || "",
    })),
  });
}
