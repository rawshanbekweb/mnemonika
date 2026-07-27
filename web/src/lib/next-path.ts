/**
 * Middleware kirishni talab qilganda `?next=` bilan qaytib kelinadigan manzilni
 * yozadi. Bu qiymat foydalanuvchi qo'lidan keladi, shuning uchun kirishdan keyin
 * unga ko'r-ko'rona yo'naltirib bo'lmaydi: tashqi sayt ("//evil.com") yoki
 * roliga to'g'ri kelmaydigan bo'lim bo'lishi mumkin.
 */

/** Rolga mos standart boshlang'ich sahifa. */
export function homeFor(role: string): string {
  return role === "admin" ? "/admin" : "/teacher";
}

/**
 * `next` ni tekshiradi va xavfsiz manzil qaytaradi.
 * Faqat himoyalangan bo'limlarga ichki yo'l qabul qilinadi; qolgan hamma holatda
 * rolning o'z paneli qaytadi (o'qituvchi /admin'ga so'rasa ham).
 */
export function safeNext(next: string | undefined, role: string): string {
  const fallback = homeFor(role);
  if (!next) return fallback;
  // "//host" va "/\host" — protokolsiz tashqi manzillar.
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;

  const path = next.split(/[?#]/)[0];
  const allowed = path === "/admin" || path.startsWith("/admin/") || path === "/teacher" || path.startsWith("/teacher/");
  if (!allowed) return fallback;
  if (path.startsWith("/admin") && role !== "admin") return fallback;
  return next;
}
