import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SpeakUp — Ingliz tilida gapirishni mashq qilamiz",
  description:
    "5–6 sinf o'quvchilari uchun ingliz tili speaking mashqlari: mnemonik strukturalar, mikrofon orqali baholash va tavsiyalar.",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
