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
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);
  const finalRef = useRef("");

  // Brauzer qo'llab-quvvatlashini faqat mijozda tekshiramiz (hydration mos kelishi uchun).
  useEffect(() => {
    setSupported(getConstructor() !== null);
  }, []);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    setListening(false);
    setInterimText("");
    try {
      recognitionRef.current?.stop();
    } catch {
      // allaqachon to'xtagan bo'lishi mumkin
    }
  }, []);

  const start = useCallback(() => {
    const Ctor = getConstructor();
    if (!Ctor) {
      setError("Bu brauzer nutqni tanishni qo'llab-quvvatlamaydi.");
      return;
    }

    finalRef.current = "";
    setFinalText("");
    setInterimText("");
    setError(null);
    wantListeningRef.current = true;

    const startEngine = () => {
      const recognition = new Ctor();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) {
            finalRef.current = (finalRef.current + " " + text).trim();
          } else {
            interim += text;
          }
        }
        setFinalText(finalRef.current);
        setInterimText(interim);
      };

      recognition.onerror = (e) => {
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
        if (wantListeningRef.current) {
          try {
            startEngine();
          } catch {
            wantListeningRef.current = false;
            setListening(false);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    };

    try {
      startEngine();
      setListening(true);
    } catch {
      wantListeningRef.current = false;
      setError("Mikrofonni ishga tushirib bo'lmadi. Sahifani yangilab ko'ring.");
    }
  }, []);

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

  return { supported, listening, finalText, interimText, error, start, stop };
}

/** Matnni ingliz tilida ovoz chiqarib o'qiydi (brauzer TTS — bepul). */
export function speak(text: string, onDone?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onDone?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95; // bolalar uchun biroz sekinroq
  utterance.onend = () => onDone?.();
  utterance.onerror = () => onDone?.();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
