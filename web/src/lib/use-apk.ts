"use client";

import { useEffect, useState } from "react";

export type ApkInfo = { url: string; sizeMb: number; uploadedAt: string; version: string };

/**
 * Blob'dagi eng yangi APK haqidagi ma'lumot (`/api/apk`).
 *
 * APK topilmasa `null` qaytadi — chaqiruvchi yuklab olish joyini umuman
 * ko'rsatmasligi kerak. `isAndroid` faqat tugma ko'rinishini tanlash uchun.
 */
export function useApk() {
  const [apk, setApk] = useState<ApkInfo | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
    fetch("/api/apk")
      .then((r) => r.json())
      .then((d: ApkInfo | null) => setApk(d))
      .catch(() => setApk(null));
  }, []);

  return { apk, isAndroid };
}
