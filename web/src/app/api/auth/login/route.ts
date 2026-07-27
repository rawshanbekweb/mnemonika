import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { safeNext } from "@/lib/next-path";
import {
  SESSION_COOKIE,
  createSessionToken,
  verifyPassword,
  sessionCookieOptions,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Email yoki parol noto'g'ri" }, { status: 401 });
  }

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
