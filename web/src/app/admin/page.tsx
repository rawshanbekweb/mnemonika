"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import type { FullContent, ModuleRow } from "@/lib/admin-types";

// Modul urg'u ranglari — Android'dagi accentColorFor bilan bir xil.
const MODULE_COLOR: Record<string, string> = {
  discussion: "#1E3A5F",
  roleplay: "#7B341E",
  storytelling: "#2C5282",
  interview: "#A07E14",
  picture_narrating: "#2F855A",
};
const moduleColor = (type: string) => MODULE_COLOR[type] ?? "#1E3A5F";

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
  if (!data) return <p className="text-ink-muted">Yuklanmoqda…</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Kontent boshqaruvi</h1>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-ink-muted">
            <span className="pill-brand">Versiya {data.version}</span>
            {data.publishedAt && <span>{new Date(data.publishedAt).toLocaleString("uz")}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-ghost"
            onClick={() => {
              setEditing({ ...EMPTY_MODULE, sortOrder: data.modules.length });
              setIsNew(true);
            }}
          >
Yangi modul
          </button>
          <button className="btn-primary" onClick={publish} disabled={publishing}>
            {publishing ? "Nashr…" : "Nashr qilish"}
          </button>
        </div>
      </div>

      {msg && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
      <p className="text-xs text-ink-muted">
        O'zgarishlar bazaga darhol saqlanadi, lekin ilova ularni faqat{" "}
        <b>Nashr qilish</b> bosilib versiya oshgandan keyin yuklaydi.
      </p>

      {data.modules.map((m) => {
        const exs = data.exercises.filter((e) => e.moduleId === m.id);
        const digs = data.dialogs.filter((d) => d.moduleId === m.id);
        return (
          <div key={m.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-sm text-lg font-bold text-white"
                  style={{ backgroundColor: moduleColor(m.type) }}
                >
                  {m.titleUz.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    {m.titleUz}
                    {!m.enabled && (
                      <span className="rounded-sm bg-surface-muted px-2 py-0.5 text-xs text-ink-muted">
                        o&apos;chirilgan
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-ink-muted">
                    {m.type} · {m.id}
                  </p>
                </div>
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
                // "Takrorlang" mashqida akronim bo'sh — turi ko'rinib tursin.
                sub: e.targetText?.trim() ? "Takrorlang" : e.acronym,
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
    <div className="rounded bg-surface-muted p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {title} ({items.length})
        </span>
        <Link href={addHref} className="text-sm font-medium text-navy hover:underline">
          ＋ Yangi
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">Hali yo'q</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm">
                {it.label} <span className="text-xs text-ink-muted">{it.sub}</span>
              </span>
              <Link href={it.href} className="text-sm text-navy hover:underline">
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
