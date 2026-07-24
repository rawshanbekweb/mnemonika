import { NextResponse, type NextRequest } from "next/server";
import { buildContentPack, currentVersion } from "@/lib/build-content";

export const dynamic = "force-dynamic";

/**
 * Ilova uchun butun kontent JSON'i (ContentPack).
 * `?since=<version>` berilsa va versiya yangi bo'lmasa — {upToDate:true} qaytadi
 * (ilova ortiqcha yuklab olmaydi).
 */
export async function GET(req: NextRequest) {
  try {
    const since = Number(req.nextUrl.searchParams.get("since") ?? "");
    if (Number.isFinite(since) && since > 0) {
      const version = await currentVersion();
      if (version <= since) {
        return NextResponse.json({ upToDate: true, version });
      }
    }
    const pack = await buildContentPack();
    return NextResponse.json(pack);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kontent yuklanmadi" }, { status: 500 });
  }
}
