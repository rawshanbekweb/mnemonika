"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import type { FullContent, ModuleRow } from "@/lib/admin-types";

const EMPTY_MODULE: ModuleRow = {
  id: "",
  type: "discussion",
  titleUz: "",
  titleEn: "",
  descriptionUz: "",
  emoji: "",
  sortOrder: 0,
  enabled: true,
};

export default function AdminDashboard() {
  const [data, setData] = useState<FullContent | null>(null);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState<ModuleRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState("");

  async function reload() {
    try {
      setData(await api.get("/api/admin/full"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Yuklanmadi");
    }
  }
  useEffect(() => {
    reload();
  }, []);

  async function publish() {
    setPublishing(true);
    setMsg("");
    try {
      const res = await api.post("/api/admin/publish");
      setMsg(`Nashr qilindi ✓ (versiya ${res.version})`);
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setPublishing(false);
    }
  }

  async function saveModule(m: ModuleRow) {
    if (isNew) await api.post("/api/admin/modules", m);
    else await api.put(`/api/admin/modules/${m.id}`, m);
    setEditing(null);
    await reload();
  }

  async function delModule(id: string) {
    if (!confirm(`"${id}" modulini va uning barcha mashqlarini o'chirasizmi?`)) return;
    await api.del(`/api/admin/modules/${id}`);
    await reload();
  }

  if (err) return <p className="text-red-600">{err}</p>;
  if (!data) return <p className="text-slate-500">Yuklanmoqda…</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-hero-gradient p-6 text-white shadow-soft-lg">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Kontent boshqaruvi</h1>
          <p className="text-sm text-white/85">
            Joriy versiya: <b>{data.version}</b>
            {data.publishedAt && ` · ${new Date(data.publishedAt).toLocaleString("uz")}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn rounded-full bg-white/15 px-5 py-2.5 font-semibold text-white ring-1 ring-white/25 hover:bg-white/25"
            onClick={() => {
              setEditing({ ...EMPTY_MODULE, sortOrder: data.modules.length });
              setIsNew(true);
            }}
          >
            ＋ Modul
          </button>
          <button
            className="btn rounded-full bg-white px-5 py-2.5 font-bold text-brand shadow-soft hover:bg-white/90"
            onClick={publish}
            disabled={publishing}
          >
            {publishing ? "Nashr…" : "Nashr qilish"}
          </button>
        </div>
      </div>

      {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
      <p className="text-xs text-slate-500">
        O'zgarishlar bazaga darhol saqlanadi, lekin ilova ularni faqat{" "}
        <b>Nashr qilish</b> bosilib versiya oshgandan keyin yuklaydi.
      </p>

      {data.modules.map((m) => {
        const exs = data.exercises.filter((e) => e.moduleId === m.id);
        const digs = data.dialogs.filter((d) => d.moduleId === m.id);
        return (
          <div key={m.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <span className="text-2xl">{m.emoji}</span>
                  {m.titleUz}
                  {!m.enabled && (
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                      o'chirilgan
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  {m.type} · {m.id}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-ghost px-3 py-1.5"
                  onClick={() => {
                    setEditing(m);
                    setIsNew(false);
                  }}
                >
                  Tahrirlash
                </button>
                <button className="btn-danger px-3 py-1.5" onClick={() => delModule(m.id)}>
                  O'chirish
                </button>
              </div>
            </div>

            <ItemList
              title="Mashqlar"
              addHref={`/admin/exercise?module=${m.id}`}
              items={exs.map((e) => ({
                id: e.id,
                label: e.title,
                sub: e.acronym,
                href: `/admin/exercise?module=${m.id}&id=${e.id}`,
              }))}
            />
            <ItemList
              title="Dialoglar (rolli o'yin / intervyu)"
              addHref={`/admin/dialog?module=${m.id}`}
              items={digs.map((d) => ({
                id: d.id,
                label: d.title,
                sub: `${d.characterEmoji} ${d.characterName}`,
                href: `/admin/dialog?module=${m.id}&id=${d.id}`,
              }))}
            />
          </div>
        );
      })}

      {editing && (
        <ModuleForm
          value={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSave={saveModule}
        />
      )}
    </div>
  );
}

function ItemList({
  title,
  addHref,
  items,
}: {
  title: string;
  addHref: string;
  items: { id: string; label: string; sub: string; href: string }[];
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title} ({items.length})
        </span>
        <Link href={addHref} className="text-sm font-medium text-brand hover:underline">
          ＋ Yangi
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Hali yo'q</p>
      ) : (
        <ul className="divide-y divide-slate-200">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm">
                {it.label} <span className="text-xs text-slate-400">{it.sub}</span>
              </span>
              <Link href={it.href} className="text-sm text-brand hover:underline">
                Tahrirlash →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ModuleForm({
  value,
  isNew,
  onClose,
  onSave,
}: {
  value: ModuleRow;
  isNew: boolean;
  onClose: () => void;
  onSave: (m: ModuleRow) => Promise<void>;
}) {
  const [m, setM] = useState<ModuleRow>(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<ModuleRow>) => setM((x) => ({ ...x, ...patch }));

  async function save() {
    setSaving(true);
    setError("");
    try {
      await onSave(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-lg space-y-3">
        <h3 className="text-lg font-semibold">{isNew ? "Yangi modul" : "Modulni tahrirlash"}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">ID</label>
            <input
              className="input"
              value={m.id}
              disabled={!isNew}
              onChange={(e) => set({ id: e.target.value })}
              placeholder="masalan: discussion"
            />
          </div>
          <div>
            <label className="label">Tur (type)</label>
            <select className="input" value={m.type} onChange={(e) => set({ type: e.target.value })}>
              <option value="discussion">discussion</option>
              <option value="storytelling">storytelling</option>
              <option value="picture_narrating">picture_narrating</option>
              <option value="roleplay">roleplay</option>
              <option value="interview">interview</option>
            </select>
          </div>
          <div>
            <label className="label">Sarlavha (uz)</label>
            <input className="input" value={m.titleUz} onChange={(e) => set({ titleUz: e.target.value })} />
          </div>
          <div>
            <label className="label">Sarlavha (en)</label>
            <input className="input" value={m.titleEn} onChange={(e) => set({ titleEn: e.target.value })} />
          </div>
          <div>
            <label className="label">Emoji</label>
            <input className="input" value={m.emoji} onChange={(e) => set({ emoji: e.target.value })} />
          </div>
          <div>
            <label className="label">Tartib</label>
            <input
              className="input"
              type="number"
              value={m.sortOrder}
              onChange={(e) => set({ sortOrder: Number(e.target.value) })}
            />
          </div>
        </div>
        <div>
          <label className="label">Tavsif (uz)</label>
          <input
            className="input"
            value={m.descriptionUz}
            onChange={(e) => set({ descriptionUz: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={m.enabled}
            onChange={(e) => set({ enabled: e.target.checked })}
          />
          Ilovada ko'rsatilsin (enabled)
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Bekor
          </button>
          <button className="btn-primary" onClick={save} disabled={saving || !m.id || !m.titleUz}>
            {saving ? "Saqlanmoqda…" : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
