import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Rasmlar manbasi va litsenziyalari.
 *
 * NEGA SAHIFA, oddiy CREDITS.md emas: mashq rasmlari CC-BY litsenziyasi ostida
 * olingan va u atributni FOYDALANUVCHI KO'RADIGAN joyda talab qiladi —
 * repozitoriydagi fayl bunga yetarli emas. Ro'yxat bazadan o'qiladi, ya'ni yangi
 * rasm qo'shilsa bu sahifa o'zi yangilanadi (qo'lda yuritiladigan ro'yxat
 * ertami-kechmi haqiqatdan orqada qoladi).
 */
export const metadata: Metadata = {
  title: "Rasmlar manbasi — SpeakUp",
  description: "Mashq rasmlarining mualliflari va litsenziyalari.",
};


const cachedImages = unstable_cache(
  async () =>
    db.select().from(schema.visualImages).orderBy(asc(schema.visualImages.searchTerm)),
  ["visual-credits"],
  { revalidate: 3600 },
);

async function images() {
  // Baza javob bermasa sahifa baribir ochilishi kerak.
  try {
    return await cachedImages();
  } catch {
    return [];
  }
}

export default async function VisualCredits() {
  const rows = await images();

  return (
    <div className="pattern-page min-h-screen bg-surface-page">
      <header className="hero-navy text-white">
        <nav className="border-b border-white/15">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="text-lg font-bold tracking-[0.14em]">
              SPEAKUP
            </Link>
            <Link
              href="/student"
              className="rounded border border-white/25 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
            >
              Mashqlar
            </Link>
          </div>
        </nav>
        <div className="mx-auto max-w-3xl px-4 py-12">
          <p className="text-overline font-semibold uppercase text-white/60">Hujjat</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Rasmlar manbasi</h1>
          <p className="mt-4 text-white/75">
            Mashqlardagi fotosuratlar{" "}
            <a
              href="https://commons.wikimedia.org"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Wikimedia Commons
            </a>{" "}
            dan olingan va erkin litsenziyalar ostida ishlatiladi. Quyida har bir
            rasmning muallifi va litsenziyasi.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        {rows.length === 0 ? (
          <p className="text-ink-muted">Hozircha rasm qo&apos;shilmagan.</p>
        ) : (
          <>
            <p className="mb-6 text-sm text-ink-muted">Jami {rows.length} ta rasm.</p>
            <div className="overflow-x-auto border border-line bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-3 py-2 font-semibold">Tasvir</th>
                    <th className="px-3 py-2 font-semibold">Nomi</th>
                    <th className="px-3 py-2 font-semibold">Muallif</th>
                    <th className="px-3 py-2 font-semibold">Litsenziya</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.token} className="border-b border-line/60 last:border-0">
                      <td className="px-3 py-2">
                        <span className="text-lg">{r.token}</span>
                      </td>
                      <td className="px-3 py-2">
                        {r.sourceUrl ? (
                          <a
                            href={r.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-navy hover:underline"
                          >
                            {r.title || r.searchTerm}
                          </a>
                        ) : (
                          (r.title || r.searchTerm)
                        )}
                      </td>
                      <td className="px-3 py-2 text-ink-muted">{r.creator || "—"}</td>
                      <td className="px-3 py-2 text-ink-muted">
                        {r.licenseUrl ? (
                          <a
                            href={r.licenseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {r.license || "—"}
                          </a>
                        ) : (
                          (r.license || "—")
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-12 border-t border-line pt-6 text-sm">
          <Link href="/" className="text-navy hover:underline">
            ← Bosh sahifaga qaytish
          </Link>
        </div>
      </main>
    </div>
  );
}
