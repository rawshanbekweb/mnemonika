// Mashq matnlari uchun ingliz talaffuzi audiosini yaratadi (Gemini TTS → Vercel Blob).
//
// Ishga tushirish (web/ papkasidan):
//   npm run gen:audio            — yaratilmagan hammasini yaratadi
//   npm run gen:audio -- --dry   — faqat nima yaratilishini ko'rsatadi, chaqiruv qilmaydi
//   npm run gen:audio -- --limit 5
//
// NEGA SKRIPT, ADMIN TUGMASI EMAS:
// Bepul tarifda so'rov tezligi past va kunlik chegara bor. Skript o'zini
// sekinlashtiradi, 429'da toza to'xtaydi va QAYTA ISHGA TUSHIRILSA davom etadi
// (allaqachon yaratilganlarni o'tkazib yuboradi). Serverless funksiya buni
// qila olmaydi — u vaqt chegarasiga urilib yarim yo'lda uzilardi.
//
// MUHIM: audio bola nutqini EMAS, bizning ingliz matnimizni yuboradi. Shuning
// uchun bepul tarifning "odam-tekshiruvchi o'qishi mumkin" sharti bu yerda
// muammo emas — bolaning hech qanday ma'lumoti chiqmaydi.

import "../src/db/load-env";
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";
import { db, schema } from "../src/db";
import {
  AUDIO_VOICE,
  audioKey,
  needsAudio,
  normalizeAudioText,
  type AudioStyle,
} from "../src/lib/audio-key";

const MODEL = "gemini-3.1-flash-tts-preview";

/** Yaratilishi kerak bo'lgan bitta klip: matn + qanday o'qilishi. */
type Job = { text: string; style: AudioStyle };

/** Klipning bazadagi kaliti. `build-content.ts` bilan bir xil bo'lishi SHART. */
function keyOf(text: string, style: AudioStyle): string {
  return audioKey(text, AUDIO_VOICE, style);
}

/**
 * Gemini TTS xom PCM qaytaradi (odatda 24kHz, 16-bit, mono), lekin javobning
 * o'zi `sample_rate` va `channels` ni aytadi — biz shu qiymatlarni ishlatamiz,
 * qattiq yozilganini emas. Faqat bit chuqurligi javobda yo'q: `audio/l16`
 * nomining o'zi 16-bit degani.
 */
const BITS_PER_SAMPLE = 16;
const FALLBACK_SAMPLE_RATE = 24_000;
const FALLBACK_CHANNELS = 1;

/**
 * Chaqiruvlar orasidagi kutish. Chegara kunlik bo'lgani uchun (pastga qarang)
 * bu faqat so'rovlarni bir zumda otib yubormaslik uchun.
 */
const DELAY_MS = 7_000;

/**
 * 429'da qayta urinish soni — ataylab BITTA.
 *
 * O'lchangan haqiqat (2026-07-27, `gemini-3.1-flash-tts` bepul tarif):
 * chegara **kuniga ~10 so'rov** (`generate_content_free_tier_requests`,
 * limit: 10), daqiqalik oyna EMAS. Google xabarida "Please retry in 36s"
 * deb yozilgan bo'lsa ham, 35–42 soniya kutish yordam bermaydi — kvota
 * ertasi kuni tiklanadi.
 *
 * Shuning uchun uzoq qayta urinish behuda vaqt: bir marta urinib ko'ramiz
 * (haqiqiy qisqa muddatli uzilish bo'lsa o'tadi), keyin toza to'xtaymiz.
 */
const MAX_RETRIES = 1;

/**
 * Google 429 xabarida "Please retry in 38.28s" deb aytadi. Shuni o'qib kutamiz —
 * daqiqalik oyna tiklanadi va skript bir yurishda tugaydi. Agar taklif qilingan
 * kutish juda uzoq bo'lsa (kunlik kvota tugagan), kutmaymiz: to'xtaymiz.
 */
const MAX_WAIT_MS = 120_000;

