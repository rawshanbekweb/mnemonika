import type { MnemonicStep } from "@/db/schema";

/** Ixtiyoriy kirishni tozalangan string massivga aylantiradi. */
export function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.map((x) => String(x).trim()).filter((x) => x.length > 0);
  }
  if (typeof v === "string") {
    return v
      .split(/[\n,]/)
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
  }
  return [];
}

/** Mnemonik bosqichlarni tekshiradi. */
export function asSteps(v: unknown): MnemonicStep[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((s) => ({
      letter: String((s as MnemonicStep)?.letter ?? "").trim(),
      en: String((s as MnemonicStep)?.en ?? "").trim(),
      uz: String((s as MnemonicStep)?.uz ?? "").trim(),
    }))
    .filter((s) => s.letter || s.en || s.uz);
}
