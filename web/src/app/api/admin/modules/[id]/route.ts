import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const b = await req.json();
  await db
    .update(schema.modules)
    .set({
      type: String(b.type),
      titleUz: String(b.titleUz),
      titleEn: String(b.titleEn ?? ""),
      descriptionUz: String(b.descriptionUz ?? ""),
      emoji: String(b.emoji ?? ""),
      sortOrder: Number(b.sortOrder ?? 0),
      enabled: b.enabled !== false,
    })
    .where(eq(schema.modules.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await db.delete(schema.modules).where(eq(schema.modules.id, id));
  return NextResponse.json({ ok: true });
}
