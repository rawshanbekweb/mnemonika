"use client";

/**
 * Web o'quvchisi profili — brauzerda (localStorage) saqlanadi.
 * Android'dagi ProfileStore bilan bir xil g'oya: parol yo'q, faqat ism va sinf.
 *
 * ID `web_` bilan boshlanadi — o'qituvchi panelida Android (`dev_`) va web
 * o'quvchilarini ajratib bo'ladi. Ular ataylab ALOHIDA hisoblanadi.
 */

export type StudentProfile = {
  id: string;
  name: string;
  classGroup: string;
};

const KEY = "speakup_student";

function randomId(): string {
  // crypto.randomUUID hamma brauzerda ham bor emas — zaxira variant bilan.
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return "web_" + uuid.replace(/-/g, "").slice(0, 12);
}

const EMPTY: StudentProfile = { id: "", name: "", classGroup: "" };

export function loadStudent(): StudentProfile {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<StudentProfile>) : {};
    const profile: StudentProfile = {
      id: parsed.id || randomId(),
      name: parsed.name || "",
      classGroup: parsed.classGroup || "",
    };
    // ID yangi yaratilgan bo'lsa darhol saqlab qo'yamiz.
    if (!parsed.id) window.localStorage.setItem(KEY, JSON.stringify(profile));
    return profile;
  } catch {
    return { ...EMPTY, id: randomId() };
  }
}

export function saveStudent(name: string, classGroup: string): StudentProfile {
  const current = loadStudent();
  const next: StudentProfile = {
    id: current.id,
    name: name.trim().slice(0, 60),
    classGroup: classGroup.trim().slice(0, 24),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage o'chirilgan bo'lsa ham ilova ishlashda davom etadi
    // (natija yuboriladi, lekin keyingi safar ism qayta so'raladi).
  }
  return next;
}

export function isRegistered(p: StudentProfile): boolean {
  return p.name.trim().length >= 2;
}

export function firstName(p: StudentProfile): string {
  return p.name.trim().split(" ")[0] || "do'stim";
}
