import { NextResponse, type NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(schema.media).orderBy(desc(schema.media.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN o'rnatilmagan (Vercel Blob sozlang)" },
      { status: 400 },
    );
  }
  const form = await req.formData();
  const file = form.get("file");
  const alt = String(form.get("alt") ?? "");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fayl kerak" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`content/${Date.now()}-${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  const [row] = await db
    .insert(schema.media)
    .values({ url: blob.url, alt, pathname: blob.pathname })
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id kerak" }, { status: 400 });

  const [row] = await db.select().from(schema.media).where(eq(schema.media.id, id)).limit(1);
  if (row) {
    try {
      if (process.env.BLOB_READ_WRITE_TOKEN) await del(row.url);
    } catch {
      // blob o'chmasa ham DB yozuvini o'chiramiz
    }
    await db.delete(schema.media).where(eq(schema.media.id, id));
  }
  return NextResponse.json({ ok: true });
}
