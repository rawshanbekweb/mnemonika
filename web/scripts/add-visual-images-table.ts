// `visual_images` jadvalini yaratadi (bir martalik, idempotent).
//
// Ishga tushirish (web/ papkasidan):  npm run db:images
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
    CREATE TABLE IF NOT EXISTS "visual_images" (
      "id" serial PRIMARY KEY NOT NULL,
      "token" text NOT NULL UNIQUE,
      "url" text NOT NULL,
      "search_term" text DEFAULT '' NOT NULL,
      "source_url" text DEFAULT '' NOT NULL,
      "creator" text DEFAULT '' NOT NULL,
      "license" text DEFAULT '' NOT NULL,
      "license_url" text DEFAULT '' NOT NULL,
      "title" text DEFAULT '' NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    )
  `);

  const rows = await db.execute(sql`SELECT count(*)::int AS n FROM "visual_images"`);
  const n = (rows.rows[0] as { n: number } | undefined)?.n ?? 0;
  console.log(`visual_images tayyor. Hozirgi rasm soni: ${n}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
