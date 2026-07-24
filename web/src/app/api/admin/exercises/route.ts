import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { asStringArray, asSteps } from "@/lib/parse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.id || !b.moduleId || !b.title) {
    return NextResponse.json({ error: "id, moduleId, title kerak" }, { status: 400 });
  }
  try {
    await db.insert(schema.exercises).values({
      id: String(b.id),
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
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Yaratilmadi (id band bo'lishi mumkin)" }, { status: 400 });
  }
}
