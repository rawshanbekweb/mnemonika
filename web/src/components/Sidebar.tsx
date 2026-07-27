"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";

type NavLink = { href: string; label: string; icon: IconName; adminOnly: boolean };

const links: NavLink[] = [
  { href: "/admin", label: "Kontent", icon: "library", adminOnly: true },
  { href: "/admin/media", label: "Media", icon: "image", adminOnly: true },
  { href: "/teacher", label: "Progress", icon: "chart", adminOnly: false },
];

function isActive(href: string, pathname: string): boolean {
  // "Kontent" — /admin va mashq/dialog muharrirlari, lekin /admin/media emas.
  if (href === "/admin") {
    return (
      pathname === "/admin" ||
      pathname.startsWith("/admin/exercise") ||
      pathname.startsWith("/admin/dialog")
    );
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Sahifa almashganda mobil panel yopiladi.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Chiqqandan keyin ochiq saytning kirish nuqtasiga — landing'ga qaytamiz,
    // kirish formasiga emas: u yerdan yana "Kirish" tugmasi bor.
    router.push("/");
    router.refresh();
  }

  const visible = links.filter((l) => role === "admin" || !l.adminOnly);
  const home = role === "admin" ? "/admin" : "/teacher";

  return (
    <>
      {/* Mobil yuqori panel — sidebar yashiringanda navigatsiyani ochadi. */}
      <div className="pattern-rail fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 bg-navy px-4 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menyuni ochish"
          className="-ml-1 rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Icon name="menu" size={22} />
        </button>
        <span className="text-sm font-bold tracking-[0.12em]">SPEAKUP</span>
      </div>

      {/* Mobil fon qoplamasi */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`pattern-rail fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-navy text-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link href={home} className="block">
            <span className="block text-lg font-bold tracking-[0.12em]">SPEAKUP</span>
            <span className="mt-0.5 block text-overline uppercase text-white/50">
              Boshqaruv paneli
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Menyuni yopish"
            className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {visible.map((l) => {
            const active = isActive(l.href, pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition ${
                  active
                    ? "border-gold bg-white/10 font-semibold text-white"
                    : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon name={l.icon} size={18} />
                {l.label}
              </Link>
            );
          })}

          {/* Panel ochiq saytdan uzilib qolmasligi kerak — landing'ga qaytish yo'li. */}
          <Link
            href="/"
            className="mt-2 flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            <Icon name="home" size={18} />
            Bosh sahifa
          </Link>
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 px-1 pb-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white/10 text-sm font-semibold">
              {name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="text-overline uppercase text-white/50">
                {role === "admin" ? "Administrator" : "O'qituvchi"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded border border-white/20 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <Icon name="logout" size={15} />
            Chiqish
          </button>
        </div>
      </aside>
    </>
  );
}
