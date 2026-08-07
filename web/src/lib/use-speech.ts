"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Web Speech API (bepul, brauzerga o'rnatilgan) ustidagi React hook.
 *
 * Android'dagi Vosk'dan farqi: bu ONLAYN ishlaydi (nutq Google/Apple serveriga
 * yuboriladi) va faqat Chrome / Edge / Safari'da bor. Firefox umuman
 * qo'llab-quvvatlamaydi — shuning uchun `supported` ni tekshirish shart.
 */

type SRAlternative = { transcript: string };
type SRResult = { isFinal: boolean; length: number; [i: number]: SRAlternative };
type SRResultList = { length: number; [i: number]: SRResult };
type SREvent = { resultIndex: number; results: SRResultList };
type SRErrorEvent = { error: string };

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SRConstructor = new () => SpeechRecognitionLike;

function getConstructor(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRConstructor;
    webkitSpeechRecognition?: SRConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Foydalanuvchiga ko'rsatiladigan xato matni. `null` — jiddiy emas, davom etadi. */
function describeError(code: string): string | null {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Mikrofonga ruxsat berilmadi. Brauzer manzil qatoridagi 🔒 belgisidan mikrofonni yoqing.";
    case "audio-capture":
      return "Mikrofon topilmadi. Qurilmaga mikrofon ulanganini tekshiring.";
    case "network":
      return "Internet bilan bog'lanib bo'lmadi. Web'da nutqni tanish internet talab qiladi.";
    case "no-speech":
    case "aborted":
      return null; // jim o'tkazamiz — yozish davom etadi
    default:
      return null;
  }
}

export function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);
  const finalRef = useRef("");

  /**
   * Tanigichning ikkinchi/uchinchi variantlari — faqat kalit so'z qidirish uchun.
   * Ekranda ko'rsatilmaydi (bola uchun chalkash bo'lardi).
   */
  const alternativesRef = useRef<string[]>([]);

  // Brauzer qo'llab-quvvatlashini faqat mijozda tekshiramiz (hydration mos kelishi uchun).
  useEffect(() => {
    setSupported(getConstructor() !== null);
  }, []);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    setListening(false);
    setPaused(false);
    setInterimText("");
    try {
      recognitionRef.current?.stop();
    } catch {
      // allaqachon to'xtagan bo'lishi mumkin
    }
  }, []);

  /**
   * Yangi dvigatel ochadi. To'plangan matnga TEGMAYDI — shuning uchun uni
   * ham [start] (noldan), ham [resume] (pauzadan keyin) chaqira oladi.
   *
   * Nomlangan funksiya (`run`) atayin: `onend` ichida o'zini qayta chaqiradi.
   */
  const startEngine = useCallback(function run(): boolean {
    const Ctor = getConstructor();
    if (!Ctor) {
      setError("Bu brauzer nutqni tanishni qo'llab-quvvatlamaydi.");
      return false;
    }

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    // Kalit so'z qidirishda tanigichning boshqa taxminlari ham tekshiriladi.
    recognition.maxAlternatives = 3;

    /**
     * Bu dvigatel hali ham joriymi.
     *
     * Pauzada eski dvigatel to'xtatiladi, lekin uning `onend`/`onerror`
     * hodisalari KEYINROQ keladi — davom etilgandan keyin ham. Tekshiruvsiz
     * eskisi ikkinchi dvigatelni ishga tushirib yuborardi va mikrofonni ikki
     * nusxa tinglab, har so'z ikki marta yozilardi.
     */
    const isCurrent = () => recognitionRef.current === recognition;

    recognition.onresult = (e) => {
      if (!isCurrent()) return;
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalRef.current = (finalRef.current + " " + text).trim();
          for (let a = 1; a < result.length; a++) {
            const alt = result[a]?.transcript;
            if (alt) alternativesRef.current.push(alt);
          }
        } else {
          interim += text;
        }
      }
      setFinalText(finalRef.current);
      setInterimText(interim);
    };

    recognition.onerror = (e) => {
      if (!isCurrent()) return;
      const message = describeError(e.error);
      if (message) {
        // Jiddiy xato — qayta urinmaymiz, aks holda cheksiz sikl bo'ladi.
        wantListeningRef.current = false;
        setError(message);
        setListening(false);
      }
    };

    recognition.onend = () => {
      // Chrome jimlikdan keyin o'zi to'xtaydi. Mashq hali tugamagan bo'lsa
      // qayta ishga tushiramiz, shunda bola o'ylanib turgani uchun yozuv uzilmaydi.
      if (!isCurrent() || !wantListeningRef.current) return;
      try {
        run();
      } catch {
        wantListeningRef.current = false;
        setListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, []);

  const start = useCallback(() => {
    finalRef.current = "";
    alternativesRef.current = [];
    setFinalText("");
    setInterimText("");
    setError(null);
    setPaused(false);
    wantListeningRef.current = true;

    try {
      if (!startEngine()) {
        wantListeningRef.current = false;
        return;
      }
      setListening(true);
    } catch {
      wantListeningRef.current = false;
      setError("Mikrofonni ishga tushirib bo'lmadi. Sahifani yangilab ko'ring.");
    }
  }, [startEngine]);

  /**
   * Tinglashni vaqtincha to'xtatadi: shu paytdan keyin aytilgan gaplar matnga
   * qo'shilmaydi. To'plangan matn saqlanadi va [resume] o'sha joyidan davom
   * ettiradi (yangi dvigatel ochiladi, lekin `finalRef` tozalanmaydi).
   */
  const pause = useCallback(() => {
    if (!wantListeningRef.current) return;
    // Avval bayroq: `onend` bu dvigatelni qayta tiklab yubormasin.
    wantListeningRef.current = false;
    setPaused(true);
    setInterimText("");
    try {
      recognitionRef.current?.stop();
    } catch {
      // allaqachon to'xtagan bo'lishi mumkin
    }
  }, []);

  /** Pauzadan keyin tinglashni davom ettiradi. */
  const resume = useCallback(() => {
    if (wantListeningRef.current) return;
    wantListeningRef.current = true;
    setPaused(false);
    try {
      if (!startEngine()) {
        wantListeningRef.current = false;
        setPaused(true);
      }
    } catch {
      wantListeningRef.current = false;
      setPaused(true);
      setError("Mikrofonni qayta ishga tushirib bo'lmadi. Sahifani yangilab ko'ring.");
    }
  }, [startEngine]);

  // Sahifadan chiqilganda mikrofon ochiq qolmasin.
  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        // e'tiborsiz
      }
    };
  }, []);

  /** Yozish tugagach chaqiriladi — to'plangan variantlar ro'yxati. */
  const takeAlternatives = useCallback(() => [...alternativesRef.current], []);

  return {
    supported,
    listening,
    paused,
    finalText,
    interimText,
    error,
    start,
    stop,
    pause,
    resume,
    takeAlternatives,
  };
}

