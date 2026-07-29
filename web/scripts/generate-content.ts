// Yangi mashq va dialoglarni yaratadi (Gemini → baza).
//
// Ishga tushirish (web/ papkasidan):
//   npm run gen:content                — rejadagi yetishmagan hamma narsani
//   npm run gen:content -- --dry       — nima yaratilishini ko'rsatadi, chaqiruvsiz
//   npm run gen:content -- --limit 5
//   npm run gen:content -- --module discussion
//   npm run gen:content -- --force     — mavjudlarini ham qayta yozadi
//
// ARXITEKTURA QARORI (o'zgartirmang): AI faqat KONTENT TAYYORLASH vaqtida
// ishlaydi, mashq vaqtida emas. Bu yerda bola ma'lumoti umuman yo'q — faqat
// mavzu nomi va mnemonika yuboriladi.
//
// NIMA YARATILISHI `content-plan.ts` da: mnemonika, ID, mavzu, vaqt chegarasi
// qat'iy yozilgan; model faqat MATN yozadi (savollar, kalit so'zlar, dialog
// gaplari). Sabab: mnemonika bosqichlarini model o'ylab topsa, `Coach` ularni
// tanimay qoladi va struktura maslahati jim bo'lib qoladi.
//
// Yaratilgandan keyin:
//   npm run gen:tips   — yangi mashqlarga mavzuga xos maslahat
//   npm run gen:audio  — savollarga talaffuz audiosi (kuniga ~10 ta klip)
//   admin panelida "Publish" — ilova yangilikni shundan biladi

import "../src/db/load-env";
import { GoogleGenAI } from "@google/genai";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "../src/db";
import { PLAN, assertBankIsCheckable, itemId, type PlanItem } from "./content-plan";

const MODEL = "gemini-3.6-flash";

/** Chaqiruvlar orasidagi kutish — daqiqasiga ~8 so'rov. */
const DELAY_MS = 7_000;
const MAX_RETRIES = 1;
const MAX_WAIT_MS = 120_000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function retryAfterMs(message: string): number | null {
  const m = /retry in ([\d.]+)\s*s/i.exec(message);
  if (!m) return null;
  const seconds = Number(m[1]);
  return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) + 2_000 : null;
}

function isRateLimit(message: string): boolean {
  return /429|quota|rate limit|RESOURCE_EXHAUSTED/i.test(message);
}

// ——————————————————————————————————————————————————————————————————
// Promptlar
// ——————————————————————————————————————————————————————————————————

/** Har bir promptning boshi — daraja va til talablari hamma joyda bir xil. */
const AUDIENCE = `Sen O'zbekistonda 5-6 sinf o'quvchilariga ingliz tili o'rgatadigan tajribali o'qituvchisan.
O'quvchilar darajasi A1-A2: sodda gaplar, Present Simple va Past Simple, kundalik so'zlar.
Gaplar qisqa va aniq bo'lsin, murakkab grammatika va noyob so'zlar ishlatma.`;

function exercisePrompt(item: PlanItem): string {
  const m = item.mnemonic!;
  const steps = m.steps.map((s) => `${s.letter} = ${s.en}`).join("; ");
  return `${AUDIENCE}

Yangi og'zaki nutq mashqi uchun matn yoz.

- Mavzu: ${item.topic}
- Vaziyat: ${item.brief}
- O'quvchi javob berayotganda mnemonika ${m.acronym} bo'yicha gapiradi: ${steps}
- Javob uchun vaqt: ${item.timeLimitSec} soniya

Talablar:
- "title": mashq nomi INGLIZ tilida, 2-4 so'z, bosh harflar bilan (masalan "My Dream Pet").
- "prompts": o'quvchiga beriladigan 2-3 ta INGLIZ savoli. Har biri bitta gap.
  Birinchi savol asosiy, keyingilari fikrni kengaytirsin. Savollar shunday
  bo'lsinki, ularga javob berish uchun yuqoridagi mnemonika bosqichlari tabiiy
  kerak bo'lsin.
- "keywords": 5 ta INGLIZ so'zi — o'quvchi javobida ishlatishi kutilgan mavzuga
  oid so'zlar. Faqat bitta so'z (ibora emas), kichik harflarda, 4 harfdan uzun
  bo'lsin (qisqa so'zlarni nutq tanigich chalkashtiradi).
- "visuals": 5-6 ta emoji — mavzuni ko'rsatadigan, matnsiz.

Faqat JSON qaytar.`;
}

