// "Takrorlang" mashqi uchun bitta ustun qo'shadi.
//
// Ishga tushirish (web/ papkasidan):  npx tsx scripts/migrate-target-text.ts
//
// Nega alohida skript, `drizzle-kit push` emas: push butun sxemani jonli baza
// bilan solishtiradi va oldindan bilib bo'lmaydigan o'zgarishlarni taklif
// qilishi mumkin. Bu yerda esa aynan bitta amal bajariladi.
//
// Xavfsizligi: ustun QO'SHILADI, hech narsa o'chirilmaydi yoki o'zgartirilmaydi.
// `IF NOT EXISTS` tufayli qayta ishga tushirsa ham zarar yo'q. Mavjud qatorlar
// bo'sh qiymat oladi, ya'ni ular avvalgidek oddiy mashq bo'lib qoladi.
//
// MUHIM: bu migratsiya kod deploy qilinishidan OLDIN bajarilishi shart.
// `/api/content` endi `target_text` ustunini o'qiydi — ustun bo'lmasa so'rov
// xato beradi va o'quvchi ilovasi butunlay ishlamay qoladi.

import "../src/db/load-env";
import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function main() {
  console.log("Ustun qo'shilmoqda: exercises.target_text …");
  await db.execute(
    sql`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_text text NOT NULL DEFAULT ''`,
  );

  const check = await db.execute(
    sql`SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'exercises' AND column_name = 'target_text'`,
  );
  console.log("Natija:", check.rows);
  console.log("Tayyor. Endi kodni deploy qilish mumkin.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
