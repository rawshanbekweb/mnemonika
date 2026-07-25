"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

const links = [
  { href: "/admin", label: "Kontent" },
  { href: "/admin/media", label: "Media" },
  { href: "/teacher", label: "Progress" },
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

export default function Header({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link
            href="/admin"
            className="text-lg font-bold tracking-[0.12em] text-navy"
          >
            SPEAKUP
          </Link>
          <nav className="flex gap-1">
            {links
              .filter((l) => role === "admin" || l.href === "/teacher")
              .map((l) => {
                const active = isActive(l.href, pathname);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`rounded-sm px-3 py-1.5 text-sm ${
                      active
                        ? "bg-navy-container font-semibold text-navy"
                        : "text-ink-muted hover:bg-surface-muted"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-ink-muted">{name}</span>
          <button onClick={logout} className="btn-ghost !px-3 !py-1.5 !text-xs">
            <Icon name="logout" size={15} />
            Chiqish
          </button>
        </div>
      </div>
    </header>
  );
}
