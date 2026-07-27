// Mashqqa xos murabbiy maslahatlarini yaratadi (Gemini → baza).
//
// Ishga tushirish (web/ papkasidan):
//   npm run gen:tips             — maslahati yo'q mashqlar uchun yaratadi
//   npm run gen:tips -- --dry    — nima yaratilishini ko'rsatadi, chaqiruvsiz
//   npm run gen:tips -- --limit 2
//   npm run gen:tips -- --force  — mavjudlarini ham qayta yaratadi
//
// NIMA UCHUN:
// `Coach` umumiy matn beradi — "For example… deb misol qo'sh". Bu mavzuga
// bog'lanmagan. Bank o'sha o'rinni shu mashq mavzusiga moslangan matn bilan
// almashtiradi. QAROR QABUL QILISH QOIDALARDA QOLADI: qaysi bosqich
// yetishmaganini Coach o'zi aniqlaydi (offline, modelsiz), model faqat
// KO'RSATILADIGAN MATNni yozadi. Ball formulasiga ta'siri yo'q.
//
// Bola ma'lumoti yuborilmaydi — faqat mashq mavzusi, mnemonika va kalit so'zlar.

import "../src/db/load-env";
import { GoogleGenAI } from "@google/genai";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "../src/db";
import { checkableMoves } from "../src/lib/coach";

const MODEL = "gemini-3.6-flash";

/** Chaqiruvlar orasidagi kutish — so'rovlarni bir zumda otib yubormaslik uchun. */
const DELAY_MS = 4_000;
const MAX_RETRIES = 1;
const MAX_WAIT_MS = 120_000;

/**
 * Har harakat nima ekani + `Coach` dagi UMUMIY matn.
 *
 * Umumiy matn modelga uslub namunasi sifatida beriladi — bu eng ishonchli
 * usul: birinchi urinishda model "siz" shaklida yozdi ("ayting", "keltiring"),
 * murabbiyning qolgan matnlari esa bolaga "sen" deb gapiradi ("ayt", "qo'sh").
 * Aralash shakl g'aliz chiqadi, shuning uchun namuna ko'rsatiladi.
 */
const MOVE_MEANING: Record<string, { what: string; generic: string }> = {
  OPINION: {
    what: "o'z fikrini bildirish (I think…, In my opinion…)",
    generic: 'Javobingni "I think…" yoki "In my opinion…" bilan boshla.',
  },
  EXAMPLE: {
    what: "misol keltirish (For example…, such as…)",
    generic: '"For example…" deb bitta misol qo\'sh — javobing ishonchli bo\'ladi.',
  },
  REASON: {
    what: "sabab aytish (because…, that's why…)",
    generic: '"because" so\'zini ishlat — nega shunday deb o\'ylashingni tushuntir.',
  },
  OTHERS: {
    what: "boshqalarning fikrini aytish (Some people think…)",
    generic: '"Some people think…" deb boshqalarning fikrini ham ayt.',
  },
  SUMMARY: {
    what: "xulosa qilish (Finally…, Overall…)",
    generic: 'Oxirida "Finally…" yoki "Overall…" deb qisqa xulosa ayt.',
  },
  SEQUENCE: {
    what: "voqealarni tartib bilan aytish (First…, Then…, After that…)",
    generic: '"First…", "Then…", "After that…" bilan voqealarni tartib bilan ayt.',
  },
  EMOTION: {
    what: "his-tuyg'uni aytish (happy, excited, scared…)",
    generic: "O'zingni qanday his qilganingni ayt: happy, excited, scared…",
  },
  PLACE: {
    what: "joyni ko'rsatish (in front of…, behind…, on the left…)",
    generic: '"in front of", "behind", "on the left" bilan joyni tasvirla.',
  },
  DESCRIBE: {
    what: "ko'rganini tasvirlash (There is…, I can see…)",
    generic: '"There is…", "I can see…" deb ko\'rganingni tasvirlab ber.',
  },
};

function retryAfterMs(message: string): number | null {
  const m = /retry in ([\d.]+)\s*s/i.exec(message);
  if (!m) return null;
  const seconds = Number(m[1]);
  return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) + 2_000 : null;
}

