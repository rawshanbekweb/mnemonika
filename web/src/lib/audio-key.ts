import { createHash } from "node:crypto";

/**
 * Audio klipi MATN XESHI bo'yicha saqlanadi, mashq ID'si bo'yicha emas.
 *
 * Nega: agar audio mashqqa (yoki `prompts` massivi indeksiga) bog'lansa, admin
 * savol matnini tahrirlaganda eski audio joyida qolib ketardi — bola bir narsani
 * o'qib, boshqa narsani eshitardi. Xesh bilan bunday holat MUMKIN EMAS: matn
 * o'zgarsa xesh o'zgaradi, audio topilmaydi va qurilma o'z TTS'iga qaytadi.
 * Qo'shimcha foyda: bir xil gap bir necha mashqda uchrasa, bir marta yaratiladi.
 *
 * MUHIM: bu funksiya generatsiya skripti va kontent yig'uvchida BIR XIL
 * ishlatilishi shart — normalizatsiya farq qilsa xeshlar mos kelmaydi va
 * hech qanday audio ulanmaydi (jimgina, xatosiz).
 */

/** Ovoz nomi (Gemini TTS). Butun kontent bo'ylab bitta ovoz — izchil "o'qituvchi" tovushi. */
export const AUDIO_VOICE = "Kore";

/** Ortiqcha bo'sh joy va registr farqi xeshni o'zgartirmasligi kerak. */
export function normalizeAudioText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/** Matn + ovoz uchun barqaror kalit. Ovoz nomi ham kiradi — ovoz o'zgarsa qayta yaratiladi. */
export function audioKey(text: string, voice: string = AUDIO_VOICE): string {
  const normalized = normalizeAudioText(text);
  return createHash("sha256").update(`${voice}\n${normalized}`, "utf8").digest("hex");
}

/** Audio faqat ingliz matni uchun kerak — bo'sh yoki juda qisqa satrlar o'tkazib yuboriladi. */
export function needsAudio(text: string): boolean {
  return normalizeAudioText(text).length >= 2;
}
