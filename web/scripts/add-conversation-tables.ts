// `conversations` + `conversation_nodes` jadvallarini yaratadi (idempotent).
//
// Ishga tushirish (web/ papkasidan):  npm run db:conversations
//
// Nega drizzle-kit emas — izoh `add-audio-table.ts` da (loyihada migratsiya
// tarixi yuritilmaydi). Bu ham faqat QO'SHADI, hech narsani o'chirmaydi.
//
// Shu bilan birga "Erkin suhbat" moduli ham yaratiladi — suhbatlar biror
// modulga tegishli bo'lishi shart, aks holda `buildContentPack()` ularni
// ko'rmaydi.

import "../src/db/load-env";
import { sql } from "drizzle-orm";
import { db, schema } from "../src/db";

/** Erkin suhbat moduli — mavjud 5 talikdan keyin turadi. */
const MODULE = {
  id: "free_talk",
  type: "free_talk",
  titleUz: "Erkin suhbat",
  titleEn: "Free Talk",
  descriptionUz: "Suhbatdosh bilan jonli gaplashish",
  emoji: "🗣️",
  sortOrder: 5,
  enabled: true,
};

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL yo'q. web/.env faylini tekshiring.");
    process.exit(1);
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "conversations" (
      "id" text PRIMARY KEY NOT NULL,
      "module_id" text NOT NULL REFERENCES "modules"("id") ON DELETE CASCADE,
      "topic" text DEFAULT '' NOT NULL,
      "title" text NOT NULL,
      "character_name" text DEFAULT '' NOT NULL,
      "character_emoji" text DEFAULT '' NOT NULL,
      "goal_uz" text DEFAULT '' NOT NULL,
      "visuals" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "target_minutes" integer DEFAULT 3 NOT NULL,
      "start_key" text DEFAULT 'start' NOT NULL,
      "closing_key" text DEFAULT '' NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL
    )
  `);
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "conversations_module_idx" ON "conversations" ("module_id")`,
  );

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "conversation_nodes" (
      "id" serial PRIMARY KEY NOT NULL,
      "conversation_id" text NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
      "node_key" text NOT NULL,
      "line" text DEFAULT '' NOT NULL,
      "hint_uz" text DEFAULT '' NOT NULL,
      "branches" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "fallback_key" text DEFAULT '' NOT NULL,
      "is_end" boolean DEFAULT false NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL,
      CONSTRAINT "conversation_nodes_key_unique" UNIQUE("conversation_id", "node_key")
    )
  `);
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "conversation_nodes_conversation_idx" ON "conversation_nodes" ("conversation_id")`,
  );

  await db
    .insert(schema.modules)
    .values(MODULE)
    .onConflictDoUpdate({
      target: schema.modules.id,
      set: {
        titleUz: MODULE.titleUz,
        titleEn: MODULE.titleEn,
        descriptionUz: MODULE.descriptionUz,
        emoji: MODULE.emoji,
      },
    });

  const rows = await db.execute(sql`SELECT count(*)::int AS n FROM "conversations"`);
  const n = (rows.rows[0] as { n: number } | undefined)?.n ?? 0;
  console.log(`conversations + conversation_nodes tayyor. Suhbatlar soni: ${n}`);
  console.log(`"${MODULE.titleUz}" moduli mavjud (${MODULE.id}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
