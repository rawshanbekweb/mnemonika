"use client";

import { Icon } from "@/components/Icon";
import { useApk } from "@/lib/use-apk";

/**
 * Landing hero'sidagi APK tugmasi — ko'k fon uchun ochiq ramkali.
 * APK hali yuklanmagan bo'lsa hech narsa ko'rsatmaydi (hero CTA'si yolg'iz qoladi).
 */
export default function ApkHeroButton() {
  const { apk } = useApk();
  if (!apk) return null;

  return (
    <a
      href={apk.url}
      download
      className="btn border border-white/35 text-white hover:bg-white/10"
    >
      <Icon name="download" size={16} />
      Android ilovasi · {apk.sizeMb} MB
    </a>
  );
}