function readAloudPrompt(item: PlanItem): string {
  return `${AUDIENCE}

"Takrorlang" mashqi uchun matn yoz: o'quvchi ekrandagi jumlani ovoz chiqarib
o'qiydi, dastur esa har bir so'zni solishtirib talaffuz aniqligini o'lchaydi.

- Mavzu: ${item.brief}

Talablar:
- "targetText": BITTA ingliz gapi, 12-16 so'z. Sodda so'zlar, A2 daraja.
  Qisqartma yo'q (don't emas, do not), raqam yo'q (so'z bilan yoz), tire va
  qavs yo'q — nutq tanigich ularni o'qiy olmaydi. Nuqta bilan tugasin.
- "title": o'zbekcha nom, "Takrorlang: " bilan boshlansin, keyin 1-2 inglizcha so'z.
- "visuals": 2 ta emoji.

Faqat JSON qaytar.`;
}

function dialogPrompt(item: PlanItem, style: "roleplay" | "interview"): string {
  const m = item.mnemonic!;
  const steps = m.steps.map((s) => `${s.letter} = ${s.en}`).join("; ");

  // Ikki modulning YO'NALISHI teskari: rolli o'yinda personaj savol beradi,
  // intervyuda esa savolni O'QUVCHI beradi va personaj javob qaytaradi.
  const direction =
    style === "roleplay"
      ? `Bu ROLLI O'YIN. Har navbatda personaj gapiradi yoki savol beradi, o'quvchi javob beradi.
- "characterLine": personajning gapi (ingliz tilida) — o'quvchidan javob kutadigan gap.
- "studentHint": o'zbekcha ko'rsatma — o'quvchi nima deyishi kerakligi.`
      : `Bu INTERVYU. Savolni O'QUVCHI beradi, personaj javob qaytaradi.
- "studentHint": o'zbekcha ko'rsatma — o'quvchi qanday savol berishi kerakligi
  ("Uning ish kuni haqida so'ra" kabi).
- "characterLine": personajning shu savolga JAVOBI (ingliz tilida). Bu javob
  o'quvchi savol berganidan keyin ko'rsatiladi.`;

  return `${AUDIENCE}

Yangi ${style === "roleplay" ? "rolli o'yin" : "intervyu"} senariysini yoz.

- Mavzu: ${item.topic}
- Vaziyat: ${item.brief}
- Mnemonika ${m.acronym}: ${steps}

${direction}

Talablar:
- "title": senariy nomi INGLIZ tilida, 2-4 so'z.
- "characterName": personaj ismi va qavs ichida o'zbekcha roli — masalan
  "Nodira (shifokor)". Ism sodda va talaffuzi oson bo'lsin.
- "characterEmoji": personajni ifodalaydigan BITTA emoji.
- "intro": personajning birinchi salomlashuvi (ingliz tilida, 1-2 gap).
  Suhbatni boshlaydi va o'zini tanishtiradi.
- "turns": AYNAN 4 ta navbat. Suhbat mantiqan rivojlansin: tanishuv →
  asosiy mavzu → tafsilot → xayrlashuv.
- "expectedKeywords": har navbat uchun 3-4 ta INGLIZ so'zi — o'quvchi javobida
  kutilgan so'zlar. Kichik harflar, bitta so'z, imkon qadar 4 harfdan uzun.
- "visuals": 4 ta emoji.

Faqat JSON qaytar.`;
}

// ——————————————————————————————————————————————————————————————————
// Javob sxemalari
// ——————————————————————————————————————————————————————————————————

const EXERCISE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    prompts: { type: "array", items: { type: "string" } },
    keywords: { type: "array", items: { type: "string" } },
    visuals: { type: "array", items: { type: "string" } },
  },
  required: ["title", "prompts", "keywords", "visuals"],
};

const READ_ALOUD_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    targetText: { type: "string" },
    visuals: { type: "array", items: { type: "string" } },
  },
  required: ["title", "targetText", "visuals"],
};

const DIALOG_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    characterName: { type: "string" },
    characterEmoji: { type: "string" },
    intro: { type: "string" },
    visuals: { type: "array", items: { type: "string" } },
    turns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          characterLine: { type: "string" },
          studentHint: { type: "string" },
          expectedKeywords: { type: "array", items: { type: "string" } },
        },
        required: ["characterLine", "studentHint", "expectedKeywords"],
      },
    },
  },
  required: ["title", "characterName", "characterEmoji", "intro", "visuals", "turns"],
};