/**
 * Eshittirish turi — tezlikni shu belgilaydi.
 *
 * Android'dagi `VoiceCue.Style` bilan bir xil, ataylab: bola web'da ham,
 * ilovada ham bir xil tezlikda eshitishi kerak.
 */
export type SpeechStyle = "prompt" | "pronunciation";

/**
 * Brauzer TTS tezligi.
 *
 * MAQSAD — yaratilgan Gemini klipiga tenglashish. Kliplar o'lchandi: 24 ta
 * savol klipi o'rtacha 0.759 s/so'z. Brauzer TTS'i `rate = 1` da ~0.4 s/so'z
 * bilan gapiradi, ya'ni ikki barobar tez — shuning uchun klip yaratilgan
 * mashqlardan keyingilarga o'tganda ovoz keskin tezlashardi.
 *
 * Avval bu yerda bitta `0.95` turardi ("bolalar uchun biroz sekinroq"), lekin
 * u klipdan deyarli ikki barobar tez edi.
 *
 * DIQQAT: 0.4 s/so'z — TIPIK qiymat, o'lchangani emas; har brauzer/ovoz
 * dvigateli boshqacha. Sozlash kerak bo'lsa — faqat shu ikki raqam.
 */
const RATE: Record<SpeechStyle, number> = {
  prompt: 0.55,
  pronunciation: 0.5,
};

/** "Dona dona" aytish uchun so'zlar orasidagi jimlik (faqat talaffuz namunasida). */
const WORD_GAP_MS = 180;

/**
 * Eshittirish avlodi: har yangi `speak`/`stopSpeaking` buni oshiradi va
 * yarim yo'lda qolgan ketma-ketlik (so'zlar navbati, kutish taymerlari)
 * jimgina to'xtaydi. Busiz to'xtatilgan namunaning qolgan so'zlari keyin
 * chiqib qolardi.
 */
let speakRun = 0;

