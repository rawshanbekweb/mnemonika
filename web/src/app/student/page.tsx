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

const CLASS_SUGGESTIONS = ["5-A", "5-B", "5-V", "6-A", "6-B", "6-V"];

export default function StudentHome() {
  const { pack, error } = useContent();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [openModule, setOpenModule] = useState<string | null>(null);

  // localStorage faqat brauzerda mavjud — shuning uchun effekt ichida o'qiymiz.
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

  // Bu bosqichda web'da faqat mashqlar bor (suhbatlar Android'da qoladi).
  const modules = (pack?.modules ?? []).filter((m) => m.exercises.length > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="rounded-3xl bg-hero-gradient p-6 text-white shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/90">Salom, {firstName(profile)}! 👋</p>
            <h1 className="mt-1 flex items-center gap-2 text-3xl font-extrabold tracking-tight">
              <span>🎙️</span> SpeakUp
            </h1>
            <p className="mt-2 text-sm text-white/90">
              Ingliz tilida gapirishni mashq qilamiz · 5–6 sinf
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold transition hover:bg-white/30"
            title="Profilni tahrirlash"
          >
            {profile.name.slice(0, 1).toUpperCase()}
          </button>
        </div>
        {profile.classGroup && (
          <span className="mt-4 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            {profile.classGroup}
          </span>
        )}
      </header>

      <BrowserWarning />
      <AndroidDownload />

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      <h2 className="section-title mt-8">Mavzuni tanlang</h2>

      {!pack && !error && <Loading />}

      <div className="mt-4 space-y-3">
        {modules.map((m) => (
          <ModuleCard
            key={m.id}
            module={m}
            open={openModule === m.id}
            onToggle={() => setOpenModule(openModule === m.id ? null : m.id)}
          />
        ))}
        {pack && modules.length === 0 && (
          <p className="text-sm text-ink-muted">Hozircha mashqlar yo'q.</p>
        )}
      </div>

      <footer className="mt-12 border-t border-slate-100 pt-4 text-center text-xs text-ink-muted">
        <p>
          Suhbat mashqlari (Rolli o&apos;yin, Intervyu) va internetsiz ishlash — Android
          ilovasida.
        </p>
        <Link href="/login" className="mt-2 inline-block underline hover:text-brand">
          O&apos;qituvchi / admin kirishi
        </Link>
      </footer>
    </div>
  );
}

function ModuleCard({
  module,
  open,
  onToggle,
}: {
  module: SpeakingModule;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="card !p-0 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-2xl">
          {module.emoji}
        </span>
        <span className="flex-1">
          <span className="block font-bold text-ink">{module.titleUz}</span>
          <span className="block text-sm text-ink-muted">
            {module.titleEn} · {module.exercises.length} ta mashq
          </span>
        </span>
        <span
          className={`text-2xl text-ink-muted transition-transform ${open ? "rotate-90" : ""}`}
        >
          ›
        </span>
      </button>

      {open && (
        <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 p-4">
          {module.exercises.map((ex) => (
            <Link
              key={ex.id}
              href={`/student/${module.id}/${ex.id}`}
              className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-100 transition hover:ring-brand/40"
            >
              <span className="text-xl">{ex.visuals[0] ?? "📝"}</span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink">{ex.title}</span>
                <span className="block text-xs text-ink-muted">
                  {ex.topic} · {ex.mnemonic.acronym} · {ex.timeLimitSec}s
                </span>
              </span>
              <span className="btn-primary !px-4 !py-1.5 !text-xs">Boshlash</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

type ApkInfo = { url: string; sizeMb: number; uploadedAt: string; version: string };

/**
 * Android ilovasini yuklab olish taklifi.
 *
 * Android telefonlarda ko'zga tashlanadigan qilib ko'rsatiladi (u yerda ilova
 * web'dan afzal: internetsiz ishlaydi va suhbat mashqlari ham bor),
 * boshqa qurilmalarda esa oddiy havola sifatida.
 */
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
      <p className="mt-6 text-center text-xs text-ink-muted">
        Android telefoningiz bormi?{" "}
        <a href={apk.url} className="font-semibold text-brand underline">
          Ilovani yuklab oling
        </a>{" "}
        — internetsiz ham ishlaydi.
      </p>
    );
  }

  return (
    <div className="card mt-6 border-brand/20 bg-brand/5">
      <div className="flex items-start gap-4">
        <span className="text-3xl">📱</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-ink">Android ilovasini o&apos;rnating</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Internetsiz ishlaydi va suhbat mashqlari (Rolli o&apos;yin, Intervyu) ham bor.
          </p>
          <a
            href={apk.url}
            className="btn-primary mt-4 inline-flex"
            download
          >
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

/** Firefox'da Web Speech API umuman yo'q — buni oldindan aytib qo'yamiz. */
function BrowserWarning() {
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setUnsupported(!w.SpeechRecognition && !w.webkitSpeechRecognition);
  }, []);

  if (!unsupported) return null;
  return (
    <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
      <p className="font-semibold">⚠️ Bu brauzer mikrofonli mashqni qo&apos;llab-quvvatlamaydi</p>
      <p className="mt-1">
        Mashqlarni bajarish uchun <strong>Chrome</strong>, <strong>Edge</strong> yoki{" "}
        <strong>Safari</strong> dan foydalaning. Mavzularni ko&apos;rish esa shu yerda ham ishlaydi.
      </p>
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
    <div className="mx-auto max-w-lg px-4 py-6">
      <header className="rounded-3xl bg-hero-gradient p-6 text-white shadow-soft">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
          <span>🎙️</span> SpeakUp
        </h1>
        <p className="mt-2 text-sm text-white/90">
          {firstTime ? "Xush kelibsan! Keling, avval tanishib olamiz." : "Profilingni yangila."}
        </p>
      </header>

      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) onSave(name, classGroup);
        }}
      >
        <div className="card">
          <label className="label" htmlFor="name">
            Isming nima?
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
            Natijalaring shu ism bilan o&apos;qituvchingga ko&apos;rinadi.
          </p>
        </div>

        <div className="card">
          <label className="label" htmlFor="class">
            Sinfing qaysi?
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
                    ? "pill bg-brand text-white"
                    : "pill-brand hover:bg-brand/20"
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1" disabled={!canSave}>
            {firstTime ? "Boshladik! 🚀" : "Saqlash"}
          </button>
          {onCancel && (
            <button type="button" className="btn-ghost" onClick={onCancel}>
              Bekor qilish
            </button>
          )}
        </div>
        {!canSave && (
          <p className="text-center text-xs text-ink-muted">Davom etish uchun ismingni yoz.</p>
        )}
      </form>
    </div>
  );
}

function Loading() {
  return <p className="mt-6 text-center text-sm text-ink-muted">Yuklanmoqda…</p>;
}
