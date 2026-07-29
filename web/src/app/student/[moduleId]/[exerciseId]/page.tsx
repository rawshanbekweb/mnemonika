"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useContent } from "@/lib/use-content";
import { loadStudent } from "@/lib/student";
import { saveAttempt as saveAttemptLocally } from "@/lib/attempts-store";
import { type AudioCue, playCues, stopSpeaking, useSpeechRecognition } from "@/lib/use-speech";
import { analyze, withGrammar, type GrammarReport, type SpeechResult } from "@/lib/speech-analyzer";
import { analyzeReadAloud, type ReadAloudResult } from "@/lib/read-aloud";
import { matchedKeywords } from "@/lib/keyword-matcher";
import type { Exercise } from "@/lib/content-types";
import { Icon } from "@/components/Icon";
import {
  Mascot,
  MascotSays,
  mascotFor,
  moodForScore,
  type MascotLook,
} from "@/components/Mascot";
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
  const [readResult, setReadResult] = useState<ReadAloudResult | null>(null);
  const [checkingGrammar, setCheckingGrammar] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const module = useMemo(
    () => pack?.modules.find((m) => m.id === moduleId),
    [pack, moduleId],
  );
  const exercise: Exercise | undefined = useMemo(
    () => module?.exercises.find((e) => e.id === exerciseId),
    [module, exerciseId],
  );
  // Modul do'sti — Android'dagi bilan bir xil (Mascot.tsx = Mascot.kt porti).
  const friend = useMemo(() => mascotFor(module?.type ?? ""), [module]);

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

      // "Takrorlang" mashqi: kutilgan matn ma'lum, so'zma-so'z solishtiramiz.
      // Grammatika tekshirilmaydi — matn bolaniki emas, bizniki.
      const target = exercise?.targetText ?? "";
      if (target.trim() !== "") {
        const read = analyzeReadAloud(target, transcript, seconds, speech.takeAlternatives());
        setReadResult(read);
        const spokenWords = transcript.split(/\s+/).filter(Boolean);
        const asResult: SpeechResult = {
          transcript,
          wordCount: spokenWords.length,
          uniqueWordCount: new Set(spokenWords.map((w) => w.toLowerCase())).size,
          durationSec: seconds,
          wordsPerMinute: Math.floor((spokenWords.length * 60) / seconds),
          // Aniq o'qilgan so'zlar "kalit so'z" o'rnida saqlanadi — shunda
          // o'qituvchi panelidagi qamrov ustuni o'qish aniqligini ko'rsatadi.
          matchedKeywords: read.words.filter((w) => w.status === "CORRECT").map((w) => w.word),
          totalKeywords: read.targetCount,
          overallScore: read.accuracy,
          feedback: read.tips.map((t) => t.detail),
          grammarScore: null,
          grammarIssues: [],
          keywordCoverage: read.accuracy,
          tips: read.tips,
        };
        setResult(asResult);
        if (spokenWords.length > 0) void saveAttempt(asResult);
        return;
      }

      const local = analyze(
        transcript,
        seconds,
        exercise?.keywords ?? [],
        // takeAlternatives barqaror (useCallback + ref), shuning uchun eskirmaydi.
        speech.takeAlternatives(),
        // Murabbiy struktura bo'yicha maslahat bera olishi uchun.
        exercise?.mnemonic.steps.map((s) => s.en) ?? [],
        // Mashqqa xos maslahat banki — bo'sh bo'lsa umumiy matnlar ishlatiladi.
        exercise?.structureTips ?? [],
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
        // `res.ok` tekshiruvi SHART: 429 (tezlik cheklovi) yoki xato holatida
        // tana `{error: "..."}` bo'ladi, uni hisobotdek qabul qilsak ball NaN
        // bo'lib ketardi. Grammatikasiz baholash allaqachon to'g'ri ishlaydi.
        const report = res.ok ? ((await res.json()) as GrammarReport | null) : null;
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

  const isReadAloud = (exercise?.targetText ?? "").trim() !== "";

  const start = () => {
    stopSpeaking();
    setSpeaking(false);
    setResult(null);
    setReadResult(null);
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
    // "Takrorlang" mashqida namunani eshitish — mashqning asosiy qismi:
    // bola avval to'g'ri talaffuzni eshitadi, keyin takrorlaydi.
    //
    // Yaratilgan audio bo'lsa u ijro etiladi (tabiiy talaffuz), bo'lmasa
    // brauzer TTS'i. Savollar alohida klip — orasida pauza qoladi.
    const cues: AudioCue[] = isReadAloud
      ? [{ url: exercise.targetAudioUrl, text: exercise.targetText }]
      : exercise.prompts.length > 0
        ? exercise.prompts.map((p, i) => ({ url: exercise.promptsAudio[i] ?? "", text: p }))
        : [{ url: "", text: exercise.title }];
    playCues(cues, () => setSpeaking(false));
  };

  if (contentError) return <Centered>{contentError}</Centered>;
  if (!pack) return <Centered>Yuklanmoqda…</Centered>;
  if (!exercise) return <Centered>Mashq topilmadi.</Centered>;

  const liveText = [speech.finalText, speech.interimText].filter(Boolean).join(" ");
  const spokenNow = new Set(matchedKeywords(liveText, exercise.keywords));

  return (
    <div className="pattern-page min-h-screen">
      <header className="hero-navy px-4 py-4 text-white">
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
            {(isReadAloud || exercise.prompts.length > 0) && (
              <button onClick={onListen} className="btn-ghost !px-3 !py-1.5 !text-xs">
                <Icon name={speaking ? "volumeOff" : "volumeUp"} size={15} />
                {speaking ? "To'xtatish" : isReadAloud ? "Namunani eshitish" : "Eshitish"}
              </button>
            )}
          </div>

          {isReadAloud ? (
            <>
              <p className="section-title mt-5">Shu jumlani o&apos;qing</p>
              <p className="mt-4 text-xl leading-relaxed text-ink">{exercise.targetText}</p>
              <p className="mt-4 text-sm text-ink-muted">
                Avval namunani eshiting, keyin mikrofonni bosib aynan shu jumlani o&apos;qing.
                Har bir so&apos;z alohida tekshiriladi.
              </p>
            </>
          ) : (
            <>
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
            </>
          )}
        </section>

        {phase === "ready" && (
          <div className="mt-7 text-center">
            <MascotSays
              look={friend}
              text={friend.greeting}
              mood={speaking ? "speaking" : "idle"}
              className="mb-6 justify-center"
              bubbleClassName="bg-surface-muted text-left"
            />
            <MicRing
              recording={false}
              elapsed={0}
              limit={limit}
              disabled={!speech.supported}
              onClick={start}
            />
            <p className="mt-4 text-[15px] text-ink">
              Tayyor bo&apos;lsangiz mikrofonni bosing va gapiring
            </p>
            <p className="mt-1 overline">Maksimal {limit} soniya</p>
          </div>
        )}

        {phase === "recording" && (
          <div className="mt-7">
            {/* Do'st tinglayapti. Android'dan farqli o'laroq ovoz balandligiga
                javob bermaydi — Web Speech API mikrofon darajasini bermaydi. */}
            <div className="flex justify-center">
              <Mascot look={friend} mood="listening" size={84} />
            </div>
            <MicRing recording elapsed={elapsed} limit={limit} onClick={finish} />

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-sm bg-state-danger" />
              <span className="text-overline font-semibold uppercase text-state-danger">
                Yozilmoqda · {Math.max(0, limit - elapsed)}s qoldi
              </span>
            </div>

            {isReadAloud ? (
              <div className="card mt-6">
                <p className="section-title">O&apos;qilayotgan matn</p>
                <p className="mt-3 text-lg leading-relaxed text-ink">{exercise.targetText}</p>
              </div>
            ) : (
              exercise.keywords.length > 0 && (
                <div className="card mt-6">
                  <p className="section-title">
                    Kalit so&apos;zlar · {spokenNow.size}/{exercise.keywords.length}
                  </p>
                  <KeywordChips keywords={exercise.keywords} spoken={spokenNow} />
                </div>
              )
            )}

            {liveText && (
              <div className="mt-3 rounded border border-line bg-surface-muted/60 p-4">
                <p className="overline">Nutqingiz</p>
                <p className="mt-2 text-[15px] text-ink">
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
            keywords={isReadAloud ? [] : exercise.keywords}
            checkingGrammar={checkingGrammar}
            readResult={readResult}
            friend={friend}
            onRetry={start}
          />
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}

/** Mikrofon tugmasi — taymer uning atrofidagi halqa sifatida ko'rinadi. */
function MicRing({
  recording,
  elapsed,
  limit,
  disabled,
  onClick,
}: {
  recording: boolean;
  elapsed: number;
  limit: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  const size = 132;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = recording ? Math.min(1, elapsed / limit) : 0;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#DCE3EA"
          strokeWidth={stroke}
        />
        {recording && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#C53030"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        )}
      </svg>
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={recording ? "To'xtatish" : "Yozishni boshlash"}
        className={`absolute inset-4 flex items-center justify-center rounded-full text-white transition disabled:opacity-30 ${
          recording ? "bg-state-danger" : "bg-navy hover:bg-navy-deep"
        }`}
      >
        <Icon name={recording ? "stop" : "mic"} size={30} />
      </button>
    </div>
  );
}

function Result({
  result,
  keywords,
  checkingGrammar,
  readResult,
  friend,
  onRetry,
}: {
  result: SpeechResult;
  keywords: string[];
  checkingGrammar: boolean;
  readResult: ReadAloudResult | null;
  friend: MascotLook;
  onRetry: () => void;
}) {
  // Matn Android'dagi bilan bir xil — personaj bolaning tilida gapiradi.
  const message =
    result.overallScore >= 80
      ? "Zo'r! Juda yaxshi gapirding!"
      : result.overallScore >= 50
        ? "Yaxshi bo'ldi! Yana bir oz mashq qilamiz."
        : "Boshlanish yaxshi — qani, yana bir marta!";

  if (result.wordCount === 0) {
    return (
      <div className="card mt-6 text-center">
        <div className="flex justify-center">
          <Mascot look={friend} mood="thinking" size={80} />
        </div>
        <p className="mt-2 font-semibold text-ink">Hech narsa eshitilmadi</p>
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
      {/* Ball va ko'rsatkichlar — bitta blokda. */}
      <div className="card">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="flex shrink-0 flex-col items-center sm:w-40">
            <ScoreRing score={result.overallScore} />
            <Mascot
              look={friend}
              mood={moodForScore(result.overallScore)}
              size={72}
              className="mt-2"
            />
            <p className="mt-1 text-center font-semibold text-navy">{message}</p>
          </div>
          <div className="grid w-full grid-cols-3 gap-x-4 gap-y-5 sm:border-l sm:border-line sm:pl-6">
            <Stat value={result.wordCount} label="So'zlar" />
            <Stat value={result.uniqueWordCount} label="Noyob so'z" />
            <Stat value={result.wordsPerMinute} label="So'z/daqiqa" />
            <Stat value={`${result.durationSec}s`} label="Davomiylik" />
            <Stat
              value={`${result.matchedKeywords.length}/${result.totalKeywords}`}
              label={readResult ? "To'g'ri so'z" : "Kalit so'zlar"}
            />
            <Stat
              value={
                readResult
                  ? readResult.extraCount
                  : (result.grammarScore ?? (checkingGrammar ? "…" : "—"))
              }
              label={readResult ? "Ortiqcha so'z" : "Grammatika"}
            />
          </div>
        </div>
      </div>

      {/* "Takrorlang": har bir kutilgan so'z alohida belgilanadi. */}
      {readResult && readResult.words.length > 0 && (
        <div className="card">
          <p className="section-title">
            So&apos;zma-so&apos;z · {readResult.correctCount}/{readResult.targetCount} to&apos;g&apos;ri
          </p>
          <p className="mt-3 flex flex-wrap gap-x-2 gap-y-2 text-lg leading-relaxed">
            {readResult.words.map((w, i) => (
              <span
                key={i}
                className={
                  w.status === "CORRECT"
                    ? "text-state-success"
                    : "rounded-sm bg-red-50 px-1 font-semibold text-state-danger underline decoration-wavy underline-offset-4"
                }
              >
                {w.word}
              </span>
            ))}
          </p>
          <p className="mt-4 text-xs text-ink-muted">
            Qizil belgilangan so&apos;zlar eshitilmadi yoki boshqacha aytildi.
          </p>
        </div>
      )}

      {keywords.length > 0 && (
        <div className="card">
          <p className="section-title">
            Kalit so&apos;zlar · {result.matchedKeywords.length}/{keywords.length}
          </p>
          <KeywordChips keywords={keywords} spoken={new Set(result.matchedKeywords)} />
        </div>
      )}

      <div className="card">
        <p className="section-title">Tavsiyalar</p>
        <ul className="mt-3 space-y-3">
          {result.tips.map((t, i) => (
            <li key={i} className="flex gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm ${
                  t.kind === "PRAISE"
                    ? "bg-emerald-50 text-state-success"
                    : t.kind === "STRUCTURE"
                      ? "bg-gold-container text-gold-deep"
                      : "bg-navy-container text-navy"
                }`}
              >
                <Icon name={t.kind === "PRAISE" ? "check" : "chevronRight"} size={14} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{t.title}</span>
                <span className="block text-sm leading-relaxed text-ink-muted">{t.detail}</span>
              </span>
            </li>
          ))}
        </ul>

        {result.grammarIssues.length > 0 && (
          <>
            <p className="section-title mt-6">Grammatika e&apos;tibori</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink">
              {result.grammarIssues.map((g, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-ink-muted">—</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {result.transcript && (
        <Collapsible title="Nutqingiz (matn)">
          <p className="text-sm text-ink-muted">{result.transcript}</p>
        </Collapsible>
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
    <div>
      <p className="text-xl font-bold leading-none text-ink">{value}</p>
      <p className="mt-1.5 text-overline uppercase text-ink-muted">{label}</p>
    </div>
  );
}

/** Yig'iladigan bo'lim — transkript kabi ikkilamchi ma'lumot uchun. */
function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-left"
        aria-expanded={open}
      >
        <Icon
          name="chevronRight"
          size={18}
          className={`text-ink-muted transition-transform ${open ? "rotate-90" : ""}`}
        />
        <span className="overline">{title}</span>
      </button>
      {open && <div className="mt-3">{children}</div>}
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
