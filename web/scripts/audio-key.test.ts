// Audio klip kaliti testi.
//
// Ishga tushirish:  npm run test:audiokey
//
// NEGA BU TEST BOR:
// Klip kaliti — matn xeshi. Xesh formulasi o'zgarsa, MAVJUD kliplarning
// hammasi "yo'q" hisoblanadi va qaytadan yaratilishi kerak bo'ladi. Gemini
// bepul tarifda TTS kuniga ~10 so'rov beradi, ya'ni tasodifan buzilgan formula
// haftalab kvota va qayta ishlash degani — ustiga bu JIMGINA sodir bo'ladi:
// hech qayerda xato chiqmaydi, shunchaki audio ulanmay qoladi va bola qurilma
// TTS'ini eshitadi.
//
// Shuning uchun quyidagi xeshlar QO'LDA yozilgan. Ular o'zgarsa test yiqiladi
// va bu ataylab qilinganmi degan savol tug'iladi.

import { audioKey, AUDIO_VOICE, needsAudio, normalizeAudioText } from "../src/lib/audio-key";

const SAMPLE = "My dog is very friendly";

/**
 * Uslub tushunchasi qo'shilishidan OLDINGI formula: sha256("Kore\n" + matn).
 * Bu qiymat jonli bazadagi 32 ta klipga mos keladi (2026-08-06 da tekshirilgan).
 * O'zgartirmang — savol kliplarining hammasi shu xeshda saqlanadi.
 */
const KNOWN_PROMPT_HASH = "966d59bafa5c39806d9b121e80da6888c1a57a25038c819b8fa1bdca909842ba";

/**
 * "Takrorlang" namunalari — joriy uslub yorlig'i ("pron2") bilan.
 *
 * Bu qiymat uslub ko'rsatmasi o'zgarganda ATAYLAB yangilanadi: yorliq oshsa
 * kliplar qayta yaratilishi kerak. Ya'ni bu testning yiqilishi "buzildi"
 * degani emas — "uslub o'zgardi, 19 ta namuna qayta yaratilishi kerak" degani.
 */
const KNOWN_PRON_HASH = "6ae83618dbcfd94313144d4433c9452ce6da113071c29459a621c645ae787094";

type Case = { name: string; run: () => string | null };

const cases: Case[] = [
  {
    name: "standart uslub eski xeshni saqlaydi (mavjud kliplar buzilmaydi)",
    run: () => {
      const got = audioKey(SAMPLE);
      return got === KNOWN_PROMPT_HASH ? null : `kutilgan ${KNOWN_PROMPT_HASH}, kelgani ${got}`;
    },
  },
  {
    name: "aniq ko'rsatilgan \"prompt\" ham xuddi shu xesh",
    run: () => {
      const got = audioKey(SAMPLE, AUDIO_VOICE, "prompt");
      return got === KNOWN_PROMPT_HASH ? null : `kutilgan ${KNOWN_PROMPT_HASH}, kelgani ${got}`;
    },
  },
  {
    name: "\"pron\" uslubi barqaror xesh beradi",
    run: () => {
      const got = audioKey(SAMPLE, AUDIO_VOICE, "pron");
      return got === KNOWN_PRON_HASH ? null : `kutilgan ${KNOWN_PRON_HASH}, kelgani ${got}`;
    },
  },
  {
    name: "\"pron\" va \"prompt\" bir xil matnda HAR XIL klip",
    run: () => {
      const a = audioKey(SAMPLE, AUDIO_VOICE, "prompt");
      const b = audioKey(SAMPLE, AUDIO_VOICE, "pron");
      return a !== b ? null : "ikkalasi bir xil xesh berdi — namuna savol o'rniga ishlatiladi";
    },
  },
  {
    name: "ovoz o'zgarsa xesh o'zgaradi",
    run: () => {
      const other = audioKey(SAMPLE, "Puck");
      return other !== KNOWN_PROMPT_HASH ? null : "boshqa ovozda ham bir xil xesh";
    },
  },
  {
    name: "matn o'zgarsa xesh o'zgaradi (eski audio ulanib qolmaydi)",
    run: () => {
      const other = audioKey("My cat is very friendly");
      return other !== KNOWN_PROMPT_HASH ? null : "boshqa matnda ham bir xil xesh";
    },
  },
  {
    name: "ortiqcha bo'sh joy va yon probellar xeshga ta'sir qilmaydi",
    run: () => {
      const got = audioKey("  My   dog is\tvery friendly  ");
      return got === KNOWN_PROMPT_HASH ? null : "normalizatsiya ishlamadi";
    },
  },
  {
    name: "registr ATAYLAB saqlanadi (TTS uchun farq qiladi)",
    run: () => {
      const got = audioKey(SAMPLE.toLowerCase());
      return got !== KNOWN_PROMPT_HASH
        ? null
        : "kichik harfli matn bir xil xesh berdi — normalizatsiya registrni tushiryapti";
    },
  },
  {
    name: "normalizeAudioText faqat bo'sh joyni tozalaydi",
    run: () => {
      const got = normalizeAudioText("  Hello   World  ");
      return got === "Hello World" ? null : `kelgani "${got}"`;
    },
  },
  {
    name: "bo'sh va juda qisqa matnga audio kerak emas",
    run: () => {
      if (needsAudio("")) return "bo'sh matn audio talab qildi";
      if (needsAudio("   ")) return "faqat probel audio talab qildi";
      if (needsAudio("a")) return "bitta harf audio talab qildi";
      if (!needsAudio("Hi")) return "ikki harfli matn rad etildi";
      return null;
    },
  },
];

let failed = 0;
for (const c of cases) {
  const problem = c.run();
  if (problem) {
    failed++;
    console.error(`✗ ${c.name}`);
    console.error(`    ${problem}`);
  } else {
    console.log(`✓ ${c.name}`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} o'tdi`);
if (failed > 0) process.exit(1);
