"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Progress = {
  totalAttempts: number;
  totalStudents: number;
  avgScore: number;
  avgWpm: number;
  byModule: { moduleId: string; attempts: number; avgScore: number }[];
  byStudent: {
    studentId: string;
    name: string;
    classGroup: string;
    attempts: number;
    avgScore: number;
    bestScore: number;
    words: number;
    lastActive: string;
  }[];
  recent: {
    id: number;
    studentId: string;
    studentName: string;
    classGroup: string;
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
  if (!p) return <p className="text-ink-muted">Yuklanmoqda…</p>;

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h1 className="text-2xl font-bold text-ink">O&apos;quvchilar progressi</h1>
        <p className="mt-1 text-sm text-ink-muted">Sinf faoliyati va natijalar</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Urinishlar" value={p.totalAttempts} />
        <Stat label="O'quvchilar" value={p.totalStudents} />
        <Stat label="O'rtacha ball" value={p.avgScore} suffix="/100" />
        <Stat label="O'rtacha WPM" value={p.avgWpm} />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Modul bo'yicha o'rtacha ball</h2>
        {p.byModule.length === 0 ? (
          <p className="text-sm text-ink-muted">Ma'lumot yo'q</p>
        ) : (
          <div className="space-y-2">
            {p.byModule.map((m) => (
              <div key={m.moduleId} className="flex items-center gap-3">
                <span className="w-40 truncate text-sm">{m.moduleId}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface-muted">
                  <div
                    className="h-2 bg-navy"
                    style={{ width: `${m.avgScore}%` }}
                  />
                </div>
                <span className="w-24 text-right text-sm text-ink-muted">
                  {m.avgScore}/100 ({m.attempts})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">O'quvchilar</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-overline uppercase text-ink-muted">
              <th className="py-2">O'quvchi</th>
              <th>Sinf</th>
              <th className="text-right">Urinish</th>
              <th className="text-right">O'rtacha</th>
              <th className="text-right">Eng yaxshi</th>
              <th className="text-right">So'zlar</th>
              <th className="text-right">Oxirgi faollik</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {p.byStudent.map((s) => (
              <tr key={s.studentId}>
                <td className="py-2 font-medium">
                  {s.name || <span className="text-ink-muted">Ismsiz ({s.studentId.slice(0, 10)}…)</span>}
                </td>
                <td className="text-ink-muted">{s.classGroup || "—"}</td>
                <td className="text-right">{s.attempts}</td>
                <td className="text-right font-medium">{s.avgScore}</td>
                <td className="text-right">{s.bestScore}</td>
                <td className="text-right text-ink-muted">{s.words}</td>
                <td className="text-right text-ink-muted">
                  {new Date(s.lastActive).toLocaleDateString("uz")}
                </td>
              </tr>
            ))}
            {p.byStudent.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-ink-muted">
                  Hali o'quvchilar yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">So'nggi urinishlar</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-overline uppercase text-ink-muted">
              <th className="py-2">Sana</th>
              <th>O'quvchi</th>
              <th>Mashq</th>
              <th className="text-right">Ball</th>
              <th className="text-right">WPM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {p.recent.map((a) => (
              <tr key={a.id}>
                <td className="py-2 text-ink-muted">
                  {new Date(a.createdAt).toLocaleString("uz")}
                </td>
                <td>
                  {a.studentName || <span className="text-ink-muted">{a.studentId}</span>}
                  {a.classGroup && <span className="ml-1 text-xs text-ink-muted">({a.classGroup})</span>}
                </td>
                <td>{a.exerciseTitle || a.moduleId}</td>
                <td className="text-right font-medium">{a.overallScore}</td>
                <td className="text-right">{a.wordsPerMinute}</td>
              </tr>
            ))}
            {p.recent.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-ink-muted">
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
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="card">
      <p className="text-3xl font-bold leading-none text-ink">
        {value}
        {suffix && <span className="text-sm font-normal text-ink-muted">{suffix}</span>}
      </p>
      <p className="mt-2 text-overline uppercase text-ink-muted">{label}</p>
    </div>
  );
}
