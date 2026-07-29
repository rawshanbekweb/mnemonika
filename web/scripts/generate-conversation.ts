// Erkin suhbat senariylarini yaratadi (Gemini → baza).
//
// Ishga tushirish (web/ papkasidan):
//   npm run gen:conversation             — rejadagi yetishmaganlarini
//   npm run gen:conversation -- --dry    — nima yaratilishini ko'rsatadi
//   npm run gen:conversation -- --limit 1
//   npm run gen:conversation -- --force  — mavjudlarini qayta yozadi
//   npm run gen:conversation -- --print  — yozishdan oldin daraxtni chop etadi
//
// KVOTA: har suhbat = BITTA so'rov (butun daraxt bitta javobda). Gemini bepul
// tarifda kuniga 20 so'rov, ya'ni bir kunda ~20 suhbat.
//
// ARXITEKTURA (o'zgartirmang): daraxt SHAKLI `conversation-tree.ts` dagi
// skeletda qat'iy, model faqat MATN yozadi. Havolalar model javobidan
// OLINMAYDI — shuning uchun model qanday javob qaytarsa ham suhbat boshi berk
// ko'chaga kirmaydi. Mashq vaqtida esa model umuman chaqirilmaydi.

import "../src/db/load-env";
import { GoogleGenAI } from "@google/genai";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";
import { CONVERSATION_PLAN, type ConversationPlanItem } from "./content-plan";
import {
  SKELETON,
  START_KEY,
  CLOSING_KEY,
  buildTree,
  validateTree,
  type NodeText,
  type Tree,
} from "./conversation-tree";

const MODEL = "gemini-3.6-flash";
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

/**
 * Uslub namunasi — qo'lda yozilgan `free_talk_ben_london` dan olingan.
 *
 * `gen:tips` da o'rganilgan saboq: modelga "shunday yoz" deyishdan ko'ra tayyor
 * namuna ko'rsatish ancha ishonchli (o'sha yerda "siz/sen" aralashib ketgandi).
 */
const STYLE_EXAMPLE = `Namuna (boshqa mavzuda yozilgan, uslubni shundan ol):

  key: "start"
  line: "Hi! My name is Ben. I am eleven years old and I live in London. What is your name?"
  hintUz: "Salomlash va ismingni ayt: \\"Hello! My name is …\\""

  key: "topic_ask"
  line: "Nice to meet you! Tell me, what do you like doing in your free time?"
  hintUz: "Bo'sh vaqtingda nima qilishni yoqtirasan? \\"I like …\\" deb boshla."
  branches: [sport: football, sport, swimming] [music: music, guitar, singing] [books: books, reading, story]

  key: "closing"
  line: "It was really nice talking to you today. Thank you and see you next time. Goodbye!"
  hintUz: "Xayrlash: \\"Goodbye! It was nice to talk to you.\\""`;

