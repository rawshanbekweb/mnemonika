import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const dynamic = "force-dynamic";

/**
 * Eng oxirgi yuklangan Android APK haqidagi ma'lumot.
 *
 * Ro'yxat Blob'dan o'qiladi — shuning uchun yangi APK yuklaganda saytni qayta
 * deploy qilish yoki bironta URL'ni qo'lda yangilash shart emas.
 *
 * APK bo'lmasa yoki Blob sozlanmagan bo'lsa `null` qaytadi va sahifada yuklab
 * olish bo'limi umuman ko'rinmaydi. Bu ataylab: sayt Blob nosozligi tufayli
 * ishdan chiqmasligi kerak. Ammo shu sababli nosozlik jimgina yashirinadi —
 * agar tugma paydo bo'lmasa, MUAMMO ODATDA `BLOB_READ_WRITE_TOKEN` NOTO'G'RI
 * DO'KONGA QARAYOTGANIDA bo'ladi. Tekshirish uchun bu yerga vaqtincha
 * `storeId: process.env.BLOB_READ_WRITE_TOKEN?.split("_")[3]` ni qaytaring —
 * store ID maxfiy emas, u ommaviy blob manzilida ham bor.
 */
export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json(null);

  try {
    const { blobs } = await list({ prefix: "apk/" });
    if (blobs.length === 0) return NextResponse.json(null);

    const newest = blobs.sort(
      (a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt),
    )[0];

    const fileName = newest.pathname.split("/").pop() ?? "SpeakUp.apk";
    // "SpeakUp-0.1.0-20260725-0038-abc123.apk" -> "0.1.0"
    const version = /SpeakUp-([0-9]+(?:\.[0-9]+)*)/.exec(fileName)?.[1] ?? "";

    return NextResponse.json({
      url: newest.url,
      sizeMb: Math.round((newest.size / 1024 / 1024) * 10) / 10,
      uploadedAt: newest.uploadedAt,
      version,
    });
  } catch {
    return NextResponse.json(null);
  }
}
