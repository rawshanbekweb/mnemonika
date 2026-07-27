import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { homeFor, safeNext } from "@/lib/next-path";
import { Icon } from "@/components/Icon";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Kirish — SpeakUp",
  description: "SpeakUp boshqaruv paneli: admin va o'qituvchi hisobiga kirish.",
};

/**
 * Kirish sahifasi ochiq saytning bir qismi: bu yerga landing'dagi "Kirish"
 * tugmasi orqali kelinadi va logotip bosilsa landing'ga qaytiladi.
 * Allaqachon kirgan foydalanuvchiga forma ko'rsatilmaydi — u o'z paneliga
 * yuboriladi (aks holda "kirganman, lekin yana kirish so'ralyapti" holati).
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [user, params] = await Promise.all([getSession(), searchParams]);
  if (user) redirect(safeNext(params.next, user.role));

  // Kim kirayotgani hali noma'lum, shuning uchun `next` shu yerda tekshirilmaydi —
  // yakuniy qaror kirish API'sida, foydalanuvchi roli aniq bo'lganda qabul qilinadi.
  const next = params.next;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Chap panel: brend yuzasi. Kichik ekranda ingichka sarlavhaga aylanadi. */}
      <div className="hero-navy hero-photo-classroom flex flex-col justify-center px-6 py-10 text-white lg:w-[45%] lg:px-14">
        <Link href="/" className="inline-flex w-fit flex-col">
          <span className="text-3xl font-bold tracking-[0.12em]">SPEAKUP</span>
          <span className="mt-2 text-sm text-white/70">
            Ingliz tili nutq ko&apos;nikmalari platformasi
          </span>
        </Link>
        <p className="mt-8 hidden max-w-sm text-white/85 lg:block">
          Mnemonik strukturalar orqali 5–6 sinf o&apos;quvchilarining gapirish
          ko&apos;nikmasini rivojlantirish. Kontentni boshqaring, o&apos;quvchilar
          natijalarini kuzating.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded border border-white/25 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
          >
            <Icon name="arrowLeft" size={16} />
            Bosh sahifa
          </Link>
          <Link
            href="/student"
            className="inline-flex items-center gap-2 rounded border border-white/25 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
          >
            <Icon name="mic" size={16} />
            Mashqlar
          </Link>
        </div>
      </div>

      <div className="pattern-page flex flex-1 items-center justify-center px-4 py-10">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
