/**
 * Birinchi admin foydalanuvchini yaratadi (.env dagi ADMIN_* dan).
 * Ishga tushirish:  npm run create-admin
 */
import "./load-env"; // BIRINCHI: db/index yuklanishidan oldin .env o'qilsin
import { eq } from "drizzle-orm";
import { db, schema } from "./index";
import { hashPassword } from "../lib/auth";

async function main() {
  // Login emailni har doim kichik harfda qidiradi, shuning uchun shu yerda ham
  // normallashtiramiz — aks holda katta harfli email bilan kirib bo'lmaydi.
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Administrator";
  // Emailni o'zgartirayotgan bo'lsang, eskisini shu yerda ko'rsat: eski hisob
  // yangisiga aylantiriladi. Aks holda eski admin bazada qolib, uning eski
  // paroli bilan kirish mumkin bo'lib qolaveradi.
  const oldEmail = process.env.ADMIN_OLD_EMAIL?.trim().toLowerCase();
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL va ADMIN_PASSWORD .env da bo'lishi kerak.");
  }

  const hash = await hashPassword(password);
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!existing && oldEmail && oldEmail !== email) {
    const [old] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, oldEmail))
      .limit(1);
    if (!old) throw new Error(`ADMIN_OLD_EMAIL topilmadi: ${oldEmail}`);
    await db
      .update(schema.users)
      .set({ email, passwordHash: hash, role: "admin", name })
      .where(eq(schema.users.id, old.id));
    console.log(`✅ Admin ko'chirildi: ${oldEmail} → ${email}`);
    return;
  }

  if (existing) {
    await db
      .update(schema.users)
      .set({ passwordHash: hash, role: "admin", name })
      .where(eq(schema.users.id, existing.id));
    console.log(`✅ Admin yangilandi: ${email}`);
  } else {
    await db.insert(schema.users).values({ email, passwordHash: hash, role: "admin", name });
    console.log(`✅ Admin yaratildi: ${email}`);
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
