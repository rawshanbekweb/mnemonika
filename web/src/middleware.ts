import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Himoyalangan yo'llar: sahifalar va admin/teacher API'lari.
const PROTECTED_PAGES = ["/admin", "/teacher"];
const PROTECTED_APIS = ["/api/admin", "/api/teacher"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isApi = PROTECTED_APIS.some((p) => pathname.startsWith(p));
  const isPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p));
  if (!isApi && !isPage) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user) {
    if (isApi) {
      return NextResponse.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // /admin* va /api/admin* — faqat admin.
  const adminOnly = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (adminOnly && user.role !== "admin") {
    if (isApi) {
      return NextResponse.json({ error: "Ruxsat yo'q (admin kerak)" }, { status: 403 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/teacher";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/api/admin/:path*", "/api/teacher/:path*"],
};
