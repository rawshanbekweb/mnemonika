"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { downloadCsv } from "@/lib/csv";
import { Icon } from "@/components/Icon";

type StudentRow = {
  studentId: string;
  name: string;
  classGroup: string;
  attempts: number;
  avgScore: number;
  bestScore: number;
  words: number;
  lastActive: string;
};

type Progress = {
  totalAttempts: number;
  totalStudents: number;
  avgScore: number;
  avgWpm: number;
  classes: string[];
  byModule: { moduleId: string; moduleTitle: string; attempts: number; avgScore: number }[];
  byStudent: StudentRow[];
  recent: {
    id: number;
    studentId: string;
    studentName: string;
    classGroup: string;
    exerciseTitle: string;
    moduleId: string;
    moduleTitle: string;
    overallScore: number;
    wordsPerMinute: number;
    createdAt: string;
  }[];
};

const PERIODS = [
  { days: 7, label: "Oxirgi 7 kun" },
  { days: 30, label: "Oxirgi 30 kun" },
  { days: 0, label: "Butun davr" },
];

export default function TeacherPage() {
  const [p, setP] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [classGroup, setClassGroup] = useState("");
  const [days, setDays] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (classGroup) params.set("class", classGroup);
    if (days > 0) params.set("days", String(days));

    let cancelled = false;
    setLoading(true);
    api
      .get(`/api/teacher/progress?${params}`)
      .then((d) => {
        if (!cancelled) {
          setP(d);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Yuklanmadi");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // Filtr tez almashtirilsa eski javob yangisining ustiga tushmasligi uchun.
    return () => {
      cancelled = true;
    };
  }, [classGroup, days]);

  function exportCsv() {
    if (!p) return;
    const suffix = [classGroup || "barcha-sinf", days > 0 ? `${days}kun` : "butun-davr"];
    downloadCsv(
      `speakup-oquvchilar-${suffix.join("-")}.csv`,
      ["O'quvchi", "Sinf", "Urinish", "O'rtacha ball", "Eng yaxshi", "So'zlar", "Oxirgi faollik"],
      p.byStudent.map((s) => [
        s.name || s.studentId,
        s.classGroup,
        s.attempts,
        s.avgScore,
        s.bestScore,
        s.words,
        new Date(s.lastActive).toLocaleDateString("uz"),
      ]),
    );
  }

  if (error) return <p className="text-state-danger">{error}</p>;
  if (!p) return <p className="text-ink-muted">Yuklanmoqda…</p>;

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h1 className="text-2xl font-bold text-ink">O&apos;quvchilar progressi</h1>
        <p className="mt-1 text-sm text-ink-muted">Sinf faoliyati va natijalar</p>
      </div>

      <div className="card flex flex-wrap items-end gap-4">
        <div>
          <label className="label" htmlFor="class">
            Sinf
          </label>
          <select
            id="class"
            className="input w-44"
            value={classGroup}
            onChange={(e) => setClassGroup(e.target.value)}
          >
            <option value="">Barcha sinflar</option>
            {p.classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="period">
            Davr
          </label>
          <select
            id="period"
            className="input w-44"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {PERIODS.map((o) => (
              <option key={o.days} value={o.days}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={exportCsv}
          className="btn-ghost ml-auto"
          disabled={p.byStudent.length === 0}
        >
          <Icon name="download" size={16} />
          CSV yuklab olish
        </button>
      </div>

      {loading && <p className="text-sm text-ink-muted">Yangilanmoqda…</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Urinishlar" value={p.totalAttempts} />
        <Stat label="O'quvchilar" value={p.totalStudents} />
        <Stat label="O'rtacha ball" value={p.avgScore} suffix="/100" />
        <Stat label="O'rtacha WPM" value={p.avgWpm} />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Modul bo&apos;yicha o&apos;rtacha ball</h2>
        {p.byModule.length === 0 ? (
          <p className="text-sm text-ink-muted">Ma&apos;lumot yo&apos;q</p>
        ) : (
          <div className="space-y-2">
            {p.byModule.map((m) => (
              <div key={m.moduleId} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm">{m.moduleTitle}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface-muted">
                  <div className="h-2 bg-navy" style={{ width: `${m.avgScore}%` }} />
                </div>
                <span className="w-24 shrink-0 text-right text-sm text-ink-muted">
                  {m.avgScore}/100 ({m.attempts})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">O&apos;quvchilar</h2>
        <table className="table-report">
          <thead>
            <tr>
              <th>O&apos;quvchi</th>
              <th>Sinf</th>
              <th className="!text-right">Urinish</th>
              <th className="!text-right">O&apos;rtacha</th>
              <th className="!text-right">Eng yaxshi</th>
              <th className="!text-right">So&apos;zlar</th>
              <th className="!text-right">Oxirgi faollik</th>
            </tr>
          </thead>
          <tbody>
            {p.byStudent.map((s) => (
              <tr key={s.studentId} className="hover:bg-surface-muted/60">
                <td className="font-medium">
                  <Link
                    href={`/teacher/student/${encodeURIComponent(s.studentId)}`}
                    className="flex items-center gap-1 hover:text-navy hover:underline"
                  >
                    {s.name || (
                      <span className="text-ink-muted">Ismsiz ({s.studentId.slice(0, 10)}…)</span>
                    )}
                    <Icon name="chevronRight" size={15} className="text-line" />
                  </Link>
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
                  Tanlangan filtr bo&apos;yicha o&apos;quvchi yo&apos;q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">So&apos;nggi urinishlar</h2>
        <table className="table-report">
          <thead>
            <tr>
              <th>Sana</th>
              <th>O&apos;quvchi</th>
              <th>Mashq</th>
              <th>Modul</th>
              <th className="!text-right">Ball</th>
              <th className="!text-right">WPM</th>
            </tr>
          </thead>
          <tbody>
            {p.recent.map((a) => (
              <tr key={a.id}>
                <td className="whitespace-nowrap text-ink-muted">
                  {new Date(a.createdAt).toLocaleString("uz")}
                </td>
                <td>
                  <Link
                    href={`/teacher/student/${encodeURIComponent(a.studentId)}`}
                    className="hover:text-navy hover:underline"
                  >
                    {a.studentName || a.studentId}
                  </Link>
                  {a.classGroup && (
                    <span className="ml-1 text-xs text-ink-muted">({a.classGroup})</span>
                  )}
                </td>
                <td>{a.exerciseTitle || "—"}</td>
                <td className="text-ink-muted">{a.moduleTitle}</td>
                <td className="text-right font-medium">{a.overallScore}</td>
                <td className="text-right">{a.wordsPerMinute}</td>
              </tr>
            ))}
            {p.recent.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-ink-muted">
                  Hali urinishlar yo&apos;q
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
      <p className="text-3xl font-bold leading-none text-ink">
        {value}
        {suffix && <span className="text-sm font-normal text-ink-muted">{suffix}</span>}
      </p>
      <p className="mt-2 text-overline uppercase text-ink-muted">{label}</p>
    </div>
  );
}
