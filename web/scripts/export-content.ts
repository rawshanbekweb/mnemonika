// Bazadagi kontentni APK ichidagi offline zaxira fayliga yozadi.
//
//   npm run export:content            — app/src/main/assets/content/modules.json
//   npm run export:content -- --dry   — faqat farqni ko'rsatadi
//
// NIMA UCHUN KERAK: ilova birinchi ochilganda (yoki internet bo'lmaganda)
// shu bundled fayldan ishlaydi; `/api/content` dan yangisi kelganda ustiga
// yoziladi. Fayl yangilanmasa, yangi o'rnatgan bola internetsiz FAQAT eski
// 7 mashqni ko'radi.
//
// Shakl `buildContentPack()` dan olinadi — u allaqachon "Android kutgan
// shaklda" (Content.kt). Shuning uchun bu yerda qo'lda qayta yig'ish YO'Q:
// aks holda ikkita joyda ikkita format paydo bo'lardi.
//
// Versiya: bazadagi joriy `contentVersion`. Bundled fayl versiyasi serverdagi
// versiyadan kichik bo'lishi xavfsiz — ilova serverdagini yangi deb biladi va
// yuklab oladi. Shuning uchun eksportdan keyin "Publish" bosilsa ham muammo
// yo'q.
//
// ESLATMA: fayl o'zgargandan keyin APK QAYTA YIG'ILISHI shart, aks holda
// tarqatilayotgan ilovada eski zaxira qoladi.

import "../src/db/load-env";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { buildContentPack } from "../src/lib/build-content";

const TARGET = resolve(process.cwd(), "../app/src/main/assets/content/modules.json");

async function main() {
  const dry = process.argv.includes("--dry");
  const pack = await buildContentPack();

  const exCount = pack.modules.reduce((n, m) => n + m.exercises.length, 0);
  const dlCount = pack.modules.reduce((n, m) => n + m.dialogs.length, 0);
  console.log(
    `Baza: ${pack.modules.length} modul, ${exCount} mashq, ${dlCount} dialog (versiya ${pack.version})`,
  );

  const next = JSON.stringify(pack, null, 2) + "\n";

  if (existsSync(TARGET)) {
    const current = readFileSync(TARGET, "utf8");
    if (current === next) {
      console.log("Fayl allaqachon bir xil — o'zgarish yo'q.");
      return;
    }
    console.log(`Hajm: ${current.length} → ${next.length} bayt`);
  }

  if (dry) {
    console.log("(--dry: fayl yozilmadi)");
    return;
  }

  writeFileSync(TARGET, next, "utf8");
  console.log(`✅ Yozildi: ${TARGET}`);
  console.log("Endi APK qayta yig'ilishi kerak (gradlew assembleRelease).");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
