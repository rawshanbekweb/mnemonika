// `audio_clips` jadvalini yaratadi (bir martalik, idempotent).
//
// Ishga tushirish (web/ papkasidan):  npm run db:audio
//
// NEGA drizzle-kit EMAS:
// Loyihada migratsiya tarixi yo'q (`drizzle/` papkasi yuritilmaydi), shuning
// uchun `drizzle-kit generate` mavjud 10 jadval uchun ham "boshlang'ich"
// migratsiya yasaydi — uni jonli bazaga qo'llash xato beradi. `push` esa
// `strict: true` bilan interaktiv tasdiq so'raydi. Bu yerda kerak bo'lgani —
// bitta QO'SHIMCHA jadval, hech narsa o'chirilmaydi yoki o'zgartirilmaydi.
//
// `IF NOT EXISTS` — skriptni bir necha marta ishga tushirish xavfsiz.

import "../src/db/load-env";
import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL yo'q. web/.env faylini tekshiring.");
    process.exit(1);
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "audio_clips" (
      "id" serial PRIMARY KEY NOT NULL,
      "text_hash" text NOT NULL,
      "text" text NOT NULL,
      "voice" text DEFAULT '' NOT NULL,
      "url" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "audio_clips_text_hash_unique" UNIQUE("text_hash")
    )
  `);

  const rows = await db.execute(sql`SELECT count(*)::int AS n FROM "audio_clips"`);
  const n = (rows.rows[0] as { n: number } | undefined)?.n ?? 0;
  console.log(`audio_clips tayyor. Hozirgi klip soni: ${n}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
