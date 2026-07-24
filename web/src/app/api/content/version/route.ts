import { NextResponse } from "next/server";
import { currentVersion } from "@/lib/build-content";

export const dynamic = "force-dynamic";

/** Yengil tekshiruv: joriy kontent versiyasi. */
export async function GET() {
  try {
    const version = await currentVersion();
    return NextResponse.json({ version });
  } catch {
    return NextResponse.json({ error: "Versiya olinmadi" }, { status: 500 });
  }
}
