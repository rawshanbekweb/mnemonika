"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      router.push(res.redirect ?? "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Chap panel: brend yuzasi. Kichik ekranda ingichka sarlavhaga aylanadi. */}
      <div className="hero-navy hero-photo-classroom flex flex-col justify-center px-6 py-10 text-white lg:w-[45%] lg:px-14">
        <h1 className="text-3xl font-bold tracking-[0.12em]">SPEAKUP</h1>
        <p className="mt-2 text-sm text-white/70">
          Ingliz tili nutq ko&apos;nikmalari platformasi
        </p>
        <p className="mt-8 hidden max-w-sm text-white/85 lg:block">
          Mnemonik strukturalar orqali 5–6 sinf o&apos;quvchilarining gapirish
          ko&apos;nikmasini rivojlantirish. Kontentni boshqaring, o&apos;quvchilar
          natijalarini kuzating.
        </p>
      </div>

      <div className="pattern-page flex flex-1 items-center justify-center px-4 py-10">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded border border-line bg-white p-7">
          <div className="border-b border-line pb-5">
            <h2 className="text-lg font-semibold text-ink">Boshqaruv paneliga kirish</h2>
            <p className="mt-1 text-sm text-ink-muted">Admin yoki o&apos;qituvchi hisobi</p>
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label">Parol</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-state-danger">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Kirilmoqda…" : "Kirish"}
          </button>
        </form>
      </div>
    </div>
  );
}
