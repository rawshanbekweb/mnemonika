import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

/** Admin panel uchun barcha kontent (o'chirilganlar ham) — bitta so'rovda. */
export async function GET() {
  const [modules, exercises, dialogs, turns, version] = await Promise.all([
    db.select().from(schema.modules).orderBy(asc(schema.modules.sortOrder)),
    db.select().from(schema.exercises).orderBy(asc(schema.exercises.sortOrder)),
    db.select().from(schema.dialogs).orderBy(asc(schema.dialogs.sortOrder)),
    db.select().from(schema.dialogTurns).orderBy(asc(schema.dialogTurns.sortOrder)),
    db.select().from(schema.appMeta).limit(1),
  ]);
  return NextResponse.json({
    modules,
    exercises,
    dialogs,
    turns,
    version: version[0]?.contentVersion ?? 1,
    publishedAt: version[0]?.publishedAt ?? null,
  });
}
