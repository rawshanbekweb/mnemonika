"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";

type MediaRow = { id: number; url: string; alt: string; pathname: string; createdAt: string };

export default function MediaPage() {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function reload() {
    try {
      setRows(await api.get("/api/admin/media"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yuklanmadi");
    }
  }
  useEffect(() => {
    reload();
  }, []);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("alt", alt);
      await api.upload("/api/admin/media", form);
      setAlt("");
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yuklanmadi");
    } finally {
      setUploading(false);
    }
  }

  async function del(id: number) {
    if (!confirm("Rasmni o'chirasizmi?")) return;
    await api.del(`/api/admin/media?id=${id}`);
    await reload();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-hero-gradient text-2xl shadow-soft">
          🖼️
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Media kutubxonasi</h1>
          <p className="text-sm text-ink-muted">
            Haqiqiy rasmlarni yuklang, so'ng URL'ni mashq/dialog "Vizuallar" maydoniga qo'ying.
          </p>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-4">
        <div>
          <span className="label">Rasm fayli</span>
          <div className="flex items-center gap-2">
            <label className="btn-ghost cursor-pointer">
              📁 Rasm tanlash
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
            </label>
            <span className="max-w-[180px] truncate text-sm text-ink-muted">
              {fileName || "Fayl tanlanmagan"}
            </span>
          </div>
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="label">Izoh (alt)</label>
          <input className="input" value={alt} onChange={(e) => setAlt(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={upload} disabled={uploading || !fileName}>
          {uploading ? "Yuklanmoqda…" : "Yuklash"}
        </button>
      </div>
      {error && <p className="text-sm text-coral-dark">{error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {rows.map((m) => (
          <div key={m.id} className="card space-y-2 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.alt} className="h-28 w-full rounded-lg object-cover" />
            <p className="truncate text-xs text-slate-500">{m.alt || m.pathname}</p>
            <div className="flex gap-1">
              <button
                className="btn-ghost flex-1 px-2 py-1 text-xs"
                onClick={() => navigator.clipboard.writeText(m.url)}
              >
                URL nusxa
              </button>
              <button className="btn-danger px-2 py-1 text-xs" onClick={() => del(m.id)}>
                O'chirish
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-400">Hali rasm yo'q.</p>}
      </div>
    </div>
  );
}