function retryAfterMs(message: string): number | null {
  const m = /retry in ([\d.]+)\s*s/i.exec(message);
  if (!m) return null;
  const seconds = Number(m[1]);
  if (!Number.isFinite(seconds)) return null;
  // Bir oz zaxira qo'shamiz — oyna chegarasida yana urilib qolmaslik uchun.
  return Math.ceil(seconds * 1000) + 2_000;
}

function isRateLimit(message: string): boolean {
  return /429|quota|rate limit|RESOURCE_EXHAUSTED/i.test(message);
}

/**
 * Uslub ko'rsatmalari. Gemini TTS "…: matn" shaklida faqat ikki nuqtadan
 * keyingi qismni o'qiydi — ko'rsatma ovozga chiqmaydi.
 *
 * NEGA IKKI XIL:
 * Avval ikkala tur uchun bitta ko'rsatma bor edi ("slowly and very clearly").
 * Natijada model ba'zan tovushlarni cho'zib, ba'zan oddiy tezlikda o'qib berdi —
 * ya'ni "Takrorlang" kliplari bir-biriga o'xshamas edi (mijoz e'tirozi).
 * Sabab: ko'rsatma tezlik haqida edi, TALAFFUZ USULI haqida emas.
 *
 * "pron" — bola AYNAN shu gapni qaytaradi va har so'zi solishtiriladi
 * (`read-aloud.ts`), demak namunaning vazifasi — har bir tovushni eshittirish.
 * Shuning uchun bu yerda cho'zish va so'zlar orasidagi pauza aniq so'raladi.
 * Sekinroq nutq Vosk uchun ham qulay: bola sekin takrorlasa, tanish aniqroq.
 *
 * "prompt" — savol matni; bola uni tinglaydi va ERKIN javob beradi, takrorlamaydi.
 * Bu yerdagi ko'rsatma ATAYLAB o'zgartirilmagan: mavjud ~24 klip shu ko'rsatma
 * bilan yaratilgan va ular qayta yaratilishi kerak emas (kvota ~10/kun).
 *
 * Ko'rsatmani jiddiy o'zgartirsangiz `audio-key.ts` dagi STYLE_TAG raqamini
 * oshiring, aks holda eski kliplar o'z joyida qolib ketadi.
 */
const STYLE_PROMPT: Record<AudioStyle, string> = {
  prompt:
    "Read this slowly and very clearly for a young child learning English, " +
    "in a warm, friendly teacher voice",
  pron:
    "You are an English teacher giving a pronunciation model to a ten-year-old child. " +
    "Speak a little slower than normal, with a steady even rhythm from the first word to " +
    "the last — do not speed up towards the end. Draw out the vowel sounds so each one can " +
    "be heard clearly, and pronounce the final consonant of every word. Do not pause " +
    "between words: keep the sentence flowing as one natural phrase. " +
    "Keep the voice warm and encouraging — clear and unhurried, but never robotic",
};

function styled(text: string, style: AudioStyle): string {
  return `${STYLE_PROMPT[style]}: ${normalizeAudioText(text)}`;
}

/**
 * Xom PCM'ni WAV faylga o'raydi (44 baytli RIFF sarlavhasi).
 *
 * Nega tashqi kutubxona emas: sarlavha 44 bayt, `wav` paketini qo'shish ortiqcha.
 * Nega WAV, MP3 emas: siqish uchun pure-JS koder (yoki ffmpeg) kerak bo'lardi.
 * Hozircha klip soni kichik (~60–80 ta), bittasi ~100–250KB — jami ~10–20MB,
 * bu 125MB Vosk modeli yonida sezilmaydi. Klip soni o'sganda opus'ga o'tish kerak.
 */