function promptFor(item: ConversationPlanItem): string {
  const nodeList = SKELETON.map((spec) => {
    const branchNote =
      spec.fixedKeywords !== undefined
        ? " (tarmoq kalit so'zlari kerak EMAS — ular tayyor)"
        : spec.branchTargets.length > 0
          ? ` (${spec.branchTargets.length} ta tarmoq uchun kalit so'z yoz)`
          : "";
    return `- "${spec.key}"${branchNote}: ${spec.role}`;
  }).join("\n");

  return `Sen O'zbekistonda 5-6 sinf o'quvchilariga ingliz tili o'rgatadigan tajribali o'qituvchisan.
O'quvchilar darajasi A1-A2: sodda gaplar, Present Simple va Past Simple, kundalik so'zlar.

Erkin suhbat senariysi uchun MATN yoz. Bola telefonda ingliz tilida gapiradi,
personaj esa unga javob beradi.

- Mavzu: ${item.topic}
- Vaziyat: ${item.brief}
- Personaj: ${item.characterBrief}
- Suhbat davomiyligi: ${item.targetMinutes} daqiqa

Suhbat tuzilmasi OLDINDAN belgilangan. Quyidagi ${SKELETON.length} ta tugunning
HAR BIRI uchun matn yoz (kalitlarni AYNAN shu holicha qaytar, yangi tugun
qo'shma, tartibini o'zgartirma):

${nodeList}

Har bir tugun uchun:
- "line": personajning gapi INGLIZ tilida, 1-2 qisqa gap. Deyarli har tuguni
  bolaga savol bilan tugasin — bola javob berishi kerak.
- "hintUz": O'ZBEKCHA ko'rsatma, bolaga "sen" deb murojaat qil ("ayt", "qo'sh",
  "tushuntir"). "Ayting", "qo'shing" kabi "siz" shakli MUTLAQO YO'Q.
  Ko'rsatmada foydali INGLIZ iborasini qo'shtirnoq ichida ber.
- "branches": faqat tarmoqli tugunlarda. Har tarmoq uchun:
    "intent" — qisqa inglizcha nom ("sport", "music");
    "keywords" — 4-6 ta INGLIZ so'zi, bola shu yo'nalishda gapirsa aytishi
    mumkin bo'lgan so'zlar.
  Tarmoqlar tartibi MUHIM: yuqoridagi ro'yxatdagi A, B, C (yoki D, E, F)
  tartibida yoz.

Kalit so'z qoidalari (buzilsa suhbat noto'g'ri yo'ldan ketadi):
- faqat kichik harflar, bitta so'z (yoki "do you" kabi ibora);
- KAMIDA 4 harf — qisqa so'zlarni nutq tanigich chalkashtiradi;
- bir so'z boshqa so'z ichida uchramasin: "read" emas, "reading" yoz;
- tarmoqlar bir-biridan aniq farq qilsin (bir so'z ikki tarmoqda bo'lmasin);
- ENG MUHIMI: so'z 5-6 sinf o'quvchisi HAQIQATDA aytadigan so'z bo'lsin.
  Qoidaga moslash uchun sun'iy so'z O'YLAB TOPMA — "busride", "homeward",
  "staying" kabi so'zlarni bola hech qachon aytmaydi va u tarmoq umuman
  tanlanmaydi. Yaxshi misollar: "walking", "bicycle", "father", "cooking",
  "swimming", "holiday". Agar 4 harfli tabiiy so'z topilmasa, o'sha tarmoqqa
  KAMROQ kalit so'z yoz — 2 tasi ham yetarli.

Butun suhbat uchun yana:
- "title": suhbat nomi INGLIZ tilida, 2-4 so'z;
- "characterName": personaj ismi va qavs ichida o'zbekcha roli, masalan
  "Ben (London'lik tengdoshing)";
- "characterEmoji": BITTA emoji;
- "goalUz": bolaga o'zbekcha vazifa, bitta gap, "sen" shaklida;
- "visuals": 4 ta emoji.

${STYLE_EXAMPLE}

Faqat JSON qaytar.`;
}

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    characterName: { type: "string" },
    characterEmoji: { type: "string" },
    goalUz: { type: "string" },
    visuals: { type: "array", items: { type: "string" } },
    nodes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          line: { type: "string" },
          hintUz: { type: "string" },
          branches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                intent: { type: "string" },
                keywords: { type: "array", items: { type: "string" } },
              },
              required: ["intent", "keywords"],
            },
          },
        },
        required: ["key", "line", "hintUz"],
      },
    },
  },
  required: ["title", "characterName", "characterEmoji", "goalUz", "visuals", "nodes"],
};

type Generated = {
  title: string;
  characterName: string;
  characterEmoji: string;
  goalUz: string;
  visuals: string[];
  nodes: NodeText[];
};

/** Emoji ro'yxatidan matnli qatorlarni chiqarib tashlaydi. */
function cleanVisuals(raw: string[]): string[] {
  return raw.map((v) => v.trim()).filter((v) => v.length > 0 && !/[a-zA-Z0-9]/.test(v));
}

/** Suhbat darajasidagi maydonlarni tekshiradi (daraxtni `validateTree` tekshiradi). */
function checkMeta(o: Generated): string | null {
  if (!o.title?.trim()) return "title bo'sh";
  if (!o.characterName?.trim()) return "characterName bo'sh";
  if (!o.goalUz?.trim()) return "goalUz bo'sh";
  // "siz" shakli — `gen:tips` dagi saboq. Murabbiy va ko'rsatmalar bolaga
  // "sen" deb gapiradi, aralash shakl g'aliz chiqadi.
  const politeForm = /\b(ayting|qo'shing|tushuntiring|bering|boshlang|so'rang)\b/i;
  if (politeForm.test(o.goalUz)) return "goalUz \"siz\" shaklida yozilgan";
  const badHint = o.nodes.find((n) => politeForm.test(n.hintUz ?? ""));
  if (badHint) return `${badHint.key}: ko'rsatma "siz" shaklida yozilgan`;
  return null;
}

function printTree(tree: Tree): void {
  for (const n of tree.nodes) {
    console.log(`  ${n.nodeKey}${n.isEnd ? " (yakun)" : ""}`);
    console.log(`    ${n.line}`);
    console.log(`    → ${n.hintUz}`);
    for (const b of n.branches) {
      console.log(`    [${b.intent}] ${b.keywords.join(", ")} → ${b.nextKey}`);
    }
    if (n.fallbackKey) console.log(`    (aks holda → ${n.fallbackKey})`);
  }
}

