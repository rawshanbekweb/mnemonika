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
      <h1 className="text-2xl font-bold">O'quvchilar progressi</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Urinishlar" value={p.totalAttempts} />
        <Stat label="O'quvchilar" value={p.totalStudents} />
        <Stat label="O'rtacha ball" value={p.avgScore} suffix="/100" />
        <Stat label="O'rtacha WPM" value={p.avgWpm} />
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
                    className="h-3 rounded-full bg-brand"
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

function Stat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {value}
        {suffix && <span className="text-base font-normal text-slate-400">{suffix}</span>}
      </p>
    </div>
  );
}