function pcmToWav(pcm: Buffer, sampleRate: number, channels: number): Buffer {
  const byteRate = (sampleRate * channels * BITS_PER_SAMPLE) / 8;
  const blockAlign = (channels * BITS_PER_SAMPLE) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // fmt bo'lagi uzunligi
  header.writeUInt16LE(1, 20); // 1 = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

/**
 * Javobdagi audioni brauzer/Android ijro etadigan WAV faylga aylantiradi.
 *
 * Model xom PCM (`audio/l16`) qaytaradi — unga RIFF sarlavhasi kerak. Lekin
 * agar allaqachon konteynerli format kelsa (`audio/wav`, `audio/mp3`, …) uni
 * QAYTA O'RAMASLIK kerak: ikki marta o'ralgan WAV ijro etilmaydi.
 */
function toPlayableFile(audio: {
  data?: string;
  mime_type?: string;
  sample_rate?: number;
  channels?: number;
}): { bytes: Buffer; contentType: string; ext: string } {
  if (!audio.data) {
    throw new Error("Javobda output_audio.data bo'sh — audio yaratilmadi.");
  }
  const raw = Buffer.from(audio.data, "base64");
  const mime = audio.mime_type ?? "audio/l16";

  // Xom PCM: l16 (yoki mime aytilmagan) — sarlavha qo'shamiz.
  if (mime === "audio/l16" || mime.startsWith("audio/l16;")) {
    const wav = pcmToWav(
      raw,
      audio.sample_rate ?? FALLBACK_SAMPLE_RATE,
      audio.channels ?? FALLBACK_CHANNELS,
    );
    return { bytes: wav, contentType: "audio/wav", ext: "wav" };
  }

  // Tayyor konteyner — o'zgartirmasdan saqlaymiz.
  const ext = mime === "audio/mpeg" || mime === "audio/mp3" ? "mp3" : mime.split("/")[1] || "wav";
  return { bytes: raw, contentType: mime, ext };
}

/**
 * Bazadagi barcha mashqlardan audio kerak bo'lgan noyob matnlarni yig'adi.
 *
 * TARTIB MUHIM: avval "Takrorlang" matnlari, keyin savollar. Sabab kvota —
 * TTS bepul tarifda kuniga ~10 so'rov beradi, ya'ni ro'yxat bir kunda
 * tugamaydi va faqat BOSHI yaratiladi. "Takrorlang" mashqida namunani
 * eshitish mashqning O'ZI (bola avval to'g'ri talaffuzni eshitadi, keyin
 * aynan shuni takrorlaydi va so'zma-so'z tekshiriladi), savolni esa qurilma
 * TTS'i o'qib bersa ham mashq buzilmaydi.
 */
async function collectTexts(): Promise<Job[]> {
  const exercises = await db.select().from(schema.exercises);
  const targets = new Map<string, Job>(); // xesh → ish (takrorlarni yo'qotadi)
  const prompts = new Map<string, Job>();

  for (const ex of exercises) {
    if (needsAudio(ex.targetText)) {
      targets.set(keyOf(ex.targetText, "pron"), { text: ex.targetText, style: "pron" });
    }
  }
  for (const ex of exercises) {
    for (const p of ex.prompts) {
      if (needsAudio(p)) prompts.set(keyOf(p, "prompt"), { text: p, style: "prompt" });
    }
  }
  // Ikki guruh orasida takror YO'QOTILMAYDI: bir xil gap "Takrorlang" namunasi
  // va savol sifatida ikki xil o'qiladi, ya'ni ikki xil klip kerak. Amalda
  // bunday to'qnashuv uchramaydi, lekin uchrasa har biri o'z uslubini oladi.
  return [...targets.values(), ...prompts.values()];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const limitArg = args.indexOf("--limit");
  const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;

  if (!dry) {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY yo'q. web/.env fayliga qo'shing.");
      process.exit(1);
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN yo'q. web/.env faylini tekshiring.");
      process.exit(1);
    }
  }

  const jobs = await collectTexts();
  const existing = await db.select().from(schema.audioClips);
  const have = new Set(existing.map((c) => c.textHash));
  const todo = jobs.filter((j) => !have.has(keyOf(j.text, j.style))).slice(0, limit);

  const pronTodo = todo.filter((j) => j.style === "pron").length;
  console.log(
    `Jami matn: ${jobs.length}, tayyor: ${have.size}, yaratiladi: ${todo.length}` +
      (pronTodo > 0 ? ` (shundan ${pronTodo} ta "Takrorlang" namunasi)` : ""),
  );

  // Uslub yoki matn o'zgarsa eski klip endi hech qayerda ishlatilmaydi. Uni
  // O'CHIRMAYMIZ (noto'g'ri hisob-kitob jonli audioni yo'q qilishi mumkin) —
  // faqat xabar beramiz. Blob'da bir necha yuz KB qolishi zarar qilmaydi.
  const needed = new Set(jobs.map((j) => keyOf(j.text, j.style)));
  const orphans = existing.filter((c) => !needed.has(c.textHash));
  if (orphans.length > 0) {
    console.log(
      `Eslatma: ${orphans.length} ta klip endi ishlatilmaydi (matn yoki uslub o'zgargan). ` +
        "Ular o'chirilmaydi, shunchaki e'tiborsiz qoladi.",
    );
  }

  if (todo.length === 0) {
    console.log("Yangi audio kerak emas.");
    return;
  }
  if (dry) {
    todo.forEach((j, i) => console.log(`  ${i + 1}. [${j.style}] ${j.text}`));
    console.log("\n(--dry: hech narsa yaratilmadi)");
    return;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let done = 0;

  let stopped = false;

  for (const [i, job] of todo.entries()) {
    if (stopped) break;
    const { text, style } = job;
    const hash = keyOf(text, style);
    const short = text.length > 60 ? `${text.slice(0, 57)}…` : text;
    process.stdout.write(`[${i + 1}/${todo.length}] [${style}] ${short} … `);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const interaction = await ai.interactions.create({
        model: MODEL,
        input: styled(text, style),
        // Audio uchun aynan shu maydon kerak. (`response_format` — JSON
        // sxemasini majburlash uchun, audio bilan aloqasi yo'q.)
        response_modalities: ["audio"],
        generation_config: { speech_config: [{ voice: AUDIO_VOICE }] },
      });

      if (!interaction.output_audio) {
        throw new Error(
          `Javobda output_audio yo'q. Javob kalitlari: [${Object.keys(interaction).join(", ")}]`,
        );
      }
      const file = toPlayableFile(interaction.output_audio);
      const blob = await put(`audio/${hash}.${file.ext}`, file.bytes, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.contentType,
      });

      await db.insert(schema.audioClips).values({
        textHash: hash,
        text,
        voice: AUDIO_VOICE,
        url: blob.url,
      });

      done++;
      console.log(`✓ ${(file.bytes.length / 1024).toFixed(0)}KB ${file.ext}`);
      break; // shu matn tayyor — keyingisiga
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      if (isRateLimit(msg)) {
        const wait = retryAfterMs(msg);
        // Google taklif qilgan kutish qisqa bo'lsa — kutib qayta urinamiz,
        // shunda daqiqalik oyna tiklanadi va skript bir yurishda tugaydi.
        if (wait !== null && wait <= MAX_WAIT_MS && attempt < MAX_RETRIES) {
          console.log(`⏳ chegara, ${Math.round(wait / 1000)}s kutamiz…`);
          await sleep(wait);
          process.stdout.write(`[${i + 1}/${todo.length}] [${style}] ${short} … `);
          continue;
        }
        // Kunlik kvota tugadi — toza to'xtaymiz.
        console.log("✗");
        console.error(`\nKunlik chegaraga yetdi (bepul tarif: ~10 TTS so'rov/kun).`);
        console.error(`${done} ta yaratildi. ERTAGA shu buyruqni qayta ishga tushiring —`);
        console.error("yaratilganlar o'tkazib yuboriladi, qolganidan davom etadi.");
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

    if (!stopped && i < todo.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nTayyor: ${done} ta yangi audio.`);
  if (done > 0) {
    console.log("Endi admin panelida 'Publish' bosing — kontent versiyasi oshadi.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
