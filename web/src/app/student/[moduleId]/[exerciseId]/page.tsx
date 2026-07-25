"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useContent } from "@/lib/use-content";
import { loadStudent } from "@/lib/student";
import { saveAttempt as saveAttemptLocally } from "@/lib/attempts-store";
import { speak, stopSpeaking, useSpeechRecognition } from "@/lib/use-speech";
import { analyze, withGrammar, type GrammarReport, type SpeechResult } from "@/lib/speech-analyzer";
import { matchedKeywords } from "@/lib/keyword-matcher";
import type { Exercise } from "@/lib/content-types";
import { Icon } from "@/components/Icon";
import { Visual } from "@/components/Visual";

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

      // Avval mahalliy saqlaymiz — progress sahifasi shundan hisoblanadi va
      // internet bo'lmasa ham natija yo'qolmaydi.
      saveAttemptLocally({
        moduleId,
        exerciseId,
        exerciseTitle: exercise?.title ?? "",
        overallScore: r.overallScore,
        wordCount: r.wordCount,
        uniqueWordCount: r.uniqueWordCount,
        wordsPerMinute: r.wordsPerMinute,
        durationSec: r.durationSec,
        keywordCoverage: r.keywordCoverage,
        grammarScore: r.grammarScore,
      });

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
      const local = analyze(
        transcript,
        seconds,
        exercise?.keywords ?? [],
        // takeAlternatives barqaror (useCallback + ref), shuning uchun eskirmaydi.
        speech.takeAlternatives(),
      );
      setResult(local);

      if (local.wordCount === 0) return;

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

  useEffect(() => {
    if (phase !== "recording") return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "recording" && elapsed >= limit) finish();
  }, [elapsed, phase, limit, finish]);

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
  const spokenNow = new Set(matchedKeywords(liveText, exercise.keywords));

  return (
    <div>
      <header className="bg-navy px-4 py-4 text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/student"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
            aria-label="Orqaga"
          >
            <Icon name="arrowLeft" size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-semibold">{exercise.title}</h1>
            <p className="truncate text-sm text-white/70">{exercise.topic}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5">
        {!speech.supported && (
          <div className="mb-5 flex gap-3 rounded border border-gold/40 bg-gold-container p-4 text-sm">
            <Icon name="warning" size={18} className="mt-0.5 shrink-0 text-gold-deep" />
            <div>
              <p className="font-semibold text-ink">
                Bu brauzerda mikrofonli mashq ishlamaydi
              </p>
              <p className="mt-1 text-ink-muted">
                Chrome, Edge yoki Safari&apos;da oching. Savollar va struktura quyida
                ko&apos;rinadi.
              </p>
            </div>
          </div>
        )}

        {speech.error && (
          <div className="mb-5 flex gap-3 rounded border border-line bg-surface-muted p-4 text-sm">
            <Icon name="warning" size={18} className="mt-0.5 shrink-0 text-state-danger" />
            <p className="text-ink">{speech.error}</p>
          </div>
        )}

        {exercise.visuals.length > 0 && (
          <div className="mb-5 flex gap-2.5 overflow-x-auto pb-1">
            {exercise.visuals.map((v, i) => (
              <Visual key={i} token={v} size={84} />
            ))}
          </div>
        )}

        <section className="card">
          <div className="flex items-start justify-between gap-3">
            <span className="pill-brand">{exercise.topic}</span>
            {exercise.prompts.length > 0 && (
              <button onClick={onListen} className="btn-ghost !px-3 !py-1.5 !text-xs">
                <Icon name={speaking ? "volumeOff" : "volumeUp"} size={15} />
                {speaking ? "To'xtatish" : "Eshitish"}
              </button>
            )}
          </div>

          <ol className="mt-4 space-y-2">
            {exercise.prompts.map((p, i) => (
              <li key={i} className="flex gap-3 text-[15px] text-ink">
                <span className="text-ink-muted">{i + 1}.</span>
                <span>{p}</span>
              </li>
            ))}
          </ol>

          <p className="section-title mt-6">Struktura · {exercise.mnemonic.acronym}</p>
          <ul className="mt-3 space-y-2.5">
            {exercise.mnemonic.steps.map((s, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-navy text-[11px] font-bold text-white">
                  {s.letter.toUpperCase()}
                </span>
                <span className="text-sm font-medium text-ink">{s.en}</span>
                <span className="text-xs text-ink-muted">· {s.uz}</span>
              </li>
            ))}
          </ul>
        </section>

        {phase === "ready" && (
          <div className="mt-6 text-center">
            <p className="text-[15px] text-ink">
              Tayyor bo&apos;lsangiz mikrofonni bosing va gapiring
            </p>
            <p className="mt-1 overline">Maksimal {limit} soniya</p>
            <button
              onClick={start}
              disabled={!speech.supported}
              className="mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full bg-navy text-white transition hover:bg-navy-deep disabled:opacity-30"
              aria-label="Yozishni boshlash"
            >
              <Icon name="mic" size={30} />
            </button>
          </div>
        )}

        {phase === "recording" && (
          <div className="mt-6">
            <div className="flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-state-danger" />
              <span className="text-overline font-semibold uppercase text-state-danger">
                Yozilmoqda · {elapsed}s / {limit}s
              </span>
            </div>
            <div className="mx-auto mt-3 h-1.5 w-full overflow-hidden rounded-sm bg-surface-muted">
              <div
                className="h-full bg-state-danger transition-all"
                style={{ width: `${Math.min(100, (elapsed / limit) * 100)}%` }}
              />
            </div>

            <button
              onClick={finish}
              className="mx-auto mt-5 flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-state-danger text-white"
              aria-label="To'xtatish"
            >
              <Icon name="stop" size={28} />
            </button>

            {exercise.keywords.length > 0 && (
              <div className="card mt-6">
                <p className="section-title">
                  Kalit so&apos;zlar · {spokenNow.size}/{exercise.keywords.length}
                </p>
                <KeywordChips keywords={exercise.keywords} spoken={spokenNow} />
              </div>
            )}

            {liveText && (
              <div className="card mt-4">
                <p className="section-title">Nutqingiz</p>
                <p className="mt-3 text-[15px]">
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
      ? "A'lo natija"
      : result.overallScore >= 50
        ? "Yaxshi natija"
        : "Mashq qilishda davom eting";

  if (result.wordCount === 0) {
    return (
      <div className="card mt-6 text-center">
        <p className="font-semibold text-ink">Hech narsa eshitilmadi</p>
        <p className="mt-1 text-sm text-ink-muted">
          Mikrofonga yaqinroq va balandroq gapirib qayta urinib ko&apos;ring.
        </p>
        <button onClick={onRetry} className="btn-primary mt-4">
          <Icon name="refresh" size={16} />
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="card flex flex-col items-center">
        <ScoreRing score={result.overallScore} />
        <p className="mt-3 font-semibold text-navy">{message}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat value={result.wordCount} label="So'zlar" />
        <Stat value={result.uniqueWordCount} label="Noyob so'z" />
        <Stat value={result.wordsPerMinute} label="So'z/daqiqa" />
        <Stat value={`${result.durationSec}s`} label="Davomiylik" />
        <Stat
          value={`${result.matchedKeywords.length}/${result.totalKeywords}`}
          label="Kalit so'zlar"
        />
        <Stat
          value={result.grammarScore ?? (checkingGrammar ? "…" : "—")}
          label="Grammatika"
        />
      </div>

      {keywords.length > 0 && (
        <div className="card">
          <p className="section-title">
            Kalit so&apos;zlar · {result.matchedKeywords.length}/{keywords.length}
          </p>
          <KeywordChips keywords={keywords} spoken={new Set(result.matchedKeywords)} />
        </div>
      )}

      {result.grammarIssues.length > 0 && (
        <div className="card">
          <p className="section-title">Grammatika e&apos;tibori</p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink">
            {result.grammarIssues.map((g, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-ink-muted">—</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <p className="section-title">Tavsiyalar</p>
        <ul className="mt-3 space-y-1.5 text-sm text-ink">
          {result.feedback.map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-ink-muted">—</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {result.transcript && (
        <div className="card">
          <p className="section-title">Nutqingiz (matn)</p>
          <p className="mt-3 text-sm text-ink-muted">{result.transcript}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onRetry} className="btn-ghost flex-1">
          <Icon name="refresh" size={16} />
          Qayta urinish
        </button>
        <Link href="/student" className="btn-primary flex-1">
          Tugatish
        </Link>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const size = 120;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const color = score >= 80 ? "#2F855A" : score >= 50 ? "#1E3A5F" : "#B7791F";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#DCE3EA" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold leading-none text-ink">{score}</span>
        <span className="mt-1 text-overline uppercase text-ink-muted">100 dan</span>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded border border-line bg-white p-4">
      <p className="text-xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-overline uppercase text-ink-muted">{label}</p>
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
            className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs ${
              hit
                ? "bg-emerald-50 font-semibold text-state-success"
                : "bg-surface-muted text-ink-muted"
            }`}
          >
            {hit && <Icon name="check" size={12} />}
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
