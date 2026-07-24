"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Progress = {
  totalAttempts: number;
  totalStudents: number;
  avgScore: number;
  avgWpm: number;
  byModule: { moduleId: string; attempts: number; avgScore: number }[];
  recent: {
    id: number;
    studentId: string;
    exerciseTitle: string;
    moduleId: string;
    overallScore: number;
    wordsPerMinute: number;
    createdAt: string;
  }[];
};

export default function TeacherPage() {
  const [p, setP] = useState<Progress | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/teacher/progress")
      .then(setP)
      .catch((e) => setError(e instanceof Error ? e.message : "Yuklanmadi"));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!p) return <p className="text-slate-500">Yuklanmoqda…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-hero-gradient text-2xl shadow-soft">
          📊
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">O'quvchilar progressi</h1>
          <p className="text-sm text-ink-muted">Sinf faoliyati va natijalar</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon="📝" label="Urinishlar" value={p.totalAttempts} grad="linear-gradient(135deg,#8b5cf6,#6d28d9)" />
        <Stat icon="👦" label="O'quvchilar" value={p.totalStudents} grad="linear-gradient(135deg,#38bdf8,#0ea5e9)" />
        <Stat icon="⭐" label="O'rtacha ball" value={p.avgScore} suffix="/100" grad="linear-gradient(135deg,#34d399,#10b981)" />
        <Stat icon="⚡" label="O'rtacha WPM" value={p.avgWpm} grad="linear-gradient(135deg,#fb7185,#f43f5e)" />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Modul bo'yicha o'rtacha ball</h2>
        {p.byModule.length === 0 ? (
          <p className="text-sm text-slate-400">Ma'lumot yo'q</p>
        ) : (
          <div className="space-y-2">
            {p.byModule.map((m) => (
              <div key={m.moduleId} className="flex items-center gap-3">
                <span className="w-40 truncate text-sm">{m.moduleId}</span>
                <div className="h-3 flex-1 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-brand-gradient"
                    style={{ width: `${m.avgScore}%` }}
                  />
                </div>
                <span className="w-24 text-right text-sm text-slate-500">
                  {m.avgScore}/100 ({m.attempts})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">So'nggi urinishlar</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500">
              <th className="py-2">Sana</th>
              <th>O'quvchi</th>
              <th>Mashq</th>
              <th className="text-right">Ball</th>
              <th className="text-right">WPM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {p.recent.map((a) => (
              <tr key={a.id}>
                <td className="py-2 text-slate-500">
                  {new Date(a.createdAt).toLocaleString("uz")}
                </td>
                <td>{a.studentId}</td>
                <td>{a.exerciseTitle || a.moduleId}</td>
                <td className="text-right font-medium">{a.overallScore}</td>
                <td className="text-right">{a.wordsPerMinute}</td>
              </tr>
            ))}
            {p.recent.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400">
                  Hali urinishlar yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  icon,
  grad,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: string;
  grad: string;
}) {
  return (
    <div className="card flex items-center gap-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl shadow-soft"
        style={{ backgroundImage: grad }}
      >
        {icon}
      </div>
      <div>
        <p className="text-3xl font-extrabold leading-none text-ink">
          {value}
          {suffix && <span className="text-sm font-medium text-ink-muted">{suffix}</span>}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      </div>
    </div>
  );
}