function isRateLimit(message: string): boolean {
  return /429|quota|rate limit|RESOURCE_EXHAUSTED/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type Row = typeof schema.exercises.$inferSelect;

function promptFor(ex: Row, moves: string[]): string {
  const steps = ex.mnemonicSteps.map((s) => `${s.letter} = ${s.en} (${s.uz})`).join("; ");
  const moveList = moves
    .map((m) => {
      const info = MOVE_MEANING[m];
      if (!info) return `- ${m}`;
      return `- ${m}: ${info.what}\n  Hozirgi umumiy matn: "${info.generic}"`;
    })
    .join("\n");

  return `Sen 5-6 sinf o'quvchilariga ingliz tilida gapirishni o'rgatadigan tajribali o'qituvchisan.

Mashq:
- Sarlavha: ${ex.title}
- Mavzu: ${ex.topic}
- Savollar: ${ex.prompts.join(" | ")}
- Mnemonika ${ex.acronym}: ${steps}
- Kalit so'zlar: ${ex.keywords.join(", ") || "(yo'q)"}

O'quvchi javob berdi, lekin quyidagi nutq harakatlaridan birini ishlatmadi:
${moveList}

Har biri uchun O'ZBEK TILIDA bitta qisqa maslahat yoz — yuqoridagi umumiy
matnning AYNAN SHU MASHQ MAVZUSIGA moslangan variantini.

Talablar:
- MUROJAAT SHAKLI: bolaga "sen" deb murojaat qil — "ayt", "qo'sh", "boshla",
  "tasvirla". "Ayting", "qo'shing", "bering" kabi "siz" shakli MUTLAQO YO'Q.
  Yuqoridagi "Hozirgi umumiy matn" — uslub namunasi, aynan shu ohangda yoz.
- "detail" — bitta gap, 12 so'zdan oshmasin.
- Ishlatilishi kerak bo'lgan INGLIZ iborasini qo'shtirnoq ichida ko'rsat.
- Umumiy gap emas, shu mavzudan olingan KONKRET misol bo'lsin.
- "title" — 1-2 so'zlik o'zbekcha sarlavha.
- Do'stona, ayblovsiz ohang. Emoji ishlatma. Imloga e'tibor ber.`;
}

const SCHEMA = {
  type: "object",
  properties: {
    tips: {
      type: "array",
      items: {
        type: "object",
        properties: {
          move: { type: "string" },
          title: { type: "string" },
          detail: { type: "string" },
        },
        required: ["move", "title", "detail"],
      },
    },
  },
  required: ["tips"],
};

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const force = args.includes("--force");
  const limitArg = args.indexOf("--limit");
  const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;

  if (!dry && !process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY yo'q. web/.env fayliga qo'shing.");
    process.exit(1);
  }

  const exercises = await db.select().from(schema.exercises);
  const existing = await db.select().from(schema.exerciseTips);
  const haveFor = new Set(existing.map((t) => t.exerciseId));

  // Faqat Coach TEKSHIRA OLADIGAN bosqichlar uchun matn kerak —
  // "Eye contact" kabi bosqichlar nutq matnidan aniqlanmaydi.
  const jobs = exercises
    .map((ex) => ({ ex, moves: checkableMoves(ex.mnemonicSteps.map((s) => s.en)) }))
    .filter((j) => j.moves.length > 0)
    .filter((j) => force || !haveFor.has(j.ex.id))
    .slice(0, limit);

  console.log(
    `Mashqlar: ${exercises.length}, maslahati bor: ${haveFor.size}, ishlanadi: ${jobs.length}`,
  );
  if (jobs.length === 0) {
    console.log("Yangi maslahat kerak emas. (Qayta yaratish uchun --force)");
    return;
  }
  if (dry) {
    for (const j of jobs) console.log(`  ${j.ex.id} → ${j.moves.join(", ")}`);
    console.log("\n(--dry: hech narsa yaratilmadi)");
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let done = 0;
  let stopped = false;

  for (const [i, job] of jobs.entries()) {
    if (stopped) break;
    process.stdout.write(`[${i + 1}/${jobs.length}] ${job.ex.id} (${job.moves.join(",")}) … `);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const interaction = await ai.interactions.create({
          model: MODEL,
          input: promptFor(job.ex, job.moves),
          response_format: { type: "text", mime_type: "application/json", schema: SCHEMA },
        });

        const raw = interaction.output_text;
        if (!raw) throw new Error("javobda output_text bo'sh");
        const parsed = JSON.parse(raw) as { tips?: { move: string; title: string; detail: string }[] };

        // Model o'ylab topgan harakatni qabul qilmaymiz — faqat so'ralganlari.
        const valid = (parsed.tips ?? []).filter(
          (t) => job.moves.includes(t.move) && t.detail?.trim(),
        );
        if (valid.length === 0) throw new Error("yaroqli maslahat qaytmadi");

        // Qayta yaratishda eskilarini almashtiramiz.
        if (force) {
          await db.delete(schema.exerciseTips).where(eq(schema.exerciseTips.exerciseId, job.ex.id));
        }
        for (const t of valid) {
          await db
            .insert(schema.exerciseTips)
            .values({
              exerciseId: job.ex.id,
              move: t.move,
              title: t.title?.trim() ?? "",
              detail: t.detail.trim(),
            })
            .onConflictDoUpdate({
              target: [schema.exerciseTips.exerciseId, schema.exerciseTips.move],
              set: { title: t.title?.trim() ?? "", detail: t.detail.trim() },
            });
        }

        done++;
        console.log(`✓ ${valid.length} maslahat`);
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);

        if (isRateLimit(msg)) {
          const wait = retryAfterMs(msg);
          if (wait !== null && wait <= MAX_WAIT_MS && attempt < MAX_RETRIES) {
            console.log(`⏳ chegara, ${Math.round(wait / 1000)}s kutamiz…`);
            await sleep(wait);
            process.stdout.write(`[${i + 1}/${jobs.length}] ${job.ex.id} … `);
            continue;
          }
          console.log("✗");
          console.error(`\nKunlik chegaraga yetdi. ${done} ta mashq ishlandi.`);
          console.error("Ertaga shu buyruqni qayta ishga tushiring — qolganidan davom etadi.");
          console.error(`\nGoogle xabari: ${msg}`);
          stopped = true;
          break;
        }

        console.log("✗");
        console.error(`  Xato: ${msg}`);
        stopped = true;
        break;
      }
    }

    if (!stopped && i < jobs.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nTayyor: ${done} ta mashq uchun maslahat.`);
  if (done > 0) console.log("Endi admin panelida 'Publish' bosing.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
