// `exercise_tips` jadvalini yaratadi (bir martalik, idempotent).
//
// Ishga tushirish (web/ papkasidan):  npm run db:tips
//
// Nega drizzle-kit emas — izoh `add-audio-table.ts` da (loyihada migratsiya
// tarixi yuritilmaydi). Bu ham faqat QO'SHADI, hech narsani o'chirmaydi.

import "../src/db/load-env";
import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL yo'q. web/.env faylini tekshiring.");
    process.exit(1);
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "exercise_tips" (
      "id" serial PRIMARY KEY NOT NULL,
      "exercise_id" text NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
      "move" text NOT NULL,
      "title" text DEFAULT '' NOT NULL,
      "detail" text DEFAULT '' NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "exercise_tips_exercise_move_unique" UNIQUE("exercise_id", "move")
    )
  `);
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "exercise_tips_exercise_idx" ON "exercise_tips" ("exercise_id")`,
  );

  const rows = await db.execute(sql`SELECT count(*)::int AS n FROM "exercise_tips"`);
  const n = (rows.rows[0] as { n: number } | undefined)?.n ?? 0;
  console.log(`exercise_tips tayyor. Hozirgi maslahat soni: ${n}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
