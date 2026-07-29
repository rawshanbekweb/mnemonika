/**
 * Oddiy tezlik cheklovi (rate limit) — qat'iy oyna (fixed window) usulida.
 *
 * NEGA XOTIRADA, TASHQI XIZMATSIZ:
 * Loyihaning $0 sharti kuchida — Upstash/Vercel KV qo'shilmaydi. Neon'da
 * hisoblagich jadvali ham ishlatilmadi: `/api/grammar` kabi ochiq proxy'ni
 * bazaga yozib sanash hujumchiga aynan biz to'smoqchi bo'lgan narsani —
 * har so'rovda baza yozuvini — beradi.
 *
 * SHUNING UCHUN HALOL CHEKLOV: Vercel'da har lambda nusxasi o'z xotirasiga ega
 * va sovuq start xotirani tozalaydi. Ya'ni amaldagi chegara "nusxalar soni ×
 * limit" bo'lishi mumkin va bu qat'iy kafolat EMAS. Maqsad ham shu emas:
 * maqsad — bitta skript bilan minutiga minglab so'rov yuborib bazani yoki
 * LanguageTool kvotamizni tugatishni qimmatga aylantirish. Haqiqiy kafolat
 * kerak bo'lsa (masalan Play'ga chiqqandan keyin), yagona to'g'ri yechim
 * tashqi hisoblagich — o'shanda faqat shu fayl almashtiriladi, chaqiruvchilar
 * tegilmaydi.
 */

export type RateRule = {
  /** Oyna ichida ruxsat etilgan so'rovlar soni. */
  limit: number;
  /** Oyna uzunligi (ms). */
  windowMs: number;
};

export type RateResult = {
  ok: boolean;
  /** Shu oynada qolgan so'rovlar. */
  remaining: number;
  /** Oyna tugashiga necha soniya qolgani (Retry-After uchun). */
  retryAfterSec: number;
};

type Entry = { count: number; resetAt: number };

/**
 * Xotira chegarasi: lambda cheksiz o'smasligi uchun.
 * Chegaraga yetganda eskirganlar tozalanadi, keyin ham joy bo'lmasa eng eski
 * yozuvlar tashlanadi (ular baribir tez orada eskiradi).
 */
const MAX_KEYS = 5_000;

const buckets = new Map<string, Entry>();

function prune(now: number): void {
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size < MAX_KEYS) return;
  // Map kiritilish tartibini saqlaydi — eng eskilaridan boshlab tashlaymiz.
  const excess = buckets.size - Math.floor(MAX_KEYS / 2);
  let i = 0;
  for (const key of buckets.keys()) {
    if (i++ >= excess) break;
    buckets.delete(key);
  }
}

/**
 * Bitta so'rovni hisobga oladi va ruxsat berilganini qaytaradi.
 *
 * `key` — cheklov nimaga tegishli bo'lsa (masalan `"grammar:1.2.3.4"`).
 * Chaqiruvchi kalitga o'z prefiksini qo'shishi shart, aks holda turli
 * endpointlar bitta hisoblagichni bo'lishib oladi.
 */
export function rateLimit(key: string, rule: RateRule, now = Date.now()): RateResult {
  if (buckets.size >= MAX_KEYS) prune(now);

  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true, remaining: rule.limit - 1, retryAfterSec: 0 };
  }

  const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  if (entry.count >= rule.limit) {
    return { ok: false, remaining: 0, retryAfterSec };
  }

  entry.count += 1;
  return { ok: true, remaining: rule.limit - entry.count, retryAfterSec };
}

/**
 * So'rov manbasini aniqlaydi.
 *
 * Vercel `x-forwarded-for` ni O'ZI yozadi, shuning uchun unga ishonsa bo'ladi;
 * birinchi qiymat — haqiqiy mijoz. Lokal `npm run dev` da sarlavha bo'lmaydi,
 * o'shanda hamma "local" bo'ladi (dev'da cheklovni sinash uchun ham qulay).
 */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim().slice(0, 64);
  return req.headers.get("x-real-ip")?.slice(0, 64) || "local";
}

/** 429 javobi — `Retry-After` bilan (mijoz qachon urinishni bilsin). */
export function tooManyRequests(result: RateResult, message = "Juda ko'p so'rov"): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(result.retryAfterSec),
    },
  });
}

/**
 * Bitta kalitning hisobini tozalaydi.
 *
 * Kirish muvaffaqiyatli bo'lganda ishlatiladi: parolni bir necha marta noto'g'ri
 * terib, keyin to'g'ri kirgan o'qituvchi hisobi bloklanib qolmasin. Ya'ni
 * chegara amalda faqat MUVAFFAQIYATSIZ urinishlarni sanaydi.
 */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

/** Faqat testlar uchun — holatni tozalaydi. */
export function resetRateLimitStore(): void {
  buckets.clear();
}
