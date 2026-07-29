// Tezlik cheklovi testi.
//
// Ishga tushirish:  npm run test:ratelimit
//
// Nima uchun test kerak: cheklov noto'g'ri ishlasa ikki tomonlama zarar —
// juda qattiq bo'lsa sinf o'rtasida bolalar 429 oladi, juda bo'sh bo'lsa
// himoya umuman yo'q. Vaqt `now` parametri orqali beriladi, shuning uchun
// test kutmaydi (`setTimeout` yo'q).

import { rateLimit, clearRateLimit, resetRateLimitStore, clientKey } from "../src/lib/rate-limit";

let failed = 0;
let total = 0;

function check(name: string, got: unknown, expect: unknown): void {
  total++;
  if (got !== expect) {
    failed++;
    console.error(`✗ ${name}\n    kutilgan ${JSON.stringify(expect)}, kelgani ${JSON.stringify(got)}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

const RULE = { limit: 3, windowMs: 60_000 };
const T = 1_000_000; // ixtiyoriy boshlang'ich vaqt

// —— Asosiy hisoblash ——
resetRateLimitStore();
check("1-so'rov o'tadi", rateLimit("a", RULE, T).ok, true);
check("2-so'rov o'tadi", rateLimit("a", RULE, T).ok, true);
check("3-so'rov o'tadi (chegaraning o'zi)", rateLimit("a", RULE, T).ok, true);
check("4-so'rov to'siladi", rateLimit("a", RULE, T).ok, false);

// —— Qolgan so'rovlar hisobi ——
resetRateLimitStore();
check("birinchisidan keyin 2 ta qoladi", rateLimit("b", RULE, T).remaining, 2);
check("ikkinchisidan keyin 1 ta", rateLimit("b", RULE, T).remaining, 1);
check("uchinchisidan keyin 0 ta", rateLimit("b", RULE, T).remaining, 0);
check("to'silganda ham 0", rateLimit("b", RULE, T).remaining, 0);

// —— Kalitlar bir-biriga aralashmaydi ——
resetRateLimitStore();
rateLimit("x", RULE, T);
rateLimit("x", RULE, T);
rateLimit("x", RULE, T);
check("boshqa kalit o'z hisobiga ega", rateLimit("y", RULE, T).ok, true);
check("birinchi kalit hamon to'silgan", rateLimit("x", RULE, T).ok, false);

// —— Oyna tugashi ——
resetRateLimitStore();
rateLimit("w", RULE, T);
rateLimit("w", RULE, T);
rateLimit("w", RULE, T);
check("oyna ichida to'silgan", rateLimit("w", RULE, T).ok, false);
check("oyna oxirida hali to'silgan", rateLimit("w", RULE, T + RULE.windowMs - 1).ok, false);
check("oyna tugagach yana ochiladi", rateLimit("w", RULE, T + RULE.windowMs).ok, true);

// —— Retry-After ——
resetRateLimitStore();
rateLimit("r", RULE, T);
rateLimit("r", RULE, T);
rateLimit("r", RULE, T);
const blocked = rateLimit("r", RULE, T + 20_000);
check("Retry-After qolgan vaqtni beradi", blocked.retryAfterSec, 40);
const almost = rateLimit("r", RULE, T + RULE.windowMs - 100);
// 0 soniya deb aytmasligi kerak — mijoz darhol qayta urinib halqaga tushmasin.
check("Retry-After hech qachon 0 emas", almost.retryAfterSec, 1);

// —— Muvaffaqiyatli kirishdan keyin tozalash ——
resetRateLimitStore();
rateLimit("login-email:a@b.c", RULE, T);
rateLimit("login-email:a@b.c", RULE, T);
rateLimit("login-email:a@b.c", RULE, T);
check("uch xato urinishdan keyin to'silgan", rateLimit("login-email:a@b.c", RULE, T).ok, false);
clearRateLimit("login-email:a@b.c");
check("tozalangandan keyin yana ochiq", rateLimit("login-email:a@b.c", RULE, T).ok, true);

// —— Mijoz kaliti ——
const withFwd = new Request("https://x.uz", {
  headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
});
check("x-forwarded-for dan birinchi IP olinadi", clientKey(withFwd), "203.0.113.5");
check("sarlavhasiz so'rov — local", clientKey(new Request("https://x.uz")), "local");
check(
  "x-real-ip zaxira sifatida",
  clientKey(new Request("https://x.uz", { headers: { "x-real-ip": "198.51.100.9" } })),
  "198.51.100.9",
);

console.log(`\n${total - failed}/${total} o'tdi`);
if (failed > 0) process.exit(1);
