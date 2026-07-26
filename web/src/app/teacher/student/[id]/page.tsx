"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { downloadCsv } from "@/lib/csv";
import { Icon } from "@/components/Icon";

type Attempt = {
  id: number;
  moduleId: string;
  moduleTitle: string;
  exerciseId: string;
  exerciseTitle: string;
  overallScore: number;
  grammarScore: number | null;
  wordsPerMinute: number;
  wordCount: number;
  uniqueWordCount: number;
  durationSec: number;
  keywordCoverage: number;
  transcript: string;
  createdAt: string;
};

type StudentCard = {
  student: { id: string; name: string; classGroup: string };
  attempts: Attempt[];
};

export default function StudentDetailPage() {
  // Next route parametrini o'zi dekodlaydi — bu yerda qayta dekodlash kerak emas.
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<StudentCard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/api/teacher/student/${encodeURIComponent(id)}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Yuklanmadi"));
  }, [id]);

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-state-danger">{error}</p>
      </div>
    );
  }
  if (!data) return <p className="text-ink-muted">Yuklanmoqda…</p>;

  const { student, attempts } = data;
  const scores = attempts.map((a) => a.overallScore);
  const avg = scores.length
    ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
    : 0;
  const best = scores.length ? Math.max(...scores) : 0;
  const words = attempts.reduce((s, a) => s + a.wordCount, 0);

  // Mashq bo'yicha jamlanma — qaysi mavzu qiynayotgani shu yerdan ko'rinadi.
  const byExercise = new Map<string, { title: string; scores: number[] }>();
  for (const a of attempts) {
    const key = a.exerciseId || a.exerciseTitle;
    const entry = byExercise.get(key) ?? {
      title: a.exerciseTitle || a.exerciseId || "—",
      scores: [],
    };
    entry.scores.push(a.overallScore);
    byExercise.set(key, entry);
  }
  const exerciseRows = [...byExercise.values()]
    .map((e) => ({
      title: e.title,
      attempts: e.scores.length,
      best: Math.max(...e.scores),
      // Oxirgi urinish ro'yxat boshida turadi (createdAt bo'yicha kamayish tartibi).
      last: e.scores[0],
    }))
    .sort((a, b) => a.best - b.best);

  function exportCsv() {
    downloadCsv(
      `speakup-${(student.name || student.id).replace(/\s+/g, "-")}.csv`,
      ["Sana", "Modul", "Mashq", "Ball", "Grammatika", "WPM", "So'zlar", "Kalit so'z %", "Transkript"],
      attempts.map((a) => [
        new Date(a.createdAt).toLocaleString("uz"),
        a.moduleTitle,
        a.exerciseTitle,
        a.overallScore,
        a.grammarScore ?? "—",
        a.wordsPerMinute,
        a.wordCount,
        a.keywordCoverage,
        a.transcript,
      ]),
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {student.name || <span className="text-ink-muted">Ismsiz o&apos;quvchi</span>}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {student.classGroup ? `${student.classGroup} · ` : ""}
            <span className="font-mono text-xs">{student.id}</span>
          </p>
        </div>
        <button onClick={exportCsv} className="btn-ghost" disabled={attempts.length === 0}>
          <Icon name="download" size={16} />
          CSV yuklab olish
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Urinishlar" value={attempts.length} />
        <Stat label="O'rtacha ball" value={avg} suffix="/100" />
        <Stat label="Eng yaxshi" value={best} suffix="/100" />
        <Stat label="Jami so'zlar" value={words} />
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-1 font-semibold">Mashqlar bo&apos;yicha</h2>
        <p className="mb-3 text-sm text-ink-muted">
          Eng past natijadan boshlab — qaysi mavzuga qaytish kerakligi ko&apos;rinadi.
        </p>
        <table className="table-report">
          <thead>
            <tr>
              <th>Mashq</th>
              <th className="!text-right">Urinish</th>
              <th className="!text-right">Oxirgi</th>
              <th className="!text-right">Eng yaxshi</th>
            </tr>
          </thead>
          <tbody>
            {exerciseRows.map((r) => (
              <tr key={r.title}>
                <td>{r.title}</td>
                <td className="text-right">{r.attempts}</td>
                <td className="text-right">{r.last}</td>
                <td className="text-right font-medium">{r.best}</td>
              </tr>
            ))}
            {exerciseRows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-ink-muted">
                  Hali urinishlar yo&apos;q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <p className="section-title">Urinishlar tarixi</p>
        <div className="mt-3 space-y-3">
          {attempts.map((a) => (
            <AttemptCard key={a.id} attempt={a} />
          ))}
          {attempts.length === 0 && (
            <p className="card text-sm text-ink-muted">Hali urinishlar yo&apos;q</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AttemptCard({ attempt: a }: { attempt: Attempt }) {
  const tone =
    a.overallScore >= 80
      ? "bg-emerald-50 text-state-success"
      : a.overallScore >= 50
        ? "bg-navy-container text-navy"
        : "bg-gold-container text-gold-deep";

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-sm font-bold ${tone}`}
        >
          {a.overallScore}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{a.exerciseTitle || "—"}</p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {a.moduleTitle} · {new Date(a.createdAt).toLocaleString("uz")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-3 sm:grid-cols-5">
        <Metric label="WPM" value={a.wordsPerMinute} />
        <Metric label="So'zlar" value={a.wordCount} />
        <Metric label="Noyob so'z" value={a.uniqueWordCount} />
        <Metric label="Kalit so'z" value={`${a.keywordCoverage}%`} />
        <Metric label="Grammatika" value={a.grammarScore ?? "—"} />
      </div>

      {a.transcript && (
        <details className="mt-3 border-t border-line pt-3">
          <summary className="cursor-pointer text-sm font-medium text-ink-muted hover:text-navy">
            Transkript
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {a.transcript}
          </p>
        </details>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-lg font-bold leading-none text-ink">{value}</p>
      <p className="mt-1 text-overline uppercase text-ink-muted">{label}</p>
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

function BackLink() {
  return (
    <Link
      href="/teacher"
      className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-navy"
    >
      <Icon name="arrowLeft" size={16} />
      Progressga qaytish
    </Link>
  );
}
