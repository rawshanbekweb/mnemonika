// Mashq tasvirlariga haqiqiy fotosurat topadi va Vercel Blob'ga yuklaydi.
//
//   npm run gen:images                — jadvalda yo'q tasvirlar uchun rasm topadi
//   npm run gen:images -- --dry       — faqat nima qilinishini ko'rsatadi
//   npm run gen:images -- --limit 10  — birinchi N tasini ishlaydi
//   npm run gen:images -- --redo "🍎,🐶"  — shu tasvirlarga BOSHQA rasm tanlaydi
//   npm run gen:images -- --sheet     — tasdiqlash varag'ini (HTML) yozadi
//
// MANBA: Wikimedia Commons — API kaliti KERAK EMAS ($0 sharti buzilmaydi).
//
// NEGA OPENVERSE EMAS (sinab ko'rilgan va tashlab yuborilgan): Openverse'ning
// CC to'plamida aniq predmet fotosuratlari kam, natijada "hamster" so'roviga
// qal'a, "octopus" ga kitob muqovasi, "ocean wave" ga delfin chiqdi — 83 tadan
// ~30 tasi noto'g'ri edi va sarlavha bo'yicha saralash ham yordam bermadi.
// Commons'da esa fayl nomlari so'zma-so'z tavsifiy ("A pet hamster named
// Peach.jpg"), shuning uchun qidiruv aniq ishlaydi.
//
// Litsenziyalar: Commons'da hammasi erkin, lekin turi har xil (PD, CC0, CC BY,
// CC BY-SA). Hammasi qabul qilinadi va HAR BIRI `/rasmlar` sahifasida muallifi
// bilan ko'rsatiladi — CC-BY atributni foydalanuvchi ko'radigan joyda talab
// qiladi.
//
// NEGA BLOB'GA NUSXALANADI: manbaga hotlink qilsak, o'sha sayt rasmni o'chirsa
// yoki sekin javob bersa bolaning mashqi buziladi; ustiga har ochilishda
// begona serverga so'rov ketardi. Nusxa bizda turadi.
//
// XAVFSIZLIK ESLATMASI: bu bolalar ilovasi. Skript avtomatik tanlaydi, lekin
// yakuniy qaror ODAMNIKI — `--sheet` bilan tasdiqlash varag'ini chiqarib har
// bir rasmni ko'rib chiqish shart, yoqmagani `--redo` bilan almashtiriladi.

import "../src/db/load-env";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { put } from "@vercel/blob";
import { inArray } from "drizzle-orm";
import { db, schema } from "../src/db";
import { VISUAL_TERMS } from "./visual-terms";

const API = "https://commons.wikimedia.org/w/api.php";

/**
 * Wikimedia qoidasi bo'yicha har so'rov o'zini tanishtirishi shart —
 * User-Agent'siz so'rovlar bloklanadi.
 */
const USER_AGENT = "SpeakUp/0.1 (ta'lim ilovasi; https://mnemonika.vercel.app)";

/** Nechta nomzod so'ralsin — `--redo` keyingisini olishi uchun zaxira kerak. */
const CANDIDATES = 10;

/** Commons'ga xushmuomalalik: so'rovlar orasidagi pauza. */
const DELAY_MS = 600;

/** Juda katta fayl kerak emas — 88dp/88px katakcha uchun ~600px yetarli. */
const MAX_BYTES = 900_000;

/** Kerakli eskiz kengligi — Commons o'zi shu o'lchamda beradi, resize kerak emas. */
const THUMB_WIDTH = 600;

/**
 * Nomida shu so'zlar bo'lgan fayllar o'tkazib yuboriladi.
 *
 * Commons'da ko'p narsa FOTOSURAT EMAS: plakat, gravyura, qo'lyozma, patent
 * chizmasi, saylov belgisi. Ular qidiruvda birinchi chiqishi mumkin, chunki
 * nomi so'roqqa mos keladi — "bunch of keys" so'rovi 1880-yilgi teatr
 * plakatini, "farmer harvesting crops" esa saylov belgisining chizmasini
 * berdi. Bola esa narsaning O'ZINI ko'rishi kerak.
 *
 * Bu FAQAT dag'al old-filtr: rasm predmetni tushunarli ko'rsatyaptimi degan
 * savolga u javob bera olmaydi (bo'sh futbol maydoni "grass pitch" nomi bilan
 * baribir o'tadi). Yakuniy qaror odamniki — `--sheet` bilan ko'rib chiqish
 * shart bo'lib qoladi.
 */
