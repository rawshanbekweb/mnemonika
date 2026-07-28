"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useContent } from "@/lib/use-content";
import { isRegistered, loadStudent, saveStudent, type StudentProfile } from "@/lib/student";
import { useApk } from "@/lib/use-apk";
import type { SpeakingModule } from "@/lib/content-types";
import {
  exerciseStats,
  loadAttempts,
  type ExerciseStat,
  type StoredAttempt,
} from "@/lib/attempts-store";
import { computeGameStats, type GameStats } from "@/lib/gamification";
import { Icon, type IconName } from "@/components/Icon";

const CLASS_SUGGESTIONS = ["5-A", "5-B", "5-V", "6-A", "6-B", "6-V"];

export default function StudentHome() {
  const { pack, error } = useContent();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [editing, setEditing] = useState(false);
  // Modullar ochiq holatda boshlanadi — yopilganlari shu yerda.
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState<StoredAttempt[]>([]);

  useEffect(() => {
    setProfile(loadStudent());
    setAttempts(loadAttempts());
  }, []);

  if (!profile) return <Loading />;

  if (!isRegistered(profile) || editing) {
    return (
      <ProfileForm
        profile={profile}
        firstTime={!isRegistered(profile)}
        onSave={(name, classGroup) => {
          setProfile(saveStudent(name, classGroup));
          setEditing(false);
        }}
        onCancel={editing ? () => setEditing(false) : undefined}
      />
    );
  }

  // Web'da hozircha faqat mashqlar bor (suhbatlar Android'da).
  const modules = (pack?.modules ?? []).filter((m) => m.exercises.length > 0);
  const stats = exerciseStats(attempts);
  const game = attempts.length > 0 ? computeGameStats(attempts, modules.length) : null;

  return (
    <div className="pattern-page min-h-screen">
      <Masthead profile={profile} game={game} onEdit={() => setEditing(true)} />

      <div className="mx-auto max-w-5xl px-4 py-7">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-8">
          <div>
            <BrowserWarning />

            {error && <p className="mb-6 text-sm text-state-danger">{error}</p>}

            <p className="overline">Modullar</p>
            <div className="mt-3 border-t border-line">
              {modules.map((m, i) => (
                <ModuleRow
                  key={m.id}
                  index={i + 1}
                  module={m}
                  stats={stats}
                  open={!closed.has(m.id)}
                  onToggle={() =>
                    setClosed((prev) => {
                      const next = new Set(prev);
                      if (next.has(m.id)) next.delete(m.id);
                      else next.add(m.id);
                      return next;
                    })
                  }
                />
              ))}
            </div>

            {!pack && !error && <Loading />}
            {pack && modules.length === 0 && (
              <p className="py-6 text-sm text-ink-muted">Hozircha mashqlar yo&apos;q.</p>
            )}
          </div>

          <SideRail game={game} />
        </div>

        <footer className="mt-12 border-t border-line pb-10 pt-4 text-xs text-ink-muted">
          <p>
            Suhbat mashqlari (Rolli o&apos;yin, Intervyu) va internetsiz ishlash — Android
            ilovasida.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/" className="underline hover:text-navy">
              Bosh sahifa
            </Link>
            <Link href="/login" className="underline hover:text-navy">
              O&apos;qituvchi / admin kirishi
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Masthead({
  profile,
  game,
  onEdit,
}: {
  profile: StudentProfile;
  game: GameStats | null;
  onEdit: () => void;
}) {
  return (
    <header className="hero-navy hero-photo-notebook text-white">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          {/* Logotip — ochiq bosh sahifaga qaytish yo'li (butun saytda bir xil). */}
          <Link href="/" className="min-w-0">
            <h1 className="text-2xl font-bold tracking-[0.12em]">SPEAKUP</h1>
            <p className="mt-1 text-sm text-white/75">
              Ingliz tili nutq ko&apos;nikmalari · 5–6 sinf
            </p>
          </Link>
          <button
            onClick={onEdit}
            className="flex shrink-0 items-center gap-2.5 rounded border border-white/25 px-2.5 py-2 text-left transition hover:bg-white/10"
            title="Profilni tahrirlash"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white/15 text-sm font-semibold">
              {profile.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block max-w-[8rem] truncate text-sm font-medium">
                {profile.name}
              </span>
              {profile.classGroup && (
                <span className="block text-overline uppercase text-white/55">
                  {profile.classGroup}
                </span>
              )}
            </span>
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/15 pt-4">
          {game ? (
            <>
              <Metric icon="flame" value={game.streakDays} label="kunlik seriya" />
              <Metric icon="trendingUp" value={game.level} label="daraja" />
              <Metric icon="medal" value={game.unlockedBadges} label="nishon" />
            </>
          ) : (
            <p className="text-sm text-white/75">
              Birinchi mashqni bajaring — natijalaringiz shu yerda ko&apos;rinadi.
            </p>
          )}

          <Link
            href="/student/progress"
            className="flex w-full items-center justify-center gap-2 rounded border border-white/35 py-2.5 text-sm font-medium transition hover:bg-white/10 sm:ml-auto sm:w-auto sm:px-5 sm:py-2"
          >
            <Icon name="chart" size={17} />
            Natijalarim
          </Link>
        </div>
      </div>
    </header>
  );
}

function SideRail({ game }: { game: GameStats | null }) {
  return (
    <aside className="mt-8 space-y-4 lg:mt-0">
      {game && (
        <div className="card">
          <p className="section-title">Daraja</p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">{game.level}</span>
            <span className="text-sm text-ink-muted">{game.levelTitle}</span>
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-sm bg-surface-muted">
            <div
              className="h-full bg-navy transition-all"
              style={{ width: `${Math.round(game.levelProgress * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-overline uppercase text-ink-muted">
            {game.xpInLevel} / {game.xpPerLevel} XP · {game.totalAttempts} ta mashq
          </p>
        </div>
      )}

      <AndroidDownload />
    </aside>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: number;
  label: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon name={icon} size={14} className="text-white/60" />
        <span className="text-lg font-bold leading-none">{value}</span>
      </div>
      <p className="mt-1 text-overline uppercase text-white/55">{label}</p>
    </div>
  );
}

function ModuleRow({
  index,
  module,
  stats,
  open,
  onToggle,
}: {
  index: number;
  module: SpeakingModule;
  stats: Map<string, ExerciseStat>;
  open: boolean;
  onToggle: () => void;
}) {
  const total = module.exercises.length;
  const done = module.exercises.filter((e) => stats.has(e.id)).length;

  return (
    <div className="border-b border-line">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 bg-white px-3 py-4 text-left transition hover:bg-surface-muted"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-navy text-sm font-bold tracking-wider text-white">
          {String(index).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink">{module.titleUz}</span>
          <span className="mt-0.5 block text-sm text-ink-muted">
            {module.titleEn} · {total} ta mashq
          </span>
          <span className="mt-2 flex items-center gap-2">
            <span className="block h-1 w-24 overflow-hidden rounded-sm bg-surface-muted">
              <span
                className="block h-full bg-navy"
                style={{ width: `${total ? (done / total) * 100 : 0}%` }}
              />
            </span>
            <span className="text-overline uppercase text-ink-muted">
              {done}/{total} bajarildi
            </span>
          </span>
        </span>
        <Icon
          name="chevronRight"
          size={22}
          className={`shrink-0 text-line transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-line bg-surface-muted/50 px-3 py-3">
          {module.exercises.map((ex) => {
            const st = stats.get(ex.id);
            return (
              <Link
                key={ex.id}
                href={`/student/${module.id}/${ex.id}`}
                className="flex items-center gap-3 border-b border-line/60 bg-white px-3 py-3 last:border-b-0 hover:bg-surface-muted"
              >
                <ScoreBadge score={st?.bestScore} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{ex.title}</span>
                  <span className="block text-xs text-ink-muted">
                    {/* "Takrorlang" mashqida mnemonika yo'q — bo'sh akronim
                        osilib qolgan "·" chiqarmasligi uchun yig'ib beramiz. */}
                    {[
                      ex.topic,
                      ex.targetText.trim() !== "" ? "Takrorlang" : ex.mnemonic.acronym,
                      `${ex.timeLimitSec}s`,
                    ]
                      .filter((p) => p !== "")
                      .join(" · ")}
                  </span>
                  {st && (
                    <span className="mt-1 block text-overline uppercase text-ink-muted">
                      {st.attempts} urinish · eng yaxshi {st.bestScore}
                    </span>
                  )}
                </span>
                <span
                  className={`shrink-0 !px-3 !py-1.5 !text-xs ${
                    st ? "btn-ghost" : "btn-primary"
                  }`}
                >
                  {st ? "Qayta" : "Boshlash"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Mashqning eng yaxshi bali — bajarilmagani bo'sh ramka. */
function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-dashed border-line text-line">
        <Icon name="mic" size={15} />
      </span>
    );
  }
  const tone =
    score >= 80
      ? "bg-emerald-50 text-state-success"
      : score >= 50
        ? "bg-navy-container text-navy"
        : "bg-gold-container text-gold-deep";
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-sm font-bold ${tone}`}
    >
      {score}
    </span>
  );
}

function AndroidDownload() {
  const { apk, isAndroid } = useApk();

  if (!apk) return null;

  return (
    <div className="card">
      <p className="section-title">Android ilovasi</p>
      <div className="mt-3 flex items-start gap-3">
        <Icon name="smartphone" size={22} className="mt-0.5 shrink-0 text-navy" />
        <p className="text-sm text-ink-muted">
          Internetsiz ishlaydi va suhbat mashqlari (Rolli o&apos;yin, Intervyu) ham bor.
        </p>
      </div>
      <a
        href={apk.url}
        download
        className={`mt-4 w-full ${isAndroid ? "btn-primary" : "btn-ghost"}`}
      >
        <Icon name="download" size={16} />
        Yuklab olish · {apk.sizeMb} MB
      </a>
      <p className="mt-2 text-overline uppercase text-ink-muted">
        {apk.version && `Versiya ${apk.version} · `}
        Noma&apos;lum manbalarga ruxsat so&apos;raladi
      </p>
      {/*
        0.1.4 dan boshlab APK release kaliti bilan imzolanadi. Android boshqa
        kalit bilan imzolangan ilovani eskisining ustiga o'rnatmaydi — "ilova
        o'rnatilmadi" deb yozadi, sababini tushuntirmaydi.

        O'chirish oqibatlari ataylab to'liq sanab o'tilgan: ProfileStore
        (SharedPreferences) va Room bazasi ham, Vosk modeli ham (filesDir) ilova
        bilan birga o'chadi — ya'ni daraja/seriya noldan boshlanadi va 125MB
        qaytadan yuklanadi. Matn shartli ("avval o'rnatilgan bo'lsa"), shuning
        uchun yangi foydalanuvchiga ham to'g'ri. Hamma 0.1.4+ ga o'tgach olib
        tashlansa bo'ladi.
      */}
      <div className="mt-3 flex items-start gap-2 border-t border-line pt-3">
        <Icon name="warning" size={16} className="mt-0.5 shrink-0 text-gold-deep" />
        <div className="text-sm text-ink-muted">
          <p>
            Ilova avval o&apos;rnatilgan bo&apos;lsa, yangisidan oldin{" "}
            <strong className="text-ink">eskisini o&apos;chiring</strong> — aks holda
            &laquo;ilova o&apos;rnatilmadi&raquo; deb chiqadi.
          </p>
          <p className="mt-1">
            O&apos;chirilgach ismingizni qayta kiritasiz, daraja va kunlik seriya
            noldan boshlanadi, nutq modeli ham qaytadan yuklanadi. Oldin ishlagan
            mashqlaringiz o&apos;qituvchida saqlanib qoladi.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Firefox'da Web Speech API umuman yo'q. */
function BrowserWarning() {
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    setUnsupported(!w.SpeechRecognition && !w.webkitSpeechRecognition);
  }, []);

  if (!unsupported) return null;
  return (
    <div className="mb-6 flex gap-3 rounded border border-gold/40 bg-gold-container p-4 text-sm">
      <Icon name="warning" size={18} className="mt-0.5 shrink-0 text-gold-deep" />
      <div>
        <p className="font-semibold text-ink">
          Bu brauzer mikrofonli mashqni qo&apos;llab-quvvatlamaydi
        </p>
        <p className="mt-1 text-ink-muted">
          Mashqlarni bajarish uchun <strong>Chrome</strong>, <strong>Edge</strong> yoki{" "}
          <strong>Safari</strong> dan foydalaning.
        </p>
      </div>
    </div>
  );
}

function ProfileForm({
  profile,
  firstTime,
  onSave,
  onCancel,
}: {
  profile: StudentProfile;
  firstTime: boolean;
  onSave: (name: string, classGroup: string) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [classGroup, setClassGroup] = useState(profile.classGroup);
  const canSave = name.trim().length >= 2;

  return (
    <div>
      <header className="hero-navy hero-photo-classroom px-4 py-8 text-white">
        <div className="mx-auto max-w-lg">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold tracking-[0.12em]">SPEAKUP</h1>
            <p className="mt-1.5 text-sm text-white/75">
              Ingliz tili nutq ko&apos;nikmalari platformasi
            </p>
          </Link>
          <p className="mt-5 text-white/90">
            {firstTime
              ? "Boshlashdan oldin o'zingiz haqingizda qisqacha ma'lumot kiriting."
              : "Profilingizni yangilang."}
          </p>
        </div>
      </header>

      <form
        className="mx-auto max-w-lg space-y-4 px-4 py-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) onSave(name, classGroup);
        }}
      >
        <div className="card">
          <label className="label" htmlFor="name">
            Ism-familiya
          </label>
          <input
            id="name"
            className="input"
            value={name}
            maxLength={60}
            autoFocus
            placeholder="Masalan: Ali Valiyev"
            onChange={(e) => setName(e.target.value)}
          />
          <p className="mt-2 text-xs text-ink-muted">
            Natijalaringiz shu ism bilan o&apos;qituvchingizga ko&apos;rinadi.
          </p>
        </div>

        <div className="card">
          <label className="label" htmlFor="class">
            Sinf
          </label>
          <input
            id="class"
            className="input"
            value={classGroup}
            maxLength={24}
            placeholder="Masalan: 5-A"
            onChange={(e) => setClassGroup(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {CLASS_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setClassGroup(s)}
                className={
                  classGroup === s
                    ? "pill bg-navy text-white"
                    : "pill-brand hover:bg-navy hover:text-white"
                }
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Ixtiyoriy — o&apos;qituvchi sinflar bo&apos;yicha ajratib ko&apos;rishi uchun.
          </p>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1" disabled={!canSave}>
            {firstTime ? "Boshlash" : "Saqlash"}
          </button>
          {onCancel && (
            <button type="button" className="btn-ghost" onClick={onCancel}>
              Bekor qilish
            </button>
          )}
        </div>
        {!canSave && (
          <p className="text-center text-xs text-ink-muted">
            Davom etish uchun ismingizni kiriting.
          </p>
        )}
      </form>
    </div>
  );
}

function Loading() {
  return <p className="py-8 text-center text-sm text-ink-muted">Yuklanmoqda…</p>;
}
