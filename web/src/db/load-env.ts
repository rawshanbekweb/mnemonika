// Skriptlar uchun: boshqa modullar (db/index) yuklanishidan OLDIN .env ni o'qiydi.
// ESM importlari tartibda ishga tushgani uchun bu fayl eng birinchi import qilinadi.
try {
  process.loadEnvFile(".env");
} catch {
  // .env bo'lmasa muhit o'zgaruvchilari tashqaridan berilgan deb hisoblaymiz.
}
