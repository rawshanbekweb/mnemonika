// Kirishdan keyingi yo'naltirish testi.
//
// Ishga tushirish:  npm run test:nextpath
//
// `next` parametri foydalanuvchi qo'lidan keladi (manzil qatorida ko'rinadi),
// shuning uchun ikki narsa muhim: tashqi saytga yo'naltirib bo'lmasligi
// (ochiq redirect) va o'qituvchi /admin ga tusha olmasligi.

import { safeNext, homeFor } from "../src/lib/next-path";

type Case = {
  name: string;
  next: string | undefined;
  role: "admin" | "teacher";
  expect: string;
};

const cases: Case[] = [
  { name: "next yo'q — admin paneliga", next: undefined, role: "admin", expect: "/admin" },
  { name: "next yo'q — o'qituvchi paneliga", next: undefined, role: "teacher", expect: "/teacher" },
  { name: "bo'sh satr", next: "", role: "teacher", expect: "/teacher" },

  { name: "admin so'ragan /admin", next: "/admin", role: "admin", expect: "/admin" },
  { name: "ichki sahifa + parametr", next: "/admin/exercise?id=12", role: "admin", expect: "/admin/exercise?id=12" },
  { name: "o'qituvchi sahifasi", next: "/teacher/student/5", role: "teacher", expect: "/teacher/student/5" },
  { name: "admin o'qituvchi sahifasiga ham kira oladi", next: "/teacher", role: "admin", expect: "/teacher" },

  { name: "o'qituvchi /admin so'radi — o'z paneliga", next: "/admin", role: "teacher", expect: "/teacher" },
  { name: "o'qituvchi /admin/media so'radi", next: "/admin/media", role: "teacher", expect: "/teacher" },

  { name: "tashqi manzil", next: "https://evil.com", role: "admin", expect: "/admin" },
  { name: "protokolsiz tashqi manzil", next: "//evil.com", role: "admin", expect: "/admin" },
  { name: "teskari chiziqli hiyla", next: "/\\evil.com", role: "admin", expect: "/admin" },
  { name: "himoyalanmagan ochiq sahifa", next: "/student", role: "admin", expect: "/admin" },
  { name: "kirish sahifasining o'zi — halqa bo'lmasin", next: "/login", role: "admin", expect: "/admin" },
  { name: "/administrator — /admin prefiksiga o'xshaydi, lekin boshqa yo'l", next: "/administrator", role: "admin", expect: "/admin" },
  { name: "API manzili sahifa emas", next: "/api/admin/modules", role: "admin", expect: "/admin" },
];

let failed = 0;
for (const c of cases) {
  const got = safeNext(c.next, c.role);
  if (got !== c.expect) {
    failed++;
    console.error(`✗ ${c.name}\n    kutilgan "${c.expect}", kelgani "${got}"`);
  } else {
    console.log(`✓ ${c.name}`);
  }
}

// homeFor har doim himoyalangan bo'limga ishora qilishi kerak.
for (const role of ["admin", "teacher", "nomalum"]) {
  const home = homeFor(role);
  if (home !== "/admin" && home !== "/teacher") {
    failed++;
    console.error(`✗ homeFor("${role}") = "${home}"`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} o'tdi`);
if (failed > 0) process.exit(1);
