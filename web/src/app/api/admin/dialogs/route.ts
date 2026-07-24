import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { asStringArray, asSteps } from "@/lib/parse";

export const dynamic = "force-dynamic";

type TurnInput = { characterLine?: string; studentHint?: string; expectedKeywords?: unknown };

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.id || !b.moduleId || !b.title) {
    return NextResponse.json({ error: "id, moduleId, title kerak" }, { status: 400 });
  }
  try {
    await db.insert(schema.dialogs).values({
      id: String(b.id),
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
    });

    const turns: TurnInput[] = Array.isArray(b.turns) ? b.turns : [];
    let order = 0;
    for (const t of turns) {
      await db.insert(schema.dialogTurns).values({
        dialogId: String(b.id),
        characterLine: String(t.characterLine ?? ""),
        studentHint: String(t.studentHint ?? ""),
        expectedKeywords: asStringArray(t.expectedKeywords),
        sortOrder: order++,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Yaratilmadi (id band bo'lishi mumkin)" }, { status: 400 });
  }
}
