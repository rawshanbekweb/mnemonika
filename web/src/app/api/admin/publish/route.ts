import { NextResponse } from "next/server";
import { bumpContentVersion } from "@/lib/build-content";

export const dynamic = "force-dynamic";

/** Kontent versiyasini oshiradi — ilova yangilikni shundan biladi. */
export async function POST() {
  const version = await bumpContentVersion();
  return NextResponse.json({ ok: true, version });
}
