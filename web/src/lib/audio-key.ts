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

/**
 * Klip qanday o'qilishi.
 *
 *   "prompt" — mashq savoli. Bolaga savol beriladi, u erkin javob aytadi.
 *   "pron"   — "Takrorlang" mashqining namunasi. Bola AYNAN shu gapni qaytaradi
 *              va har so'zi solishtiriladi (`read-aloud.ts`), shuning uchun
 *              namuna sekinroq va tovushlar biroz cho'zib aytiladi.
 *
 * Uslub XESHGA kiradi — ovoz kabi. Sabab: uslub o'zgarsa audio ham boshqacha
 * eshitiladi, ya'ni eski klip endi to'g'ri kelmaydi va qayta yaratilishi kerak.
 */
export type AudioStyle = "prompt" | "pron";

/**
 * Uslubning xeshdagi yorlig'i.
 *
 * "prompt" ATAYLAB bo'sh: eski xesh sxemasida uslub tushunchasi yo'q edi, va
 * bo'sh yorliq bilan savol kliplarining xeshi AVVALGIDEK qoladi — ya'ni
 * allaqachon yaratilgan kliplar o'z joyida turadi. Buni o'zgartirsangiz
 * BARCHA savol kliplari qaytadan yaratilishi kerak bo'ladi (bepul tarifda
 * ~10 klip/kun — bu haftalab vaqt degani).
 *
 * Yorliq oxiridagi raqam — uslub MATNINING versiyasi. `generate-audio.ts`
 * dagi uslub ko'rsatmasini jiddiy o'zgartirsangiz, bu yerdagi raqamni ham
 * oshiring: shunda eski kliplar "yo'q" hisoblanadi va qayta yaratiladi.
 * Oshirmasangiz, ko'rsatma o'zgargani bilan bola eski audioni eshitaveradi.
 */
const STYLE_TAG: Record<AudioStyle, string> = {
  prompt: "",
  // Uslub tarixi (hammasi O'LCHANGAN, s/so'z):
  //   asl   — 0.76 / 0.80 : umuman cho'zilmagan, savol bilan bir xil ko'rsatma
  //   pron1 — 0.96 / 1.49 : "sekinroq" sifatlari — juda notekis (tarqoqlik 55%)
  //   pron2 — 1.33 / 1.60 : aniq tezlik + so'zlar orasida pauza — izchil, lekin
  //                         juda sekin (13 so'zli gap ~21 soniya)
  //   pron3 — pauza olib tashlandi: cho'zish CHO'ZIB aytish bo'lsin, so'zlarni
  //                         ajratish emas — ular boshqa-boshqa narsa
  //
  // XULOSA (2026-08-07 da o'lchandi): pron3 klipi 0.781 s/so'z chiqdi — ya'ni
  // "asl" bilan bir xil, sekinlashtirish BUTUNLAY yo'qolgan. Uch urinishdan
  // keyin ayon bo'ldi: TTS ko'rsatmasi bilan tezlikni boshqarib bo'lmaydi,
  // model uni goh eshitadi, goh eshitmaydi.
  //
  // Shuning uchun tezlik endi ILOVADA boshqariladi (`VoiceCue.SLOW_SPEED` va
  // `Speaker.RATE_SLOW`/`WORD_GAP_MS`) — u yerda natija aniq va har klipda
  // bir xil. Bu yerdagi ko'rsatma faqat TALAFFUZ SIFATI uchun qoladi (tovushlarni
  // aniq aytish), tezlik uchun EMAS. Ya'ni pron4 yasab, 19 ta klipni qaytadan
  // yaratishning (kvota ~10/kun) hojati yo'q.
  pron: "pron3",
};

/**
 * Ortiqcha bo'sh joy xeshni o'zgartirmasligi kerak.
 *
 * Diqqat: registr (katta/kichik harf) ATAYLAB saqlanadi — TTS uchun bu farq
 * qiladi va tushirib yuborilsa mavjud barcha xeshlar buzilardi.
 */
export function normalizeAudioText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * Matn + ovoz + uslub uchun barqaror kalit.
 *
 * Uchalasi ham audio qanday eshitilishini belgilaydi, shuning uchun uchalasi
 * xeshda: biror biri o'zgarsa klip qaytadan yaratiladi.
 */
export function audioKey(
  text: string,
  voice: string = AUDIO_VOICE,
  style: AudioStyle = "prompt",
): string {
  const normalized = normalizeAudioText(text);
  const tag = STYLE_TAG[style];
  const suffix = tag ? `\n${tag}` : "";
  return createHash("sha256").update(`${voice}\n${normalized}${suffix}`, "utf8").digest("hex");
}

/** Audio faqat ingliz matni uchun kerak — bo'sh yoki juda qisqa satrlar o'tkazib yuboriladi. */
export function needsAudio(text: string): boolean {
  return normalizeAudioText(text).length >= 2;
}
