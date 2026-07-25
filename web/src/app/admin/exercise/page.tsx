"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/client";
import StepsEditor from "@/components/StepsEditor";
import type { ExerciseRow, FullContent, MnemonicStep } from "@/lib/admin-types";

function blank(moduleId: string): ExerciseRow {
  return {
    id: "",
    moduleId,
    topic: "",
    title: "",
    acronym: "",
    mnemonicSteps: [],
    prompts: [],
    keywords: [],
    visuals: [],
    timeLimitSec: 60,
    sortOrder: 0,
  };
}

function ExerciseEditor() {
  const router = useRouter();
  const sp = useSearchParams();
  const moduleId = sp.get("module") ?? "";
  const id = sp.get("id");
  const isNew = !id;

  const [ex, setEx] = useState<ExerciseRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) {
      setEx(blank(moduleId));
      return;
    }
    api.get("/api/admin/full").then((d: FullContent) => {
      const found = d.exercises.find((e) => e.id === id);
      setEx(found ?? blank(moduleId));
    });
  }, [id, isNew, moduleId]);

  if (!ex) return <p className="text-ink-muted">Yuklanmoqda…</p>;
  const set = (patch: Partial<ExerciseRow>) => setEx((x) => ({ ...x!, ...patch }));

  async function save() {
    setSaving(true);
    setError("");
    try {
      if (isNew) await api.post("/api/admin/exercises", ex);
      else await api.put(`/api/admin/exercises/${ex!.id}`, ex);
      router.push("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
      setSaving(false);
    }
  }

  async function del() {
    if (!confirm("Mashqni o'chirasizmi?")) return;
    await api.del(`/api/admin/exercises/${ex!.id}`);
    router.push("/admin");
  }

  return (
    <div className="space-y-5">
      <Link href="/admin" className="text-sm text-navy hover:underline">
        ← Kontentga qaytish
      </Link>
      <h1 className="text-2xl font-bold">{isNew ? "Yangi mashq" : "Mashqni tahrirlash"}</h1>

      <div className="card grid grid-cols-2 gap-3">
        <div>
          <label className="label">ID</label>
          <input className="input" value={ex.id} disabled={!isNew} onChange={(e) => set({ id: e.target.value })} placeholder="discussion_family_pets_dream" />
        </div>
        <div>
          <label className="label">Modul ID</label>
          <input className="input" value={ex.moduleId} onChange={(e) => set({ moduleId: e.target.value })} />
        </div>
        <div>
          <label className="label">Mavzu (topic)</label>
          <input className="input" value={ex.topic} onChange={(e) => set({ topic: e.target.value })} />
        </div>
        <div>
          <label className="label">Sarlavha</label>
          <input className="input" value={ex.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div>
          <label className="label">Taymer (soniya)</label>
          <input className="input" type="number" value={ex.timeLimitSec} onChange={(e) => set({ timeLimitSec: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">Tartib</label>
          <input className="input" type="number" value={ex.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} />
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Mnemonika</h2>
        <div>
          <label className="label">Akronim</label>
          <input className="input w-40" value={ex.acronym} onChange={(e) => set({ acronym: e.target.value })} placeholder="PETS" />
        </div>
        <StepsEditor steps={ex.mnemonicSteps} onChange={(s: MnemonicStep[]) => set({ mnemonicSteps: s })} />
      </div>

      <div className="card space-y-3">
        <ListArea label="Promptlar (har biri yangi qatordan)" value={ex.prompts} onChange={(v) => set({ prompts: v })} />
        <ListArea label="Kalit so'zlar (vergul yoki yangi qator)" value={ex.keywords} onChange={(v) => set({ keywords: v })} />
        <ListArea label="Vizuallar — emoji yoki rasm URL (yangi qatordan)" value={ex.visuals} onChange={(v) => set({ visuals: v })} />
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
        <button className="btn-primary" onClick={save} disabled={saving || !ex.id || !ex.title}>
          {saving ? "Saqlanmoqda…" : "Saqlash"}
        </button>
      </div>
    </div>
  );
}

/** Massivni satrlar bilan tahrirlaydigan textarea. */
function ListArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea
        className="input min-h-20"
        value={value.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Yuklanmoqda…</p>}>
      <ExerciseEditor />
    </Suspense>
  );
}