const REJECT_TITLE =
  /\b(poster|lccn|engraving|lithograph|woodcut|etching|drawing|sketch|painting|illustration|manuscript|folio|codex|patent|diagram|schematic|blueprint|coat of arms|logo|clipart|cartoon|caricature|election symbol|postage stamp|banknote|book of hours)\b/i;

type CommonsItem = {
  /** "File:Cute hamster.jpg" */
  title: string;
  /** Qidiruv relevantligi bo'yicha o'rni. */
  index: number;
  thumbUrl?: string;
  fullUrl?: string;
  descriptionUrl?: string;
  creator?: string;
  license?: string;
  licenseUrl?: string;
};

type CommonsPage = {
  title?: string;
  index?: number;
  imageinfo?: {
    url?: string;
    thumburl?: string;
    descriptionurl?: string;
    extmetadata?: Record<string, { value?: string }>;
  }[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Commons metama'lumotlari HTML bo'lishi mumkin ("<a href=…>Ism</a>"). */
function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "File:Cute hamster.jpg" → "Cute hamster" */
function cleanTitle(title: string): string {
  return title.replace(/^File:/i, "").replace(/\.[a-z0-9]+$/i, "");
}

async function search(term: string): Promise<CommonsItem[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    // `filetype:bitmap` — SVG belgilar va PDF skanerlar tushmasin.
    generator: "search",
    gsrsearch: `filetype:bitmap ${term}`,
    gsrnamespace: "6",
    gsrlimit: String(CANDIDATES),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: String(THUMB_WIDTH),
  });

  const res = await fetch(`${API}?${params}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Commons ${res.status}`);

  const data = (await res.json()) as { query?: { pages?: Record<string, CommonsPage> } };
  const pages = Object.values(data.query?.pages ?? {});

  return pages
    .map((p): CommonsItem => {
      const info = p.imageinfo?.[0];
      const meta = info?.extmetadata ?? {};
      return {
        title: p.title ?? "",
        // Commons relevantlik tartibini `index` da qaytaradi; obyekt kalitlari
        // tartibiga ishonib bo'lmaydi.
        index: p.index ?? 999,
        thumbUrl: info?.thumburl,
        fullUrl: info?.url,
        descriptionUrl: info?.descriptionurl,
        creator: stripHtml(meta.Artist?.value ?? ""),
        license: stripHtml(meta.LicenseShortName?.value ?? ""),
        licenseUrl: stripHtml(meta.LicenseUrl?.value ?? ""),
      };
    })
    .filter((item) => !REJECT_TITLE.test(cleanTitle(item.title)))
    .sort((a, b) => a.index - b.index);
}

/**
 * Rasmni yuklab oladi.
 *
 * Avval `thumburl` (Commons 600px eskizi): asl fayl ko'pincha 5–20MB bo'ladi
 * va bizga bunday o'lcham kerak emas. Eskiz ishlamasa asl fayl.
 */
