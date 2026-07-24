import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

/** O'qituvchi paneli uchun umumlashtirilgan statistika. */
export async function GET() {
  const recent = await db
    .select()
    .from(schema.attempts)
    .orderBy(desc(schema.attempts.createdAt))
    .limit(500);

  const totalAttempts = recent.length;
  const students = new Set(recent.map((a) => a.studentId));
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

  return NextResponse.json({
    totalAttempts,
    totalStudents: students.size,
    avgScore,
    avgWpm,
    byModule,
    recent: recent.slice(0, 100),
  });
}
