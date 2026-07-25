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
import { badgeIcon, Icon } from "@/components/Icon";

export default function ProgressPage() {
  const { pack } = useContent();
  const [attempts, setAttempts] = useState<StoredAttempt[] | null>(null);

  useEffect(() => {
    setAttempts(loadAttempts());
  }, []);

  const modules = pack?.modules ?? [];
  const titleByModule = useMemo(
    () => Object.fromEntries(modules.map((m) => [m.id, m.titleUz])),
    [modules],
  );

  const game = useMemo(
    () => (attempts ? computeGameStats(attempts, modules.length) : null),
    [attempts, modules.length],
  );
  const stats = useMemo(() => (attempts ? moduleStats(attempts) : []), [attempts]);

  return (
    <div className="pattern-page min-h-screen">
      <header className="hero-navy hero-photo-book px-4 py-4 text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/student"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
            aria-label="Orqaga"
          >
            <Icon name="arrowLeft" size={20} />
          </Link>
          <h1 className="font-semibold">Natijalarim</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5">
        {!attempts && <p className="py-8 text-center text-sm text-ink-muted">Yuklanmoqda…</p>}

        {attempts && attempts.length === 0 && (
          <div className="py-12 text-center">
            <p className="font-semibold text-ink">Hali natijalar yo&apos;q</p>
            <p className="mt-1 text-sm text-ink-muted">
              Birinchi mashqni bajaring va natijangiz shu yerda paydo bo&apos;ladi.
            </p>
            <Link href="/student" className="btn-primary mt-5 inline-flex">
              Mashqni boshlash
            </Link>
          </div>
        )}

        {attempts && attempts.length > 0 && game && (
          <div className="space-y-3">
            <LevelCard game={game} />
            <StreakCard game={game} />
            <OverallCard attempts={attempts} game={game} />

            <p className="section-title pt-3">
              Nishonlar · {game.unlockedBadges}/{game.badges.length}
            </p>
            <div className="card">
              <div className="grid grid-cols-3 gap-5">
                {game.badges.map((b) => (
                  <BadgeTile key={b.id} badge={b} />
                ))}
              </div>
            </div>

            {stats.length > 0 && (
              <>
                <p className="section-title pt-3">Modullar bo&apos;yicha</p>
                {stats.map((s) => (
                  <ModuleCard
                    key={s.moduleId}
                    stat={s}
                    title={titleByModule[s.moduleId] ?? s.moduleId}
                  />
                ))}
              </>
            )}

            <p className="section-title pt-3">So&apos;nggi urinishlar</p>
            {attempts.slice(0, 20).map((a) => (
              <RecentRow key={a.id} attempt={a} />
            ))}

            <p className="pt-4 pb-10 text-xs text-ink-muted">
              Natijalar shu brauzerda saqlanadi. Brauzer ma&apos;lumotlarini tozalasangiz
              yoki boshqa qurilmadan kirsangiz, ular ko&apos;rinmaydi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LevelCard({ game }: { game: GameStats }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="overline">Daraja {game.level}</p>
          <p className="mt-1 font-semibold text-ink">{game.levelTitle}</p>
        </div>
        <p className="font-semibold text-navy">{game.totalXp} XP</p>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-sm bg-surface-muted">
        <div
          className="h-full bg-navy"
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
        <Icon
          name="flame"
          size={26}
          className={game.streakDays > 0 ? "text-gold" : "text-line"}
        />
        <div className="flex-1">
          <p className="font-semibold text-ink">
            {game.streakDays > 0 ? `${game.streakDays} kunlik seriya` : "Seriya boshlanmagan"}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {game.practicedToday
              ? "Bugungi mashq bajarildi"
              : game.streakDays > 0
                ? "Bugun ham mashq qilsangiz seriya davom etadi"
                : "Bugun bitta mashq bajaring va seriyani boshlang"}
          </p>
        </div>
      </div>
      {game.bestStreak > 0 && (
        <p className="mt-3 border-t border-line pt-3 overline">
          Eng uzun seriya · {game.bestStreak} kun
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
    <div className="card flex items-center gap-6">
      <ScoreRing score={avg} />
      <div>
        <p className="font-semibold text-ink">Umumiy o&apos;rtacha</p>
        <p className="mt-1.5 text-sm text-ink-muted">{game.totalAttempts} ta urinish</p>
        <p className="text-sm text-ink-muted">{game.totalWords} ta so&apos;z</p>
      </div>
    </div>
  );
}

function ModuleCard({ stat, title }: { stat: ModuleStat; title: string }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-ink">{title}</span>
        <span className="font-semibold text-navy">{stat.avgScore}/100</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-sm bg-surface-muted">
        <div className="h-full bg-navy" style={{ width: `${stat.avgScore}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Eng yaxshi {stat.bestScore} · {stat.attempts} urinish
      </p>
    </div>
  );
}

function RecentRow({ attempt }: { attempt: StoredAttempt }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{attempt.exerciseTitle}</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          {attempt.wordCount} so&apos;z · {attempt.wordsPerMinute} so&apos;z/daq ·{" "}
          {attempt.durationSec}s
        </p>
      </div>
      <span className="text-2xl font-bold text-navy">{attempt.overallScore}</span>
    </div>
  );
}

function BadgeTile({ badge }: { badge: Badge }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-sm border ${
          badge.unlocked
            ? "border-gold bg-surface-muted text-gold"
            : "border-line text-line"
        }`}
      >
        <Icon name={badgeIcon(badge.id)} size={22} />
      </div>
      <p
        className={`mt-2 text-xs ${
          badge.unlocked ? "font-semibold text-ink" : "text-ink-muted"
        }`}
      >
        {badge.title}
      </p>
      {!badge.unlocked && (
        <p className="mt-0.5 text-[10px] text-ink-muted">{badge.hint}</p>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const size = 100;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const color = score >= 80 ? "#2F855A" : score >= 50 ? "#1E3A5F" : "#B7791F";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
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
        <span className="text-3xl font-bold leading-none text-ink">{score}</span>
        <span className="mt-0.5 text-overline uppercase text-ink-muted">100 dan</span>
      </div>
    </div>
  );
}
