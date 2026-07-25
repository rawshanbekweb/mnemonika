"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useContent } from "@/lib/use-content";
import { loadStudent } from "@/lib/student";
import { speak, stopSpeaking, useSpeechRecognition } from "@/lib/use-speech";
import { analyze, withGrammar, type GrammarReport, type SpeechResult } from "@/lib/speech-analyzer";
import type { Exercise } from "@/lib/content-types";

type Phase = "ready" | "recording" | "done";

export default function ExercisePage() {
  const params = useParams<{ moduleId: string; exerciseId: string }>();
  const moduleId = String(params.moduleId ?? "");
  const exerciseId = String(params.exerciseId ?? "");

  const { pack, error: contentError } = useContent();
  const speech = useSpeechRecognition();

  const [phase, setPhase] = useState<Phase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [checkingGrammar, setCheckingGrammar] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const exercise: Exercise | undefined = useMemo(
    () =>
      pack?.modules
        .find((m) => m.id === moduleId)
        ?.exercises.find((e) => e.id === exerciseId),
    [pack, moduleId, exerciseId],
  );

  const limit = exercise?.timeLimitSec ?? 60;

  // setTimeout ichida eng so'nggi qiymatlar kerak — state emas, ref o'qiymiz.
  const finalTextRef = useRef("");
  useEffect(() => {
    finalTextRef.current = speech.finalText;
  }, [speech.finalText]);

  const elapsedRef = useRef(0);
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  const saveAttempt = useCallback(
    async (r: SpeechResult) => {
      const profile = loadStudent();
      try {
        await fetch("/api/student/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: profile.id,
            studentName: profile.name,
            classGroup: profile.classGroup,
            moduleId,
            exerciseId,
            exerciseTitle: exercise?.title ?? "",
            overallScore: r.overallScore,
            grammarScore: r.grammarScore,
            wordsPerMinute: r.wordsPerMinute,
            wordCount: r.wordCount,
            uniqueWordCount: r.uniqueWordCount,
            durationSec: r.durationSec,
            keywordCoverage: r.keywordCoverage,
            transcript: r.transcript,
          }),
        });
      } catch {
        // Natija ekranda ko'rinaveradi — yuborilmagani mashqni buzmaydi.
      }
    },
    [moduleId, exerciseId, exercise],
  );

  const finish = useCallback(() => {
    speech.stop();
    setPhase("done");
    // Oxirgi natija kelib ulgurishi uchun qisqa kutamiz (Android'da ham shunday).
    window.setTimeout(async () => {
      const transcript = finalTextRef.current.trim();
      const seconds = Math.max(1, elapsedRef.current);
      const local = analyze(transcript, seconds, exercise?.keywords ?? []);
      setResult(local);

      if (local.wordCount === 0) return;

      // Grammatika (onlayn, bo'lmasa jimgina o'tkazamiz), keyin bitta marta saqlaymiz.
      setCheckingGrammar(true);
      let finalResult = local;
      try {
        const res = await fetch("/api/grammar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcript, wordCount: local.wordCount }),
        });
        const report = (await res.json()) as GrammarReport | null;
        if (report) finalResult = withGrammar(local, report);
      } catch {
        // grammatikasiz davom etamiz
      }
      setCheckingGrammar(false);
      setResult(finalResult);
      void saveAttempt(finalResult);
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise, saveAttempt]);

  // Yozish taymeri.
  useEffect(() => {
    if (phase !== "recording") return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Vaqt tugadi — avtomatik to'xtatamiz.
  useEffect(() => {
    if (phase === "recording" && elapsed >= limit) finish();
  }, [elapsed, phase, limit, finish]);

  // Mikrofon xatosi jiddiy bo'lsa yozishni to'xtatamiz.
  useEffect(() => {
    if (phase === "recording" && speech.error) {
      setPhase("ready");
      setElapsed(0);
    }
  }, [speech.error, phase]);

  const start = () => {
    stopSpeaking();
    setSpeaking(false);
    setResult(null);
    setElapsed(0);
    elapsedRef.current = 0;
    finalTextRef.current = "";
    speech.start();
    setPhase("recording");
  };

  const onListen = () => {
    if (!exercise) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(exercise.prompts.join(" ") || exercise.title, () => setSpeaking(false));
  };

  if (contentError) return <Centered>{contentError}</Centered>;
  if (!pack) return <Centered>Yuklanmoqda…</Centered>;
  if (!exercise) return <Centered>Mashq topilmadi.</Centered>;

  const liveText = [speech.finalText, speech.interimText].filter(Boolean).join(" ");
  const spokenNow = matchKeywords(liveText, exercise.keywords);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="rounded-3xl bg-hero-gradient p-5 text-white shadow-soft">
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
            aria-label="Orqaga"
          >
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{exercise.title}</h1>
            <p className="truncate text-sm text-white/85">{exercise.topic}</p>
          </div>
        </div>
      </header>

      {!speech.supported && (
        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">Bu brauzerda mikrofonli mashq ishlamaydi</p>
          <p className="mt-1">
            Chrome, Edge yoki Safari&apos;da oching. Savollar va struktura quyida
            ko&apos;rinadi — ularni ovoz chiqarib mashq qilsangiz ham bo&apos;ladi.
          </p>
        </div>
      )}

      {speech.error && (
        <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          ⚠️ {speech.error}
        </p>
      )}

      {/* Vizual ishoralar */}
      {exercise.visuals.length > 0 && (
        <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
          {exercise.visuals.map((v, i) => (
            <span
              key={i}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-4xl"
            >
              {v}
            </span>
          ))}
        </div>
      )}

      {/* Savollar + mnemonika */}
      <section className="card mt-5">
        <div className="flex items-start justify-between gap-3">
          <span className="pill-brand">{exercise.topic}</span>
          {exercise.prompts.length > 0 && (
            <button onClick={onListen} className="btn-ghost !px-3 !py-1.5 !text-xs">
              {speaking ? "⏹️ To'xtatish" : "🔊 Eshitish"}
            </button>
          )}
        </div>

        <ul className="mt-3 space-y-1.5">
          {exercise.prompts.map((p, i) => (
            <li key={i} className="text-[15px] text-ink">
              💬 {p}
            </li>
          ))}
        </ul>

        <h3 className="section-title mt-5">Struktura: {exercise.mnemonic.acronym}</h3>
        <ul className="mt-3 space-y-2">
          {exercise.mnemonic.steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-extrabold text-white">
                {s.letter}
              </span>
              <span className="text-sm font-semibold text-ink">{s.en}</span>
              <span className="text-xs text-ink-muted">· {s.uz}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Boshqaruv */}
      {phase === "ready" && (
        <div className="mt-6 text-center">
          <p className="text-[15px] text-ink">Tayyor bo&apos;lsang, mikrofonni bos va gapir</p>
          <p className="mt-1 text-xs text-ink-muted">(maksimal {limit} soniya)</p>
          <button
            onClick={start}
            disabled={!speech.supported}
            className="mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-full bg-brand-gradient text-4xl text-white shadow-soft transition hover:brightness-110 disabled:opacity-40"
            aria-label="Yozishni boshlash"
          >
            🎤
          </button>
        </div>
      )}

      {phase === "recording" && (
        <div className="mt-6">
          <p className="text-center font-bold text-coral">
            🔴 Yozilmoqda {elapsed}s / {limit}s
          </p>
          <div className="mx-auto mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-coral-gradient transition-all"
              style={{ width: `${Math.min(100, (elapsed / limit) * 100)}%` }}
            />
          </div>

          <button
            onClick={finish}
            className="mx-auto mt-5 flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-coral-gradient text-3xl text-white shadow-soft"
            aria-label="To'xtatish"
          >
            ⏹️
          </button>

          {exercise.keywords.length > 0 && (
            <div className="card mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Kalit so&apos;zlar: {spokenNow.size}/{exercise.keywords.length}
              </p>
              <KeywordChips keywords={exercise.keywords} spoken={spokenNow} />
            </div>
          )}

          {liveText && (
            <div className="card mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Nutqingiz
              </p>
              <p className="mt-1.5 text-[15px]">
                {speech.finalText}{" "}
                <span className="text-ink-muted">{speech.interimText}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {phase === "done" && result && (
        <Result
          result={result}
          keywords={exercise.keywords}
          checkingGrammar={checkingGrammar}
          onRetry={start}
        />
      )}

      <div className="h-10" />
    </div>
  );
}

function Result({
  result,
  keywords,
  checkingGrammar,
  onRetry,
}: {
  result: SpeechResult;
  keywords: string[];
  checkingGrammar: boolean;
  onRetry: () => void;
}) {
  const message =
    result.overallScore >= 80
      ? "Zo'r natija! 🎉"
      : result.overallScore >= 50
        ? "Yaxshi ish! 👍"
        : "Mashq qilishda davom et! 💪";

  if (result.wordCount === 0) {
    return (
      <div className="card mt-6 text-center">
        <p className="text-4xl">🤔</p>
        <p className="mt-2 font-semibold text-ink">Hech narsa eshitilmadi</p>
        <p className="mt-1 text-sm text-ink-muted">
          Mikrofonga yaqinroq va balandroq gapirib qayta urinib ko&apos;ring.
        </p>
        <button onClick={onRetry} className="btn-primary mt-4">
          🔁 Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="card flex flex-col items-center">
        <ScoreRing score={result.overallScore} />
        <p className="mt-3 font-bold text-brand">{message}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat value={result.wordCount} label="So'zlar" />
        <Stat value={result.uniqueWordCount} label="Noyob so'z" />
        <Stat value={result.wordsPerMinute} label="So'z/daqiqa" />
        <Stat value={`${result.durationSec}s`} label="Davomiylik" />
        <Stat
          value={`${result.matchedKeywords.length}/${result.totalKeywords}`}
          label={`Kalit so'zlar (${result.keywordCoverage}%)`}
        />
        <Stat
          value={result.grammarScore ?? (checkingGrammar ? "…" : "—")}
          label="Grammatika"
        />
      </div>

      {keywords.length > 0 && (
        <div className="card">
          <h3 className="section-title">
            Kalit so&apos;zlar ({result.matchedKeywords.length}/{keywords.length})
          </h3>
          <KeywordChips keywords={keywords} spoken={new Set(result.matchedKeywords)} />
        </div>
      )}

      {result.grammarIssues.length > 0 && (
        <div className="card">
          <h3 className="section-title">Grammatika e&apos;tibori</h3>
          <ul className="mt-3 space-y-1 text-sm text-ink">
            {result.grammarIssues.map((g, i) => (
              <li key={i}>• {g}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h3 className="section-title">Tavsiyalar</h3>
        <ul className="mt-3 space-y-1 text-sm text-ink">
          {result.feedback.map((f, i) => (
            <li key={i}>• {f}</li>
          ))}
        </ul>
      </div>

      {result.transcript && (
        <div className="card">
          <h3 className="section-title">Nutqingiz (matn)</h3>
          <p className="mt-3 text-sm text-ink-muted">{result.transcript}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onRetry} className="btn-ghost flex-1">
          🔁 Qayta urinish
        </button>
        <Link href="/student" className="btn-primary flex-1">
          Tugatish
        </Link>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const size = 128;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#6d28d9" : "#f43f5e";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e9e4f5"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold leading-none text-ink">{score}</span>
        <span className="text-xs text-ink-muted">/ 100</span>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-xl font-extrabold text-brand">{value}</p>
      <p className="mt-0.5 text-xs text-ink-muted">{label}</p>
    </div>
  );
}

function KeywordChips({ keywords, spoken }: { keywords: string[]; spoken: Set<string> }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {keywords.map((kw) => {
        const hit = spoken.has(kw);
        return (
          <span
            key={kw}
            className={
              hit
                ? "pill bg-emerald-100 text-emerald-700"
                : "pill bg-slate-100 text-ink-muted"
            }
          >
            {hit ? "✓ " : ""}
            {kw}
          </span>
        );
      })}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <p className="mt-16 text-center text-sm text-ink-muted">{children}</p>;
}

/** speech-analyzer'dagi qoida bilan bir xil moslashtirish. */
function matchKeywords(text: string, keywords: string[]): Set<string> {
  if (!text.trim()) return new Set();
  const lower = text.toLowerCase();
  return new Set(keywords.filter((k) => lower.includes(k.toLowerCase())));
}
