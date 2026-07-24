import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { asStringArray, asSteps } from "@/lib/parse";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
type TurnInput = { characterLine?: string; studentHint?: string; expectedKeywords?: unknown };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const b = await req.json();

  await db
    .update(schema.dialogs)
    .set({
      moduleId: String(b.moduleId),
      topic: String(b.topic ?? ""),
      title: String(b.title),
      characterName: String(b.characterName ?? ""),
      characterEmoji: String(b.characterEmoji ?? ""),
      intro: String(b.intro ?? ""),
      acronym: String(b.acronym ?? ""),
      mnemonicSteps: asSteps(b.mnemonicSteps),
      visuals: asStringArray(b.visuals),
      sortOrder: Number(b.sortOrder ?? 0),
    })
    .where(eq(schema.dialogs.id, id));

  // Turns'ni to'liq almashtiramiz.
  await db.delete(schema.dialogTurns).where(eq(schema.dialogTurns.dialogId, id));
  const turns: TurnInput[] = Array.isArray(b.turns) ? b.turns : [];
  let order = 0;
  for (const t of turns) {
    await db.insert(schema.dialogTurns).values({
      dialogId: id,
      characterLine: String(t.characterLine ?? ""),
      studentHint: String(t.studentHint ?? ""),
      expectedKeywords: asStringArray(t.expectedKeywords),
      sortOrder: order++,
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await db.delete(schema.dialogs).where(eq(schema.dialogs.id, id));
  return NextResponse.json({ ok: true });
}
