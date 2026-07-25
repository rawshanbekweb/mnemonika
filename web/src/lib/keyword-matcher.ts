// Android'dagi analysis/KeywordMatcher.kt ning aynan porti.
//
// Kalit so'zlarni transkriptda topadi — ASR xatolariga chidamli.
// Tanigich bolaning "dog" so'zini "dock" deb yozsa, aynan moslikni talab qilish
// tanigichning xatosini bolaning xatosiga aylantiradi.
//
// MUHIM: ikkala fayl bir vaqtda o'zgartirilishi shart, aks holda bir xil nutq
// Android va web'da turli ball oladi.

/** O'zak mosligi (play/playing) uchun eng kichik uzunlik. */
const MIN_STEM_LENGTH = 4;

/**
 * Harf almashish (Levenshtein) faqat UZUN so'zlarda ruxsat etiladi.
 *
 * Nega 6? Qisqa so'zlarda bir harf farqi ko'pincha BOSHQA so'z bo'ladi:
 * "house"/"horse", "cat"/"cap" — bularni bir xil deb hisoblasak, kalit so'z
 * metrikasi ma'nosini yo'qotadi. 6+ harfda esa bir harf farqi deyarli doim
 * tanigichning xatosi ("museum" → "musium").
 */
const MIN_EDIT_LENGTH = 6;

/**
 * @param alternatives tanigichning boshqa variantlari (bo'lsa). Kalit so'z shulardan
 *   birida topilsa ham hisobga olinadi — "dog" ni "dock" deb yozgan holat shu yerda hal bo'ladi.
 */
export function matchedKeywords(
  transcript: string,
  keywords: string[],
  alternatives: string[] = [],
): string[] {
  const haystacks = [transcript, ...alternatives].filter((t) => t.trim().length > 0);
  if (haystacks.length === 0) return [];

  const prepared = haystacks.map((text) => {
    const lower = text.toLowerCase();
    return {
      lower,
      spoken: new Set(lower.split(/[^\p{L}']+/u).filter((w) => w.trim().length > 0)),
    };
  });

  return keywords.filter((k) =>
    prepared.some(({ lower, spoken }) => matches(k, lower, spoken)),
  );
}

function matches(keyword: string, lowerTranscript: string, spoken: Set<string>): boolean {
  const k = keyword.toLowerCase().trim();
  if (!k) return false;

  // 1) To'g'ridan-to'g'ri uchrasa — tayyor. ("cat" → "cats" ham shu yerda topiladi.)
  if (lowerTranscript.includes(k)) return true;

  // 2) Ko'p so'zli ibora uchun taxminiy solishtirish qilmaymiz — xato ehtimoli katta.
  if (k.includes(" ")) return false;

  // 3) Bitta so'z: aytilgan so'zlar bilan taqqoslaymiz.
  for (const word of spoken) {
    if (similar(k, word)) return true;
  }
  return false;
}

function similar(keyword: string, word: string): boolean {
  if (keyword === word) return true;
  if (keyword.length < MIN_STEM_LENGTH || word.length < MIN_STEM_LENGTH) return false;

  // O'zak mosligi: "play" ↔ "playing", "friend" ↔ "friends". Bu xavfsiz.
  if (word.startsWith(keyword) || keyword.startsWith(word)) return true;

  // Harf almashishga faqat uzun KALIT SO'ZLARDA yo'l qo'yamiz.
  // Shart aytilgan so'zga emas, kalit so'zga qo'yiladi: tanigich harf tushirib
  // qoldirsa ("sister" → "siter") aytilgan so'z qisqaroq bo'lib qolishi normal.
  if (keyword.length < MIN_EDIT_LENGTH) return false;

  // Birinchi harf mos kelishi shart. Tanigich odatda so'z o'rtasi/oxirida
  // adashadi; birinchi harf farqi esa deyarli doim BOSHQA so'z ("father"/"rather").
  if (keyword[0] !== word[0]) return false;

  const allowed = keyword.length >= 9 ? 2 : 1;
  if (Math.abs(keyword.length - word.length) > allowed) return false;

  return levenshtein(keyword, word, allowed) <= allowed;
}

/** Levenshtein masofasi; `limit` dan oshsa erta to'xtaydi (limit + 1 qaytaradi). */
function levenshtein(a: string, b: string, limit: number): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    let rowMin = current[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > limit) return limit + 1;
    const swap = previous;
    previous = current;
    current = swap;
  }
  return previous[b.length];
}
