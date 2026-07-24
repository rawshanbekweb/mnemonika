"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin", label: "Kontent" },
  { href: "/admin/media", label: "Media" },
  { href: "/teacher", label: "Progress" },
];

export default function Header({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2 font-bold">
            <span className="text-xl">🎙️</span> SpeakUp
          </Link>
          <nav className="flex gap-1">
            {links
              .filter((l) => role === "admin" || l.href === "/teacher")
              .map((l) => {
                const active = pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                      active ? "bg-brand/10 text-brand" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{name}</span>
          <button onClick={logout} className="btn-ghost px-3 py-1.5">
            Chiqish
          </button>
        </div>
      </div>
    </header>
  );
}