// ——————————————————————————————————————————————————————————————————
// Tekshiruv — model javobi ishlatishga yaroqlimi
// ——————————————————————————————————————————————————————————————————

type ExerciseOut = { title: string; prompts: string[]; keywords: string[]; visuals: string[] };
type ReadAloudOut = { title: string; targetText: string; visuals: string[] };
type DialogOut = {
  title: string;
  characterName: string;
  characterEmoji: string;
  intro: string;
  visuals: string[];
  turns: { characterLine: string; studentHint: string; expectedKeywords: string[] }[];
};

/**
 * Kalit so'zlarni tozalaydi.
 *
 * NIMA UCHUN 4 HARF CHEGARASI: qisqa so'zlarni ("dog", "cat") nutq tanigich
 * boshqa so'zga aylantirib yuboradi va bola aytgan bo'lsa ham hisoblanmaydi
 * (`keyword-matcher.ts` dagi saboq). Kalit so'z ballga ta'sir qiladi, shuning
 * uchun ishonchsizlarini umuman olmaymiz.
 */
function cleanKeywords(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of raw) {
    const word = w.trim().toLowerCase().replace(/[^a-z']/g, "");
    if (word.length < 4 || seen.has(word)) continue;
    seen.add(word);
    out.push(word);
  }
  return out;
}

/**
 * Sarlavhani tartibga soladi.
 *
 * Model ba'zan sarlavhani BUTUNLAY BOSH HARFLAR bilan qaytaradi ("MY FAVORITE
 * HOBBY") — mashqlar ro'yxatida bittasi qichqirib turadi. Aralash harfli
 * sarlavhaga tegilmaydi (masalan "Takrorlang: Our School").
 */
function normalizeTitle(raw: string): string {
  const t = raw.trim().replace(/\s+/g, " ");
  if (/\p{Ll}/u.test(t)) return t;
  return t.toLowerCase().replace(/(^|[\s:'’-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** Emoji ro'yxatidan matnli qatorlarni chiqarib tashlaydi. */
function cleanVisuals(raw: string[]): string[] {
  return raw.map((v) => v.trim()).filter((v) => v.length > 0 && !/[a-zA-Z0-9]/.test(v));
}

function checkExercise(o: ExerciseOut): string | null {
  if (!o.title?.trim()) return "title bo'sh";
  const prompts = (o.prompts ?? []).map((p) => p.trim()).filter(Boolean);
  if (prompts.length < 2) return `savollar kam (${prompts.length})`;
  if (cleanKeywords(o.keywords ?? []).length < 3) return "yaroqli kalit so'z 3 tadan kam";
  if (cleanVisuals(o.visuals ?? []).length < 3) return "emoji 3 tadan kam";
  return null;
}

function checkReadAloud(o: ReadAloudOut): string | null {
  const text = o.targetText?.trim() ?? "";
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 8 || words.length > 22) return `jumla uzunligi mos emas (${words.length} so'z)`;
  if (/\d/.test(text)) return "matnda raqam bor";
  if (!o.title?.trim()) return "title bo'sh";
  return null;
}

function checkDialog(o: DialogOut): string | null {
  if (!o.title?.trim()) return "title bo'sh";
  if (!o.intro?.trim()) return "intro bo'sh";
  const turns = o.turns ?? [];
  if (turns.length < 3) return `navbat kam (${turns.length})`;
  for (const [i, t] of turns.entries()) {
    if (!t.characterLine?.trim()) return `${i + 1}-navbatda personaj gapi yo'q`;
    if (!t.studentHint?.trim()) return `${i + 1}-navbatda o'quvchi ko'rsatmasi yo'q`;
  }
  return null;
}

// ——————————————————————————————————————————————————————————————————

async function nextSortOrder(moduleId: string, table: "exercises" | "dialogs"): Promise<number> {
  if (table === "exercises") {
    const rows = await db
      .select()
      .from(schema.exercises)
      .where(eq(schema.exercises.moduleId, moduleId))
      .orderBy(asc(schema.exercises.sortOrder));
    return rows.length === 0 ? 0 : rows[rows.length - 1].sortOrder + 1;
  }
  const rows = await db
    .select()
    .from(schema.dialogs)
    .where(eq(schema.dialogs.moduleId, moduleId))
    .orderBy(asc(schema.dialogs.sortOrder));
  return rows.length === 0 ? 0 : rows[rows.length - 1].sortOrder + 1;
}

async function saveExercise(item: PlanItem, o: ExerciseOut): Promise<void> {
  const id = itemId(item);
  const values = {
    moduleId: item.moduleId,
    topic: item.topic,
    title: normalizeTitle(o.title),
    acronym: item.mnemonic!.acronym,
    mnemonicSteps: item.mnemonic!.steps,
    prompts: o.prompts.map((p) => p.trim()).filter(Boolean).slice(0, 3),
    keywords: cleanKeywords(o.keywords).slice(0, 5),
    visuals: cleanVisuals(o.visuals).slice(0, 6),
    timeLimitSec: item.timeLimitSec,
    targetText: "",
  };
  await db
    .insert(schema.exercises)
    .values({ id, sortOrder: await nextSortOrder(item.moduleId, "exercises"), ...values })
    .onConflictDoUpdate({ target: schema.exercises.id, set: values });
}

async function saveReadAloud(item: PlanItem, o: ReadAloudOut): Promise<void> {
  const id = itemId(item);
  const values = {
    moduleId: item.moduleId,
    topic: item.topic,
    title: normalizeTitle(o.title),
    acronym: "",
    mnemonicSteps: [],
    prompts: [],
    keywords: [],
    visuals: cleanVisuals(o.visuals).slice(0, 3),
    timeLimitSec: item.timeLimitSec,
    targetText: o.targetText.trim(),
  };
  await db
    .insert(schema.exercises)
    .values({ id, sortOrder: await nextSortOrder(item.moduleId, "exercises"), ...values })
    .onConflictDoUpdate({ target: schema.exercises.id, set: values });
}

async function saveDialog(item: PlanItem, o: DialogOut): Promise<void> {
  const id = itemId(item);
  const values = {
    moduleId: item.moduleId,
    topic: item.topic,
    title: normalizeTitle(o.title),
    characterName: o.characterName.trim(),
    characterEmoji: o.characterEmoji.trim(),
    intro: o.intro.trim(),
    acronym: item.mnemonic!.acronym,
    mnemonicSteps: item.mnemonic!.steps,
    visuals: cleanVisuals(o.visuals).slice(0, 4),
  };
  await db
    .insert(schema.dialogs)
    .values({ id, sortOrder: await nextSortOrder(item.moduleId, "dialogs"), ...values })
    .onConflictDoUpdate({ target: schema.dialogs.id, set: values });

  // Navbatlar to'liq almashtiriladi (seed.ts dagi bilan bir xil usul) —
  // qisman yangilash tartibni chalkashtirib yuborardi.
  await db.delete(schema.dialogTurns).where(eq(schema.dialogTurns.dialogId, id));
  let order = 0;
  for (const t of o.turns.slice(0, 4)) {
    await db.insert(schema.dialogTurns).values({
      dialogId: id,
      characterLine: t.characterLine.trim(),
      studentHint: t.studentHint.trim(),
      expectedKeywords: cleanKeywords(t.expectedKeywords ?? []).slice(0, 4),
      sortOrder: order++,
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const force = args.includes("--force");
  const limitArg = args.indexOf("--limit");
  const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
  const moduleArg = args.indexOf("--module");
  const onlyModule = moduleArg >= 0 ? args[moduleArg + 1] : null;

  // Mnemonikalar Coach ga tushunarli ekanini oldindan tekshiramiz — bu
  // xato faqat bola maslahat olmaganda bilinardi.
  assertBankIsCheckable();

  if (!dry && !process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY yo'q. web/.env fayliga qo'shing.");
    process.exit(1);
  }

  const modules = await db.select().from(schema.modules);
  const moduleIds = new Set(modules.map((m) => m.id));
  const missingModules = [...new Set(PLAN.map((p) => p.moduleId))].filter((id) => !moduleIds.has(id));
  if (missingModules.length > 0) {
    console.error(`Bazada bunday modullar yo'q: ${missingModules.join(", ")}. Avval: npm run seed`);
    process.exit(1);
  }

  const existingEx = new Set((await db.select().from(schema.exercises)).map((e) => e.id));
  const existingDl = new Set((await db.select().from(schema.dialogs)).map((d) => d.id));

  const jobs = PLAN.filter((p) => (onlyModule ? p.moduleId === onlyModule : true))
    .filter((p) => {
      if (force) return true;
      const id = itemId(p);
      return p.kind === "dialog" ? !existingDl.has(id) : !existingEx.has(id);
    })
    .slice(0, limit);

  console.log(
    `Rejada: ${PLAN.length}, bazada bor: ${existingEx.size + existingDl.size}, ishlanadi: ${jobs.length}`,
  );
  if (jobs.length === 0) {
    console.log("Yangi kontent kerak emas. (Qayta yozish uchun --force)");
    return;
  }
  if (dry) {
    for (const j of jobs) console.log(`  ${itemId(j)}  [${j.kind}]  ${j.topic}`);
    console.log("\n(--dry: hech narsa yaratilmadi)");
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let done = 0;
  let stopped = false;

  for (const [i, item] of jobs.entries()) {
    if (stopped) break;
    const id = itemId(item);
    process.stdout.write(`[${i + 1}/${jobs.length}] ${id} … `);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const isDialog = item.kind === "dialog";
        const style = item.moduleId === "interview" ? "interview" : "roleplay";
        const input =
          item.kind === "exercise"
            ? exercisePrompt(item)
            : item.kind === "readaloud"
              ? readAloudPrompt(item)
              : dialogPrompt(item, style);
        const schemaFor =
          item.kind === "exercise"
            ? EXERCISE_SCHEMA
            : item.kind === "readaloud"
              ? READ_ALOUD_SCHEMA
              : DIALOG_SCHEMA;

        const interaction = await ai.interactions.create({
          model: MODEL,
          input,
          response_format: { type: "text", mime_type: "application/json", schema: schemaFor },
        });

        const raw = interaction.output_text;
        if (!raw) throw new Error("javobda output_text bo'sh");
        const parsed = JSON.parse(raw);

        // Sxema maydonlar BORLIGINI kafolatlaydi, lekin ular ishlatishga
        // yaroqli ekanini emas — shuning uchun alohida tekshiruv.
        if (item.kind === "exercise") {
          const bad = checkExercise(parsed as ExerciseOut);
          if (bad) throw new Error(bad);
          await saveExercise(item, parsed as ExerciseOut);
        } else if (item.kind === "readaloud") {
          const bad = checkReadAloud(parsed as ReadAloudOut);
          if (bad) throw new Error(bad);
          await saveReadAloud(item, parsed as ReadAloudOut);
        } else {
          const bad = checkDialog(parsed as DialogOut);
          if (bad) throw new Error(bad);
          await saveDialog(item, parsed as DialogOut);
        }

        done++;
        console.log(`✓ ${isDialog ? "dialog" : "mashq"}: ${parsed.title}`);
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);

        if (isRateLimit(msg)) {
          const wait = retryAfterMs(msg);
          if (wait !== null && wait <= MAX_WAIT_MS && attempt < MAX_RETRIES) {
            console.log(`⏳ chegara, ${Math.round(wait / 1000)}s kutamiz…`);
            await sleep(wait);
            process.stdout.write(`[${i + 1}/${jobs.length}] ${id} … `);
            continue;
          }
          console.log("✗");
          console.error(`\nKunlik chegaraga yetdi. ${done} ta yaratildi.`);
          console.error("Ertaga shu buyruqni qayta ishga tushiring — qolganidan davom etadi.");
          console.error(`\nGoogle xabari: ${msg}`);
          stopped = true;
          break;
        }

        // Sifat tekshiruvidan o'tmasa bir marta qayta so'raymiz — model
        // ko'pincha ikkinchi urinishda to'g'ri javob beradi.
        if (attempt < MAX_RETRIES) {
          console.log(`↻ (${msg})`);
          process.stdout.write(`[${i + 1}/${jobs.length}] ${id} … `);
          continue;
        }

        console.log(`✗ ${msg}`);
        break;
      }
    }

    if (!stopped && i < jobs.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nTayyor: ${done} ta yangi kontent.`);
  if (done > 0) {
    console.log("Keyingi qadamlar:");
    console.log("  npm run gen:tips    — yangi mashqlarga murabbiy maslahatlari");
    console.log("  npm run gen:audio   — savollarga talaffuz audiosi (kunlik chegara bor)");
    console.log("  admin panelida 'Publish' — ilova yangilikni shundan biladi");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
