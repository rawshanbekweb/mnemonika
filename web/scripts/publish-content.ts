// Kontent versiyasini oshiradi — "Publish" tugmasining buyruq qatoridagi shakli.
//
// Ishga tushirish:  npm run publish:content
//
// Nega kerak: `gen:content`, `gen:conversation`, `gen:audio` bazaga yozadi, lekin
// versiyaga TEGMAYDI. Ilova va veb esa yangilikni aynan versiya raqamidan
// biladi (`/api/content/version`) — u oshmasa, bola eski keshdagi kontentni
// ko'rib turaveradi. Avval buning uchun admin paneliga kirish kerak edi;
// generatorlar buyruq qatorida ishlagani uchun bu ham shu yerda bo'lgani qulay.
//
// `/api/admin/publish` route'i aynan shu funksiyani chaqiradi — mantiq bitta.

import "../src/db/load-env";
import { bumpContentVersion, buildContentPack } from "../src/lib/build-content";

async function main(): Promise<void> {
  const pack = await buildContentPack();
  const exercises = pack.modules.reduce((n, m) => n + m.exercises.length, 0);
  const dialogs = pack.modules.reduce((n, m) => n + m.dialogs.length, 0);

  const version = await bumpContentVersion();
  console.log(
    `Bazada: ${pack.modules.length} modul, ${exercises} mashq, ${dialogs} dialog`,
  );
  console.log(`✅ Kontent versiyasi: ${version}`);
  console.log("Ilova va veb keyingi ochilishda yangi kontentni oladi.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
