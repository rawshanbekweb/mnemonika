"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useContent } from "@/lib/use-content";
import {
  loadAttempts,
  moduleStats,
  type ModuleStat,
  type StoredAttempt,
} from "@/lib/attempts-store";
import { computeGameStats, type Badge, type GameStats } from "@/lib/gamification";

export default function ProgressPage() {
  const { pack } = useContent();
  const [attempts, setAttempts] = useState<StoredAttempt[] | null>(null);

  // localStorage faqat brauzerda mavjud.
  useEffect(() => {
    setAttempts(loadAttempts());
  }, []);

  const modules = pack?.modules ?? [];
  const titleByModule = useMemo(
    () => Object.fromEntries(modules.map((m) => [m.id, m.titleUz])),
    [modules],
  );
  const emojiByModule = useMemo(
    () => Object.fromEntries(modules.map((m) => [m.id, m.emoji])),
    [modules],
  );

  const game = useMemo(
    () => (attempts ? computeGameStats(attempts, modules.length) : null),
    [attempts, modules.length],
  );
  const stats = useMemo(() => (attempts ? moduleStats(attempts) : []), [attempts]);

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
          <h1 className="text-xl font-bold">Mening natijalarim</h1>
        </div>
      </header>

      {!attempts && <p className="mt-8 text-center text-sm text-ink-muted">Yuklanmoqda…</p>}

      {attempts && attempts.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-5xl">📊</p>
          <p className="mt-3 font-bold text-ink">Hali natijalar yo&apos;q</p>
          <p className="mt-1 text-sm text-ink-muted">
            Birinchi mashqni bajaring va natijangiz shu yerda paydo bo&apos;ladi!
          </p>
          <Link href="/student" className="btn-primary mt-5 inline-flex">
            Mashqni boshlash
          </Link>
        </div>
      )}

      {attempts && attempts.length > 0 && game && (
        <div className="mt-5 space-y-4">
          <LevelCard game={game} />
          <StreakCard game={game} />
          <OverallCard attempts={attempts} game={game} />

          <h2 className="section-title pt-2">
            Nishonlar ({game.unlockedBadges}/{game.badges.length})
          </h2>
          <div className="card">
            <div className="grid grid-cols-3 gap-4">
              {game.badges.map((b) => (
                <BadgeTile key={b.id} badge={b} />
              ))}
            </div>
          </div>

          {stats.length > 0 && (
            <>
              <h2 className="section-title pt-2">Modullar bo&apos;yicha</h2>
              {stats.map((s) => (
                <ModuleCard
                  key={s.moduleId}
                  stat={s}
                  title={titleByModule[s.moduleId] ?? s.moduleId}
                  emoji={emojiByModule[s.moduleId] ?? "•"}
                />
              ))}
            </>
          )}

          <h2 className="section-title pt-2">So&apos;nggi urinishlar</h2>
          {attempts.slice(0, 20).map((a) => (
            <RecentRow key={a.id} attempt={a} emoji={emojiByModule[a.moduleId] ?? "•"} />
          ))}

          <p className="pt-4 text-center text-xs text-ink-muted">
            Natijalar shu brauzerda saqlanadi. Brauzer ma&apos;lumotlarini tozalasangiz
            yoki boshqa qurilmadan kirsangiz, ular ko&apos;rinmaydi.
          </p>
        </div>
      )}
    </div>
  );
}

function LevelCard({ game }: { game: GameStats }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="font-bold text-ink">
            {game.level}-daraja · {game.levelTitle}
          </p>
          <p className="mt-1 text-sm text-ink-muted">Jami {game.totalXp} XP</p>
        </div>
        <span className="text-3xl">⭐</span>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-gradient"
          style={{ width: `${Math.min(100, game.levelProgress * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Keyingi darajagacha {game.xpPerLevel - game.xpInLevel} XP
      </p>
    </div>
  );
}

function StreakCard({ game }: { game: GameStats }) {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <span className="text-4xl">🔥</span>
        <div className="flex-1">
          <p className="font-bold text-ink">
            {game.streakDays > 0 ? `${game.streakDays} kunlik seriya` : "Seriya boshlanmagan"}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {game.practicedToday
              ? "Bugungi mashq bajarildi — zo'r! ✅"
              : game.streakDays > 0
                ? "Bugun ham mashq qilsang seriya davom etadi."
                : "Bugun bitta mashq bajar va seriyani boshla."}
          </p>
        </div>
      </div>
      {game.bestStreak > 0 && (
        <p className="mt-3 text-sm font-semibold text-brand">
          Eng uzun seriyang: {game.bestStreak} kun
        </p>
      )}
    </div>
  );
}

function OverallCard({ attempts, game }: { attempts: StoredAttempt[]; game: GameStats }) {
  const avg = Math.round(
    attempts.reduce((s, a) => s + a.overallScore, 0) / attempts.length,
  );
  return (
    <div className="card flex items-center gap-5">
      <ScoreRing score={avg} />
      <div>
        <p className="font-bold text-ink">Umumiy o&apos;rtacha</p>
        <p className="mt-1 text-sm text-ink-muted">{game.totalAttempts} ta urinish</p>
        <p className="text-sm text-ink-muted">{game.totalWords} ta so&apos;z aytilgan</p>
      </div>
    </div>
  );
}

function ModuleCard({
  stat,
  title,
  emoji,
}: {
  stat: ModuleStat;
  title: string;
  emoji: string;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <span className="flex-1 font-semibold text-ink">{title}</span>
        <span className="text-xl font-extrabold text-brand">{stat.avgScore}</span>
        <span className="text-xs text-ink-muted">/100</span>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-gradient"
          style={{ width: `${stat.avgScore}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        O&apos;rtacha {stat.avgScore} · Eng yaxshi {stat.bestScore} · {stat.attempts} urinish
      </p>
    </div>
  );
}

function RecentRow({ attempt, emoji }: { attempt: StoredAttempt; emoji: string }) {
  return (
    <div className="card flex items-center gap-3">
      <span className="text-xl">{emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{attempt.exerciseTitle}</p>
        <p className="text-xs text-ink-muted">
          {attempt.wordCount} so&apos;z · {attempt.wordsPerMinute} so&apos;z/daq ·{" "}
          {attempt.durationSec}s
        </p>
      </div>
      <span className="text-xl font-extrabold text-brand">{attempt.overallScore}</span>
    </div>
  );
}

function BadgeTile({ badge }: { badge: Badge }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
          badge.unlocked ? "bg-slate-100" : "bg-slate-50 opacity-30"
        }`}
      >
        {badge.emoji}
      </div>
      <p
        className={`mt-1.5 text-xs ${
          badge.unlocked ? "font-semibold text-ink" : "text-ink-muted"
        }`}
      >
        {badge.title}
      </p>
      {!badge.unlocked && <p className="text-[10px] text-ink-muted">{badge.hint}</p>}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const size = 104;
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#6d28d9" : "#f43f5e";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e9e4f5" strokeWidth={stroke} />
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
        <span className="text-3xl font-extrabold leading-none text-ink">{score}</span>
        <span className="text-xs text-ink-muted">/ 100</span>
      </div>
    </div>
  );
}
