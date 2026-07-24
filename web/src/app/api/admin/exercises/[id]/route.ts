import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { asStringArray, asSteps } from "@/lib/parse";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const b = await req.json();
  await db
    .update(schema.exercises)
    .set({
      moduleId: String(b.moduleId),
      topic: String(b.topic ?? ""),
      title: String(b.title),
      acronym: String(b.acronym ?? ""),
      mnemonicSteps: asSteps(b.mnemonicSteps),
      prompts: asStringArray(b.prompts),
      keywords: asStringArray(b.keywords),
      visuals: asStringArray(b.visuals),
      timeLimitSec: Number(b.timeLimitSec ?? 60),
      sortOrder: Number(b.sortOrder ?? 0),
    })
    .where(eq(schema.exercises.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await db.delete(schema.exercises).where(eq(schema.exercises.id, id));
  return NextResponse.json({ ok: true });
}
