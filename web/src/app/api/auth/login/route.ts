import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { safeNext } from "@/lib/next-path";
import { rateLimit, clientKey, clearRateLimit, tooManyRequests } from "@/lib/rate-limit";
import {
  SESSION_COOKIE,
  createSessionToken,
  verifyPassword,
  sessionCookieOptions,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Parol tanlash (brute-force) himoyasi. Ikki qatlam:
 *  - IP bo'yicha — bitta mashinadan kelayotgan urinishlar soni;
 *  - email bo'yicha — hujum tarqoq IP'lardan kelsa ham aniq bir hisob (masalan
 *    admin emaili) himoyalanadi.
 * Chegaralar odamga xalaqit qilmaydi: parolni unutgan o'qituvchi 10 marta
 * urinib ko'rishga ulguradi.
 */
const IP_RULE = { limit: 10, windowMs: 10 * 60 * 1000 };
const EMAIL_RULE = { limit: 10, windowMs: 30 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const ipLimit = rateLimit(`login-ip:${clientKey(req)}`, IP_RULE);
  if (!ipLimit.ok) return tooManyRequests(ipLimit, "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring");

  let body: { email?: string; password?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON yaroqsiz" }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email va parol kerak" }, { status: 400 });
  }

  const emailLimit = rateLimit(`login-email:${email}`, EMAIL_RULE);
  if (!emailLimit.ok) {
    return tooManyRequests(emailLimit, "Bu hisob vaqtincha bloklandi. Birozdan keyin urinib ko'ring");
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Email yoki parol noto'g'ri" }, { status: 401 });
  }

  // Muvaffaqiyatli kirish — hisoblagichlar tozalanadi (yuqoridagi izohga qarang).
  clearRateLimit(`login-ip:${clientKey(req)}`);
  clearRateLimit(`login-email:${email}`);

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role as "admin" | "teacher",
    name: user.name,
  });

  // Middleware kirishni talab qilgan bo'lsa, foydalanuvchi so'ragan sahifaga
  // qaytariladi; boshqa hollarda rolning o'z paneli.
  const res = NextResponse.json({
    ok: true,
    role: user.role,
    redirect: safeNext(body.next, user.role),
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