/** Matnni ingliz tilida ovoz chiqarib o'qiydi (brauzer TTS — bepul). */
export function speak(text: string, style: SpeechStyle = "prompt", onDone?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onDone?.();
    return;
  }
  window.speechSynthesis.cancel();
  const run = ++speakRun;

  // Talaffuz namunasi so'zlarga bo'linadi — bola qaysi so'z qayerda
  // tugashini eshitadi. Savol bo'linmaydi: uni takrorlamaydi, bo'laklansa
  // faqat g'alati eshitilardi.
  const gap = style === "pronunciation" ? WORD_GAP_MS : 0;
  const parts =
    gap > 0 ? text.trim().split(/\s+/).filter(Boolean) : [text.trim()].filter(Boolean);
  if (parts.length === 0) {
    onDone?.();
    return;
  }

  let index = 0;
  const next = () => {
    if (run !== speakRun) return; // boshqa eshittirish boshlandi yoki to'xtatildi
    if (index >= parts.length) {
      onDone?.();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(parts[index++]);
    utterance.lang = "en-US";
    utterance.rate = RATE[style];
    // Xato bo'lganda ham davom etamiz: bitta so'z aytilmagani uchun butun
    // namuna to'xtab qolmasin.
    const step = () => {
      if (run !== speakRun) return;
      if (gap > 0 && index < parts.length) window.setTimeout(next, gap);
      else next();
    };
    utterance.onend = step;
    utterance.onerror = step;
    window.speechSynthesis.speak(utterance);
  };
  next();
}

export function stopSpeaking() {
  // Avlodni oshiramiz: so'zlar navbatidagi kutish taymerlari ham to'xtasin.
  speakRun++;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  stopCue();
}

/**
 * Yaratilgan talaffuz audiosi (Gemini TTS) — brauzer TTS'idan ustun.
 *
 * Nega kerak: brauzer TTS ovozi qurilmaga bog'liq — o'zbek telefonida ingliz
 * ovozi yo umuman yo'q, yo juda sun'iy chiqadi. "Takrorlang" mashqining butun
 * mohiyati to'g'ri talaffuzni eshitib takrorlash, shuning uchun ovoz sifati
 * bu yerda bezak emas, mazmun.
 *
 * Audio yo'q bo'lsa yoki ijro qilinmasa — eski TTS yo'li ishlaydi, ya'ni
 * hech qanday funksiya yo'qolmaydi.
 */
export type AudioCue = { url: string; text: string; style?: SpeechStyle };

/**
 * Talaffuz namunasi klipining ijro tezligi.
 *
 * Savol kliplariga tegilmaydi (1.0×): ular allaqachon kerakli tezlikda va
 * qolgan hamma narsa uchun ETALON. Namuna esa sekinroq bo'lishi kerak —
 * bola uni so'zma-so'z takrorlaydi. `preservesPitch` sukut bo'yicha yoqiq,
 * ya'ni ovoz yo'g'onlashmaydi, faqat cho'ziladi.
 */
const PRONUNCIATION_SPEED = 0.8;

let currentAudio: HTMLAudioElement | null = null;
/** Ketma-ket ijroni bekor qilish uchun: har yangi chaqiruv avvalgisini eskirtiradi. */
let cueRun = 0;

function stopCue() {
  cueRun++;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

/** Bitta klipni ijro etadi; audio yo'q yoki xato bo'lsa TTS'ga qaytadi. */
function playOne(cue: AudioCue): Promise<void> {
  return new Promise((resolve) => {
    const style = cue.style ?? "prompt";
    if (!cue.url) {
      speak(cue.text, style, resolve);
      return;
    }
    const audio = new Audio(cue.url);
    if (style === "pronunciation") audio.playbackRate = PRONUNCIATION_SPEED;
    currentAudio = audio;
    let settled = false;
    const finish = (fallback: boolean) => {
      if (settled) return;
      settled = true;
      if (currentAudio === audio) currentAudio = null;
      if (fallback) speak(cue.text, style, resolve);
      else resolve();
    };
    audio.onended = () => finish(false);
    // Tarmoq yo'q, fayl yo'qolgan, format qo'llanmaydi — hammasi TTS'ga qaytadi.
    audio.onerror = () => finish(true);
    audio.play().catch(() => finish(true));
  });
}

/**
 * Klip(lar)ni ketma-ket ijro etadi. Savollar alohida klip bo'lgani uchun
 * ular orasida tabiiy pauza qoladi — bola har savolni ajratib eshitadi.
 */
export async function playCues(cues: AudioCue[], onDone?: () => void) {
  stopCue();
  const run = cueRun;
  for (const cue of cues) {
    if (run !== cueRun) return; // boshqa ijro boshlandi — jimgina chiqamiz
    await playOne(cue);
  }
  if (run === cueRun) onDone?.();
}
