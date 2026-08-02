// `visual_images.token` kalitining shakli.
//
// Kalit ikki xil: umumiy emoji ("🍎" — hamma mashqda bir xil rasm) yoki
// mashqqa xos ("discussion_books:📚" — faqat o'sha mashqda). Shakl uchta
// joyda kerak bo'ladi — rasm tanlaydigan skript, kontent to'plami va
// `/rasmlar` sahifasi — shuning uchun u bitta shu yerda yashaydi: uch nusxa
// bo'lsa, biri o'zgarganda qolgani jimgina noto'g'ri ishlab ketardi.
//
// Ajratuvchi ":" xavfsiz — mashq ID'lari ham, emoji ham uni ichida saqlamaydi.

const SEPARATOR = ":";

/** Mashqqa xos kalit. */
export function visualKey(ownerId: string, token: string): string {
  return `${ownerId}${SEPARATOR}${token}`;
}

/** Kalitdan emojini ajratadi: "discussion_books:📚" → "📚". */
export function tokenOfKey(key: string): string {
  const at = key.lastIndexOf(SEPARATOR);
  return at >= 0 ? key.slice(at + 1) : key;
}

/** Kalitdagi mashq ID'si; umumiy kalitda bo'sh satr. */
export function ownerOfKey(key: string): string {
  const at = key.lastIndexOf(SEPARATOR);
  return at >= 0 ? key.slice(0, at) : "";
}