async function save(item: ConversationPlanItem, o: Generated, tree: Tree): Promise<void> {
  const values = {
    moduleId: item.moduleId,
    topic: item.topic,
    title: o.title.trim(),
    characterName: o.characterName.trim(),
    characterEmoji: o.characterEmoji.trim(),
    goalUz: o.goalUz.trim(),
    visuals: cleanVisuals(o.visuals ?? []).slice(0, 4),
    targetMinutes: item.targetMinutes,
    startKey: START_KEY,
    closingKey: CLOSING_KEY,
  };

  const existing = await db.select().from(schema.conversations);
  await db
    .insert(schema.conversations)
    .values({ id: item.id, sortOrder: existing.length, ...values })
    .onConflictDoUpdate({ target: schema.conversations.id, set: values });

  // Tugunlar to'liq almashtiriladi — qisman yangilash daraxtda yetim
  // tugunlar qoldirardi (`seed-conversations.ts` dagi bilan bir xil usul).
  await db.delete(schema.conversationNodes).where(eq(schema.conversationNodes.conversationId, item.id));
  let order = 0;
  for (const n of tree.nodes) {
    await db.insert(schema.conversationNodes).values({
      conversationId: item.id,
      nodeKey: n.nodeKey,
      line: n.line,
      hintUz: n.hintUz,
      branches: n.branches,
      fallbackKey: n.fallbackKey,
      isEnd: n.isEnd,
      sortOrder: order++,
    });
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const force = args.includes("--force");
  const print = args.includes("--print");
  const limitArg = args.indexOf("--limit");
  const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;

  if (!dry && !process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY yo'q. web/.env fayliga qo'shing.");
    process.exit(1);
  }

  const modules = await db.select().from(schema.modules);
  const missing = [...new Set(CONVERSATION_PLAN.map((p) => p.moduleId))].filter(
    (id) => !modules.some((m) => m.id === id),
  );
  if (missing.length > 0) {
    console.error(`Bazada bunday modullar yo'q: ${missing.join(", ")}. Avval: npm run db:conversations`);
    process.exit(1);
  }

  const existing = new Set((await db.select().from(schema.conversations)).map((c) => c.id));
  const jobs = CONVERSATION_PLAN.filter((p) => force || !existing.has(p.id)).slice(0, limit);

  console.log(
    `Rejada: ${CONVERSATION_PLAN.length}, bazada bor: ${existing.size}, ishlanadi: ${jobs.length}`,
  );
  if (jobs.length === 0) {
    console.log("Yangi suhbat kerak emas. (Qayta yozish uchun --force)");
    return;
  }
  if (dry) {
    for (const j of jobs) console.log(`  ${j.id}  ${j.topic} — ${j.targetMinutes} daq, ${SKELETON.length} tugun`);
    console.log("\n(--dry: hech narsa yaratilmadi)");
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let done = 0;
  let stopped = false;

  for (const [i, item] of jobs.entries()) {
    if (stopped) break;
    process.stdout.write(`[${i + 1}/${jobs.length}] ${item.id} … `);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const interaction = await ai.interactions.create({
          model: MODEL,
          input: promptFor(item),
          response_format: { type: "text", mime_type: "application/json", schema: SCHEMA },
        });

        const raw = interaction.output_text;
        if (!raw) throw new Error("javobda output_text bo'sh");
        const parsed = JSON.parse(raw) as Generated;

        const metaProblem = checkMeta(parsed);
        if (metaProblem) throw new Error(metaProblem);

        // Daraxt skeletdan yig'iladi — model havola bermaydi.
        const tree = buildTree(parsed.nodes ?? []);
        const problems = validateTree(tree);
        if (problems.length > 0) throw new Error(`daraxt: ${problems.slice(0, 3).join("; ")}`);

        if (print) {
          console.log(`\n— ${parsed.title} (${parsed.characterName})`);
          printTree(tree);
        }

        await save(item, parsed, tree);
        done++;
        console.log(`✓ ${parsed.title} (${tree.nodes.length} tugun)`);
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);

        if (isRateLimit(msg)) {
          const wait = retryAfterMs(msg);
          if (wait !== null && wait <= MAX_WAIT_MS && attempt < MAX_RETRIES) {
            console.log(`⏳ chegara, ${Math.round(wait / 1000)}s kutamiz…`);
            await sleep(wait);
            process.stdout.write(`[${i + 1}/${jobs.length}] ${item.id} … `);
            continue;
          }
          console.log("✗");
          console.error(`\nKunlik chegaraga yetdi. ${done} ta suhbat yaratildi.`);
          console.error("Ertaga shu buyruqni qayta ishga tushiring — qolganidan davom etadi.");
          console.error(`\nGoogle xabari: ${msg}`);
          stopped = true;
          break;
        }

        if (attempt < MAX_RETRIES) {
          console.log(`↻ (${msg})`);
          process.stdout.write(`[${i + 1}/${jobs.length}] ${item.id} … `);
          continue;
        }

        console.log(`✗ ${msg}`);
        break;
      }
    }

    if (!stopped && i < jobs.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nTayyor: ${done} ta suhbat.`);
  if (done > 0) {
    console.log("MUHIM: yaratilgan matnni O'QIB chiqing (npm run gen:conversation -- --print).");
    console.log("Keyin: npm run export:content, so'ng admin panelida 'Publish'.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
