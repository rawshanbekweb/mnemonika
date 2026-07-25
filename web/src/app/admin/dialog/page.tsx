"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/client";
import StepsEditor from "@/components/StepsEditor";
import type { DialogRow, FullContent, MnemonicStep } from "@/lib/admin-types";

type TurnEdit = { characterLine: string; studentHint: string; expectedKeywords: string[] };
type DialogEdit = DialogRow & { turns: TurnEdit[] };

function blank(moduleId: string): DialogEdit {
  return {
    id: "",
    moduleId,
    topic: "",
    title: "",
    characterName: "",
    characterEmoji: "",
    intro: "",
    acronym: "",
    mnemonicSteps: [],
    visuals: [],
    sortOrder: 0,
    turns: [],
  };
}

function DialogEditor() {
  const router = useRouter();
  const sp = useSearchParams();
  const moduleId = sp.get("module") ?? "";
  const id = sp.get("id");
  const isNew = !id;

  const [d, setD] = useState<DialogEdit | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) {
      setD(blank(moduleId));
      return;
    }
    api.get("/api/admin/full").then((full: FullContent) => {
      const dg = full.dialogs.find((x) => x.id === id);
      if (!dg) return setD(blank(moduleId));
      const turns = full.turns
        .filter((t) => t.dialogId === id)
        .map((t) => ({
          characterLine: t.characterLine,
          studentHint: t.studentHint,
          expectedKeywords: t.expectedKeywords,
        }));
      setD({ ...dg, turns });
    });
  }, [id, isNew, moduleId]);

  if (!d) return <p className="text-ink-muted">Yuklanmoqda…</p>;
  const set = (patch: Partial<DialogEdit>) => setD((x) => ({ ...x!, ...patch }));

  const updTurn = (i: number, patch: Partial<TurnEdit>) =>
    set({ turns: d.turns.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) });
  const addTurn = () =>
    set({ turns: [...d.turns, { characterLine: "", studentHint: "", expectedKeywords: [] }] });
  const removeTurn = (i: number) => set({ turns: d.turns.filter((_, idx) => idx !== i) });

  async function save() {
    setSaving(true);
    setError("");
    try {
      if (isNew) await api.post("/api/admin/dialogs", d);
      else await api.put(`/api/admin/dialogs/${d!.id}`, d);
      router.push("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
      setSaving(false);
    }
  }

  async function del() {
    if (!confirm("Dialogni o'chirasizmi?")) return;
    await api.del(`/api/admin/dialogs/${d!.id}`);
    router.push("/admin");
  }

  return (
    <div className="space-y-5">
      <Link href="/admin" className="text-sm text-navy hover:underline">
        ← Kontentga qaytish
      </Link>
      <h1 className="text-2xl font-bold">{isNew ? "Yangi dialog" : "Dialogni tahrirlash"}</h1>

      <div className="card grid grid-cols-2 gap-3">
        <div>
          <label className="label">ID</label>
          <input className="input" value={d.id} disabled={!isNew} onChange={(e) => set({ id: e.target.value })} placeholder="roleplay_new_friend" />
        </div>
        <div>
          <label className="label">Modul ID</label>
          <input className="input" value={d.moduleId} onChange={(e) => set({ moduleId: e.target.value })} />
        </div>
        <div>
          <label className="label">Mavzu (topic)</label>
          <input className="input" value={d.topic} onChange={(e) => set({ topic: e.target.value })} />
        </div>
        <div>
          <label className="label">Sarlavha</label>
          <input className="input" value={d.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div>
          <label className="label">Personaj ismi</label>
          <input className="input" value={d.characterName} onChange={(e) => set({ characterName: e.target.value })} />
        </div>
        <div>
          <label className="label">Personaj emoji</label>
          <input className="input" value={d.characterEmoji} onChange={(e) => set({ characterEmoji: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="label">Kirish gapi (intro)</label>
          <input className="input" value={d.intro} onChange={(e) => set({ intro: e.target.value })} />
        </div>
        <div>
          <label className="label">Vizuallar (yangi qatordan)</label>
          <textarea className="input min-h-16" value={d.visuals.join("\n")} onChange={(e) => set({ visuals: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} />
        </div>
        <div>
          <label className="label">Tartib</label>
          <input className="input" type="number" value={d.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} />
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Mnemonika</h2>
        <div>
          <label className="label">Akronim</label>
          <input className="input w-40" value={d.acronym} onChange={(e) => set({ acronym: e.target.value })} placeholder="ACTORS" />
        </div>
        <StepsEditor steps={d.mnemonicSteps} onChange={(s: MnemonicStep[]) => set({ mnemonicSteps: s })} />
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Almashishlar (turns)</h2>
          <button className="btn-ghost" onClick={addTurn}>
            ＋ Almashish
          </button>
        </div>
        <p className="text-xs text-ink-muted">
          Rolli o'yin: avval <b>personaj gapi</b>, keyin o'quvchi javob beradi. Intervyu: avval{" "}
          <b>o'quvchi ishorasi</b> bo'yicha savol beradi, keyin personaj javobi.
        </p>
        {d.turns.map((t, i) => (
          <div key={i} className="rounded border border-line p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-muted">#{i + 1}</span>
              <button className="btn-danger px-3 py-1" onClick={() => removeTurn(i)}>
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="label">Personaj gapi (characterLine)</label>
                <input className="input" value={t.characterLine} onChange={(e) => updTurn(i, { characterLine: e.target.value })} />
              </div>
              <div>
                <label className="label">O'quvchi uchun ishora (studentHint)</label>
                <input className="input" value={t.studentHint} onChange={(e) => updTurn(i, { studentHint: e.target.value })} />
              </div>
              <div>
                <label className="label">Kutilgan kalit so'zlar (vergul bilan)</label>
                <input
                  className="input"
                  value={t.expectedKeywords.join(", ")}
                  onChange={(e) => updTurn(i, { expectedKeywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-between">
        {!isNew ? (
          <button className="btn-danger" onClick={del}>
            O'chirish
          </button>
        ) : (
          <span />
        )}
        <button className="btn-primary" onClick={save} disabled={saving || !d.id || !d.title}>
          {saving ? "Saqlanmoqda…" : "Saqlash"}
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Yuklanmoqda…</p>}>
      <DialogEditor />
    </Suspense>
  );
}
