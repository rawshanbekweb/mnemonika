"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useContent } from "@/lib/use-content";
import {
  firstName,
  isRegistered,
  loadStudent,
  saveStudent,
  type StudentProfile,
} from "@/lib/student";
import type { SpeakingModule } from "@/lib/content-types";
import { loadAttempts } from "@/lib/attempts-store";
import { computeGameStats, type GameStats } from "@/lib/gamification";
import { Icon, type IconName } from "@/components/Icon";

const CLASS_SUGGESTIONS = ["5-A", "5-B", "5-V", "6-A", "6-B", "6-V"];

export default function StudentHome() {
  const { pack, error } = useContent();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [openModule, setOpenModule] = useState<string | null>(null);

  useEffect(() => {
    setProfile(loadStudent());
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

  return (
    <div className="mx-auto max-w-3xl">
      <Masthead
        profile={profile}
        moduleCount={modules.length}
        onEdit={() => setEditing(true)}
      />

      <div className="px-4">
        <BrowserWarning />
        <AndroidDownload />

        {error && <p className="mt-6 text-sm text-state-danger">{error}</p>}

        <p className="mt-8 overline">Modullar</p>
        <div className="mt-3 border-t border-line">
          {modules.map((m, i) => (
            <ModuleRow
              key={m.id}
              index={i + 1}
              module={m}
              open={openModule === m.id}
              onToggle={() => setOpenModule(openModule === m.id ? null : m.id)}
            />
          ))}
        </div>

        {!pack && !error && <Loading />}
        {pack && modules.length === 0 && (
          <p className="py-6 text-sm text-ink-muted">Hozircha mashqlar yo&apos;q.</p>
        )}

        <footer className="mt-12 border-t border-line pt-4 pb-10 text-xs text-ink-muted">
          <p>
            Suhbat mashqlari (Rolli o&apos;yin, Intervyu) va internetsiz ishlash — Android
            ilovasida.
          </p>
          <Link href="/login" className="mt-2 inline-block underline hover:text-navy">
            O&apos;qituvchi / admin kirishi
          </Link>
        </footer>
      </div>
    </div>
  );
}

function Masthead({
  profile,
  moduleCount,
  onEdit,
}: {
  profile: StudentProfile;
  moduleCount: number;
  onEdit: () => void;
}) {
  const [game, setGame] = useState<GameStats | null>(null);

  useEffect(() => {
    setGame(computeGameStats(loadAttempts(), moduleCount));
  }, [moduleCount]);

  return (
    <header className="bg-navy px-4 py-6 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-[0.12em]">SPEAKUP</h1>
            <p className="mt-1 text-sm text-white/75">
              Ingliz tili nutq ko&apos;nikmalari · 5–6 sinf
            </p>
          </div>
          <button
            onClick={onEdit}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold transition hover:bg-white/25"
            title="Profilni tahrirlash"
          >
            {profile.name.slice(0, 1).toUpperCase()}
          </button>
        </div>

        <div className="mt-5 border-t border-white/15 pt-4">
          <p className="font-medium">
            {profile.name}
            {profile.classGroup && (
              <span className="ml-2 text-sm text-white/60">{profile.classGroup}</span>
            )}
          </p>
        </div>

        {game && game.totalAttempts > 0 && (
          <div className="mt-4 flex gap-8">
            <Metric icon="flame" value={game.streakDays} label="kunlik seriya" />
            <Metric icon="trendingUp" value={game.level} label="daraja" />
            <Metric icon="medal" value={game.unlockedBadges} label="nishon" />
          </div>
        )}

        <Link
          href="/student/progress"
          className="mt-5 flex items-center justify-center gap-2 rounded border border-white/35 py-2.5 text-sm font-medium transition hover:bg-white/10"
        >
          <Icon name="chart" size={17} />
          Natijalarim
        </Link>
      </div>
    </header>
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
  open,
  onToggle,
}: {
  index: number;
  module: SpeakingModule;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-line">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 bg-white px-3 py-4 text-left transition hover:bg-surface-muted"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-navy text-sm font-bold tracking-wider text-white">
          {String(index).padStart(2, "0")}
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-ink">{module.titleUz}</span>
          <span className="mt-0.5 block text-sm text-ink-muted">
            {module.titleEn} · {module.exercises.length} ta mashq
          </span>
        </span>
        <Icon
          name="chevronRight"
          size={22}
          className={`text-line transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-line bg-surface-muted/50 px-3 py-3">
          {module.exercises.map((ex) => (
            <Link
              key={ex.id}
              href={`/student/${module.id}/${ex.id}`}
              className="flex items-center gap-3 border-b border-line/60 bg-white px-3 py-3 last:border-b-0 hover:bg-surface-muted"
            >
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink">{ex.title}</span>
                <span className="block text-xs text-ink-muted">
                  {ex.topic} · {ex.mnemonic.acronym} · {ex.timeLimitSec}s
                </span>
              </span>
              <span className="btn-primary !px-3 !py-1.5 !text-xs">Boshlash</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

type ApkInfo = { url: string; sizeMb: number; uploadedAt: string; version: string };

function AndroidDownload() {
  const [apk, setApk] = useState<ApkInfo | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
    fetch("/api/apk")
      .then((r) => r.json())
      .then((d: ApkInfo | null) => setApk(d))
      .catch(() => setApk(null));
  }, []);

  if (!apk) return null;

  if (!isAndroid) {
    return (
      <p className="mt-6 text-xs text-ink-muted">
        Android telefoningiz bormi?{" "}
        <a href={apk.url} className="font-semibold text-navy underline">
          Ilovani yuklab oling
        </a>{" "}
        — internetsiz ham ishlaydi.
      </p>
    );
  }

  return (
    <div className="card mt-6">
      <div className="flex items-start gap-4">
        <Icon name="smartphone" size={24} className="mt-0.5 text-navy" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-ink">Android ilovasini o&apos;rnating</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Internetsiz ishlaydi va suhbat mashqlari (Rolli o&apos;yin, Intervyu) ham bor.
          </p>
          <a href={apk.url} className="btn-primary mt-4 inline-flex" download>
            <Icon name="download" size={16} />
            Yuklab olish · {apk.sizeMb} MB
          </a>
          <p className="mt-2 text-xs text-ink-muted">
            {apk.version && `Versiya ${apk.version} · `}
            O&apos;rnatishda &quot;Noma&apos;lum manbalarga ruxsat&quot; so&apos;raladi.
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
    <div className="mt-6 flex gap-3 rounded border border-gold/40 bg-gold-container p-4 text-sm">
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
      <header className="bg-navy px-4 py-8 text-white">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold tracking-[0.12em]">SPEAKUP</h1>
          <p className="mt-1.5 text-sm text-white/75">
            Ingliz tili nutq ko&apos;nikmalari platformasi
          </p>
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
