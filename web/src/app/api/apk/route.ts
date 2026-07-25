import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const dynamic = "force-dynamic";

/**
 * Eng oxirgi yuklangan Android APK haqidagi ma'lumot.
 *
 * Ro'yxat Blob'dan o'qiladi — shuning uchun yangi APK yuklaganda saytni qayta
 * deploy qilish yoki bironta URL'ni qo'lda yangilash shart emas.
 * APK bo'lmasa yoki Blob sozlanmagan bo'lsa `null` qaytadi va sahifada
 * yuklab olish bo'limi umuman ko'rinmaydi.
 */
export async function GET(req: Request) {
  // ?debug=1 — nosozlikni aniqlash uchun. Sir chiqmaydi: token ichidagi store ID
  // ommaviy blob URL manzilida allaqachon ko'rinadi, maxfiy qismi esa kesiladi.
  const debug = new URL(req.url).searchParams.get("debug") === "1";
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = token?.split("_")[3] ?? null;

  if (!token) {
    return NextResponse.json(debug ? { error: "BLOB_READ_WRITE_TOKEN yo'q" } : null);
  }

  try {
    const { blobs } = await list({ prefix: "apk/" });
    if (debug) {
      return NextResponse.json({
        storeId,
        blobCount: blobs.length,
        pathnames: blobs.map((b) => b.pathname),
      });
    }
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
  } catch (e) {
    if (debug) {
      return NextResponse.json({
        storeId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
    return NextResponse.json(null);
  }
}
