// APK'ni Vercel Blob'ga yuklaydi va eskilarini tozalaydi.
//
// Ishga tushirish (web/ papkasidan):  npm run upload:apk
//
// APK ataylab git'ga qo'shilmaydi — 42MB binar fayl repozitoriyni shishiradi.
// Blob esa aynan shunday fayllar uchun. Yuklangach `/api/apk` eng yangisini
// avtomatik topadi, shuning uchun sayt tomonida hech narsa o'zgartirish shart emas.

import "../src/db/load-env";
import { del, list, put } from "@vercel/blob";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// FAQAT release APK tarqatiladi. Debug build `debuggable=true` bo'ladi (istalgan
// kishi ichidagi ATTEMPTS_TOKEN ni ajratib oladi), R8 o'chiq bo'lgani uchun ~16MB
// kattaroq va debug kaliti bilan imzolanadi — u kalit mashinaga bog'liq, ya'ni
// keyingi build'ni foydalanuvchi ustiga o'rnata olmaydi.
const APK_PATH = path.resolve("../app/build/outputs/apk/release/app-release.apk");
const GRADLE_PATH = path.resolve("../app/build.gradle.kts");

/** Eng yangi shuncha APK saqlanadi, qolgani o'chiriladi. */
const KEEP = 3;

async function readVersion(): Promise<string> {
  try {
    const gradle = await readFile(GRADLE_PATH, "utf8");
    return /versionName\s*=\s*"([^"]+)"/.exec(gradle)?.[1] ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN yo'q. web/.env faylini tekshiring.");
    process.exit(1);
  }
  if (!existsSync(APK_PATH)) {
    console.error(`Release APK topilmadi: ${APK_PATH}`);
    console.error("Avval loyiha ildizida yig'ing:  .\\gradlew.bat assembleRelease");
    console.error("(imzo kaliti local.properties'dan olinadi — local.properties.example ga qarang)");
    process.exit(1);
  }

  const version = await readVersion();
  const file = await readFile(APK_PATH);
  const mb = (file.length / 1024 / 1024).toFixed(1);
  const name = `SpeakUp-${version}-${stamp()}.apk`;

  console.log(`Yuklanmoqda: ${name} (${mb} MB)…`);
  const blob = await put(`apk/${name}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/vnd.android.package-archive",
  });
  console.log(`Tayyor: ${blob.url}`);

  // Eskilarini tozalaymiz — har bir APK ~42MB, Blob joyi cheksiz emas.
  const { blobs } = await list({ prefix: "apk/" });
  const old = blobs
    .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))
    .slice(KEEP);
  for (const b of old) {
    await del(b.url);
    console.log(`Eski o'chirildi: ${b.pathname}`);
  }

  console.log("\nSayt endi shu versiyani taklif qiladi: https://mnemonika.vercel.app/student");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