async function download(item: CommonsItem): Promise<{ bytes: Buffer; contentType: string }> {
  const sources = [item.thumbUrl, item.fullUrl].filter((u): u is string => Boolean(u));
  let lastError = "manba yo'q";

  for (const src of sources) {
    try {
      const res = await fetch(src, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        continue;
      }
      const contentType = res.headers.get("content-type") ?? "image/jpeg";
      if (!contentType.startsWith("image/")) {
        lastError = `rasm emas (${contentType})`;
        continue;
      }
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length === 0) {
        lastError = "bo'sh fayl";
        continue;
      }
      if (bytes.length > MAX_BYTES && src !== sources[sources.length - 1]) {
        lastError = `juda katta (${Math.round(bytes.length / 1024)}KB)`;
        continue;
      }
      return { bytes, contentType };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(lastError);
}

function extFor(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

/**
 * Blob yo'li uchun xavfsiz nom.
 *
 * Emoji'ning o'zini yo'lga qo'yib bo'lmaydi (URL kodlash, turli platformalarda
 * turlicha) — shuning uchun Unicode kod nuqtalari ishlatiladi: 🍎 → "1f34e".
 * Bu barqaror: bir xil emoji doim bir xil nom beradi.
 */
function slugFor(token: string): string {
  return Array.from(token)
    .map((ch) => ch.codePointAt(0)!.toString(16))
    .join("-");
}

/**
 * Bazadagi mashq tasvirlari.
 *
 * FAQAT `exercises` — dialog va suhbatlarda ham `visuals` maydoni bor, lekin
 * ekranlarda ular ko'rsatilmaydi (u yerda `characterEmoji` ishlatiladi).
 * Ularni ham qo'shsak, hech qachon ko'rinmaydigan rasmlar yuklangan bo'lardi.
 */
async function collectTokens(): Promise<string[]> {
  const exercises = await db.select().from(schema.exercises);
  const all = exercises.flatMap((e) => e.visuals);
  // Rasm URL'i allaqachon qo'yilgan bo'lsa (media kutubxonasidan) tegmaymiz.
  return [...new Set(all.filter((t) => t && !t.startsWith("http")))];
}

async function writeSheet(outPath?: string): Promise<void> {
  const rows = await db.select().from(schema.visualImages);
  const byToken = new Map(rows.map((r) => [r.token, r]));
  const tokens = await collectTokens();

  const cards = tokens
    .map((token) => {
      const term = VISUAL_TERMS[token];
      const row = byToken.get(token);
      if (term === null) {
        return `<div class="card kept"><div class="emoji">${token}</div>
          <p class="note">emoji qoladi (fotosurat qo'yilmaydi)</p></div>`;
      }
      if (!row) {
        return `<div class="card missing"><div class="emoji">${token}</div>
          <p class="note">rasm topilmadi — <code>${term ?? "jadvalda yo'q"}</code></p></div>`;
      }
      return `<div class="card">
        <img src="${row.url}" alt="">
        <div class="meta">
          <span class="emoji-sm">${token}</span>
          <code>${row.searchTerm}</code>
          <a href="${row.sourceUrl}" target="_blank" rel="noreferrer">${row.license || "?"}</a>
        </div>
      </div>`;
    })
    .join("\n");

  const html = `<h1>Mashq rasmlari — tasdiqlash</h1>
<p>Har bir rasmni ko'rib chiqing. Yoqmaganini almashtirish:
<code>npm run gen:images -- --redo "🍎,🐶"</code></p>
<div class="grid">
${cards}
</div>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
  .card { border: 1px solid #dce3ea; border-radius: 6px; overflow: hidden; }
  .card img { width: 100%; height: 120px; object-fit: cover; display: block; }
  .meta { padding: 6px 8px; font-size: 12px; display: flex; flex-direction: column; gap: 2px; }
  .emoji { font-size: 44px; text-align: center; padding: 24px 0 8px; }
  .emoji-sm { font-size: 18px; }
  .note { font-size: 11px; color: #5a6b7d; padding: 0 8px 10px; text-align: center; }
  .missing { border-color: #c53030; }
  .kept { background: #f4f6f8; }
  code { background: #edf1f5; padding: 1px 4px; border-radius: 3px; }
</style>`;

  // Standart joy — vaqtinchalik papka: bu tekshiruv uchun fayl, repozitoriyga
  // tushishi kerak emas (`--out` bilan boshqa joyga yozsa bo'ladi).
  const out = outPath ?? resolve(tmpdir(), "speakup-visual-sheet.html");
  writeFileSync(out, html, "utf8");
  console.log(`Tasdiqlash varag'i: ${out}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const sheet = args.includes("--sheet");
  const limitArg = args.indexOf("--limit");
  const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
  const redoArg = args.indexOf("--redo");
  const redo = redoArg >= 0 ? (args[redoArg + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean) : [];

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL yo'q. web/.env faylini tekshiring.");
    process.exit(1);
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN yo'q. web/.env faylini tekshiring.");
    process.exit(1);
  }

  if (sheet) {
    const outArg = args.indexOf("--out");
    await writeSheet(outArg >= 0 ? args[outArg + 1] : undefined);
    return;
  }

  const tokens = await collectTokens();
  const unknown = tokens.filter((t) => !(t in VISUAL_TERMS));
  if (unknown.length > 0) {
    // Jim o'tkazib yuborilsa yangi kontent rasmsiz qolib ketardi.
    console.error(
      `scripts/visual-terms.ts da yo'q tasvirlar: ${unknown.join(" ")}\n` +
        "Har biri uchun qidiruv so'zi (yoki emoji qolishi uchun null) qo'shing.",
    );
    process.exit(1);
  }

  const existing = new Set((await db.select().from(schema.visualImages)).map((r) => r.token));
  const wanted = tokens.filter((t) => VISUAL_TERMS[t] !== null);

  // `null` ga o'tkazilgan tasvirning ESKI qatori o'chirilishi shart. Aks holda
  // "emoji qolsin" degan qaror hech narsani o'zgartirmasdi: generator uni
  // o'tkazib yuboradi, `buildContentPack()` esa bazadagi qatorni topib rasmni
  // baribir ko'rsataverardi.
  const revoked = [...existing].filter((t) => VISUAL_TERMS[t] === null);
  if (revoked.length > 0) {
    if (dry) {
      console.log(`Emojiga qaytariladi: ${revoked.join(" ")}`);
    } else {
      await db.delete(schema.visualImages).where(inArray(schema.visualImages.token, revoked));
      console.log(`Emojiga qaytarildi: ${revoked.join(" ")}`);
      for (const t of revoked) existing.delete(t);
    }
  }

  // `--redo all` — hammasini qayta tanlash (qidiruv mantiqi yaxshilanganda).
  const redoAll = redo.length === 1 && redo[0] === "all";
  const jobs = (
    redoAll
      ? wanted
      : redo.length > 0
        ? wanted.filter((t) => redo.includes(t))
        : wanted.filter((t) => !existing.has(t))
  ).slice(0, limit);

  const keptAsEmoji = tokens.length - wanted.length;
  console.log(
    `Tasvirlar: ${tokens.length} (emoji qoladi: ${keptAsEmoji}), ` +
      `rasm bor: ${existing.size}, ishlanadi: ${jobs.length}`,
  );
  if (jobs.length === 0) {
    console.log("Yangi rasm kerak emas. (Almashtirish uchun --redo \"🍎,🐶\")");
    return;
  }
  if (dry) {
    for (const t of jobs) console.log(`  ${t}  →  "${VISUAL_TERMS[t]}"`);
    console.log("\n(--dry: hech narsa yuklanmadi)");
    return;
  }

  let done = 0;
  let failed = 0;

  for (const [i, token] of jobs.entries()) {
    const term = VISUAL_TERMS[token]!;
    process.stdout.write(`[${i + 1}/${jobs.length}] ${token} "${term}" … `);

    try {
      const results = await search(term);
      if (results.length === 0) throw new Error("natija yo'q");

      // Aniq tasvir uchun `--redo` — foydalanuvchi rasmni RAD ETGAN, shuning
      // uchun avvalgi tanlov chetlab o'tiladi. `--redo all` da esa aksincha:
      // qidiruv yaxshilangani uchun qayta tanlanadi va to'g'ri rasm o'z
      // o'rnida qolishi mumkin.
      const previous =
        !redoAll && existing.has(token)
          ? (await db.select().from(schema.visualImages).where(inArray(schema.visualImages.token, [token])))[0]
          : undefined;
      const candidates = previous
        ? results.filter((r) => r.descriptionUrl !== previous.sourceUrl)
        : results;

      let saved = false;
      let lastError = "nomzod qolmadi";

      for (const item of candidates) {
        try {
          const file = await download(item);
          const blob = await put(`visuals/${slugFor(token)}.${extFor(file.contentType)}`, file.bytes, {
            access: "public",
            addRandomSuffix: false,
            contentType: file.contentType,
          });

          const values = {
            token,
            url: blob.url,
            searchTerm: term,
            sourceUrl: item.descriptionUrl ?? "",
            creator: item.creator ?? "",
            license: item.license ?? "",
            licenseUrl: item.licenseUrl ?? "",
            title: cleanTitle(item.title),
          };
          await db
            .insert(schema.visualImages)
            .values(values)
            .onConflictDoUpdate({ target: schema.visualImages.token, set: values });

          console.log(`✓ ${Math.round(file.bytes.length / 1024)}KB · ${item.license || "?"}`);
          saved = true;
          done++;
          break;
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
        }
      }

      if (!saved) {
        console.log(`✗ ${lastError}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${e instanceof Error ? e.message : String(e)}`);
      failed++;
    }

    if (i < jobs.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nTayyor: ${done} ta rasm${failed > 0 ? `, ${failed} tasi topilmadi` : ""}.`);
  console.log("Keyingi qadamlar:");
  console.log("  npm run gen:images -- --sheet   — rasmlarni KO'RIB CHIQING (bolalar ilovasi!)");
  console.log("  npm run publish:content         — versiyani oshirish");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
