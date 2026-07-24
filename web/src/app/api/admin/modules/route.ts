import { NextResponse, type NextRequest } from "next/server";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(schema.modules).orderBy(asc(schema.modules.sortOrder));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.id || !b.type || !b.titleUz) {
    return NextResponse.json({ error: "id, type, titleUz kerak" }, { status: 400 });
  }
  try {
    await db.insert(schema.modules).values({
      id: String(b.id),
      type: String(b.type),
      titleUz: String(b.titleUz),
      titleEn: String(b.titleEn ?? ""),
      descriptionUz: String(b.descriptionUz ?? ""),
      emoji: String(b.emoji ?? ""),
      sortOrder: Number(b.sortOrder ?? 0),
      enabled: b.enabled !== false,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Yaratilmadi (id band bo'lishi mumkin)" }, { status: 400 });
  }
}
