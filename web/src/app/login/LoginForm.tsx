"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

/**
 * `next` — middleware qo'ygan, server tomonda allaqachon tekshirilgan manzil.
 * Faqat rol mos kelganda ishlatiladi: admin bo'lmagan foydalanuvchi /admin ga
 * so'ragan bo'lsa, server uni allaqachon /teacher ga almashtirgan.
 */
export default function LoginForm({ next }: { next?: string }) {
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
      const res = await api.post("/api/auth/login", { email, password, next });
      router.push(res.redirect ?? "/teacher");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded border border-line bg-white p-7">
      <div className="border-b border-line pb-5">
        <h2 className="text-lg font-semibold text-ink">Boshqaruv paneliga kirish</h2>
        <p className="mt-1 text-sm text-ink-muted">Admin yoki o&apos;qituvchi hisobi</p>
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Parol
        </label>
        <input
          id="password"
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
  );
}
