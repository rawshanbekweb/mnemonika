import { NextResponse, type NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Bitta o'quvchining kartochkasi: profil + urinishlar tarixi (transkript bilan). */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  const [[student], attempts, modules] = await Promise.all([
    db.select().from(schema.students).where(eq(schema.students.id, id)).limit(1),
    db
      .select()
      .from(schema.attempts)
      .where(eq(schema.attempts.studentId, id))
      .orderBy(desc(schema.attempts.createdAt))
      .limit(200),
    db.select().from(schema.modules),
  ]);

  // Profil yo'q bo'lishi mumkin (urinish yuborilgan, lekin ism kiritilmagan) —
  // urinishlar baribir ko'rsatiladi.
  if (!student && attempts.length === 0) {
    return NextResponse.json({ error: "O'quvchi topilmadi" }, { status: 404 });
  }

  const moduleTitleById = new Map(modules.map((m) => [m.id, m.titleUz]));

  return NextResponse.json({
    student: {
      id,
      name: student?.name ?? "",
      classGroup: student?.classGroup ?? "",
    },
    attempts: attempts.map((a) => ({
      ...a,
      moduleTitle: moduleTitleById.get(a.moduleId) ?? a.moduleId,
    })),
  });
}
