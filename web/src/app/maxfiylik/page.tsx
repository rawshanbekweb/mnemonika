import type { Metadata } from "next";
import Link from "next/link";

/**
 * Maxfiylik siyosati.
 *
 * NEGA KERAK: Google Play'ga chiqarish uchun (ayniqsa "Families" toifasida —
 * ilova bolalarga mo'ljallangan) maxfiylik siyosatining OMMAVIY manzili shart.
 * Shu bilan birga bu shunchaki rasmiyatchilik emas: ilova bolaning nutq
 * transkriptini serverga yuboradi va matnni uchinchi tomon xizmatlariga
 * (LanguageTool, brauzer nutq tanish) uzatadi — ota-ona buni bilishi kerak.
 *
 * MUHIM: bu sahifa kod bilan MOS bo'lib turishi shart. Yangi ma'lumot
 * yig'iladigan bo'lsa (masalan crash reporting yoki analitika qo'shilsa),
 * pastdagi ro'yxat ham yangilanadi.
 */
export const metadata: Metadata = {
  title: "Maxfiylik siyosati — SpeakUp",
  description:
    "SpeakUp qanday ma'lumot yig'adi, nima uchun ishlatadi, kimga uzatadi va uni qanday o'chirish mumkin.",
};

/** Oxirgi marta qachon tekshirilgani — kod o'zgarganda qo'lda yangilanadi. */
const UPDATED = "29-iyul, 2026";

export default function PrivacyPolicy() {
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
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Maxfiylik siyosati</h1>
          <p className="mt-4 text-white/75">
            Oxirgi yangilanish: {UPDATED}. Ushbu siyosat SpeakUp veb-saytiga va SpeakUp
            Android ilovasiga taalluqli.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <Callout>
          Qisqacha: bola aytgan gap <strong>matnga aylantiriladi</strong> va o&apos;qituvchi
          ko&apos;rishi uchun saqlanadi. <strong>Ovoz yozuvi (audio fayl) hech qayerda
          saqlanmaydi.</strong> Reklama yo&apos;q, ma&apos;lumot sotilmaydi, uchinchi tomon
          analitikasi ishlatilmaydi.
        </Callout>

        <Section title="1. Kim ma'lumotni yig'adi">
          <p>
            SpeakUp — 5–6 sinf o&apos;quvchilari uchun ingliz tili nutq mashqlari platformasi.
            Ma&apos;lumotlarni platforma egasi yig&apos;adi va faqat o&apos;quv jarayoni
            uchun ishlatadi. Savol yoki talab bo&apos;lsa, quyidagi &laquo;Bog&apos;lanish&raquo;
            bo&apos;limiga qarang.
          </p>
        </Section>

        <Section title="2. Qanday ma'lumot yig'iladi">
          <List
            items={[
              <>
                <strong>O&apos;quvchining ismi va sinfi</strong> — profilda o&apos;zi kiritadi.
                Ism ixtiyoriy: bo&apos;sh qoldirilsa ham mashq ishlaydi. Familiya,
                tug&apos;ilgan sana, manzil, telefon yoki email <strong>so&apos;ralmaydi</strong>.
              </>,
              <>
                <strong>Qurilma identifikatori</strong> — tasodifiy yaratilgan belgi
                (masalan <code>web_a1b2…</code>). U qurilmaga bog&apos;langan, shaxsga emas;
                shu bilan bir o&apos;quvchining urinishlari birlashtiriladi.
              </>,
              <>
                <strong>Mashq natijalari</strong> — ball, gapirish tezligi, so&apos;zlar soni,
                davomiylik, kalit so&apos;zlar qamrovi va urinish vaqti.
              </>,
              <>
                <strong>Nutq transkripti</strong> — bola aytgan gapning matn ko&apos;rinishi.
                O&apos;qituvchi xatolarni ko&apos;rishi uchun saqlanadi (har urinish uchun
                4000 belgigacha).
              </>,
              <>
                <strong>O&apos;qituvchi va administrator hisoblari</strong> — email, ism va
                paroldan olingan xesh (parolning o&apos;zi saqlanmaydi).
              </>,
            ]}
          />
        </Section>

        <Section title="3. Ovoz haqida — muhim">
          <p>
            Mikrofondan olingan tovush <strong>fayl sifatida saqlanmaydi va serverga
            yuborilmaydi</strong>. U faqat matnga aylantirish uchun ishlatiladi, keyin
            o&apos;chib ketadi. Aylantirish qayerda bajarilishi platformaga bog&apos;liq:
          </p>
          <List
            items={[
              <>
                <strong>Android ilovada</strong> — nutq tanish butunlay{" "}
                <strong>telefonning o&apos;zida</strong> (Vosk kutubxonasi) bajariladi.
                Tovush qurilmadan chiqmaydi va bu qism internetsiz ishlaydi.
              </>,
              <>
                <strong>Brauzerda</strong> — brauzerning o&apos;z nutq tanish imkoniyati
                (Web Speech API) ishlatiladi. Chrome kabi brauzerlarda bu{" "}
                <strong>tovushni brauzer ishlab chiqaruvchisining serveriga yuboradi</strong>{" "}
                (Google) va bu jarayon bizning nazoratimizdan tashqarida. Ovoz qurilmadan
                chiqishini istamasangiz, veb o&apos;rniga Android ilovadan foydalaning.
              </>,
            ]}
          />
        </Section>

        <Section title="4. Ma'lumot nima uchun ishlatiladi">
          <List
            items={[
              "O'quvchiga darhol ball va tavsiya ko'rsatish;",
              "Progress, daraja, kunlik seriya va nishonlarni hisoblash;",
              "O'qituvchiga sinf va alohida o'quvchi natijalarini ko'rsatish;",
              "Mashqlar sifatini yaxshilash uchun umumiy statistikani ko'rish.",
            ]}
          />
          <p className="mt-4">
            Ma&apos;lumot <strong>reklama uchun ishlatilmaydi, sotilmaydi va boshqa
            kompaniyalarga berilmaydi</strong>. Profillashtirish yoki avtomatik qaror qabul
            qilish (masalan bolani baholab biror ro&apos;yxatga kiritish) amalga oshirilmaydi.
          </p>
        </Section>

        <Section title="5. Kimga uzatiladi">
          <p>Ishlashi uchun quyidagi xizmatlardan foydalaniladi:</p>
          <List
            items={[
              <>
                <strong>Vercel</strong> — sayt va API hosting; <strong>Neon</strong> —
                ma&apos;lumotlar bazasi. Yuqorida sanab o&apos;tilgan ma&apos;lumot shu
                yerda saqlanadi.
              </>,
              <>
                <strong>LanguageTool</strong> (languagetool.org) — grammatika tekshiruvi.
                Unga <strong>transkript matni</strong> yuboriladi. Ism yoki identifikator
                yuborilmaydi, ya&apos;ni matn kimniki ekani ko&apos;rinmaydi.
              </>,
              <>
                <strong>Brauzer nutq tanish xizmati</strong> — 3-bo&apos;limga qarang
                (faqat veb versiyada).
              </>,
            ]}
          />
          <p className="mt-4">
            Bulardan tashqari ma&apos;lumot faqat qonun talab qilgan hollarda oshkor
            qilinishi mumkin.
          </p>
        </Section>

        <Section title="6. Qancha vaqt saqlanadi">
          <p>
            Urinishlar va transkriptlar o&apos;qituvchi o&apos;quv yili davomida
            kuzatishi uchun saqlanadi va so&apos;rovga binoan o&apos;chiriladi. Qurilmadagi
            nusxa (Android&apos;dagi baza va brauzerdagi <code>localStorage</code>) ilovani
            o&apos;chirsangiz yoki brauzer ma&apos;lumotlarini tozalasangiz yo&apos;qoladi.
          </p>
        </Section>

        <Section title="7. Bolalar ma'lumoti va ota-onalar huquqi">
          <p>
            Ilova bolalarga mo&apos;ljallangan. Shuning uchun yig&apos;iladigan
            ma&apos;lumot ataylab eng kam darajada: familiya, tug&apos;ilgan sana yoki
            aloqa ma&apos;lumoti so&apos;ralmaydi va reklama tarmoqlari ulanmagan.
          </p>
          <p className="mt-4">
            Ota-ona yoki vasiy sifatida siz farzandingizga tegishli ma&apos;lumotni{" "}
            <strong>ko&apos;rishni, tuzatishni yoki butunlay o&apos;chirishni</strong> talab
            qilishingiz mumkin. Buning uchun farzandingizning ismi va sinfini ko&apos;rsatib
            murojaat qiling — so&apos;rov bajarilgach yozib beramiz.
          </p>
        </Section>

        <Section title="8. Xavfsizlik">
          <List
            items={[
              "Barcha aloqa HTTPS orqali shifrlanadi;",
              "O'qituvchi va admin panellari parol bilan himoyalangan, parollar xesh ko'rinishida saqlanadi;",
              "So'rovlar soniga cheklov qo'yilgan — bu ma'lumotni ommaviy yuklab olishga urinishni qiyinlashtiradi;",
              "Android ilovada avtomatik zaxira o'chirilgan, ya'ni transkriptlar bulutli zaxiraga tushmaydi.",
            ]}
          />
          <p className="mt-4">
            Shunga qaramay, internetda 100% xavfsizlik kafolati mavjud emas.{" "}
            <strong>Mashq paytida shaxsiy ma&apos;lumot (manzil, telefon raqami, familiya)
            aytmaslikni tavsiya qilamiz</strong> — aytilgan gap matn sifatida saqlanadi.
          </p>
        </Section>

        <Section title="9. Siyosat o'zgarishi">
          <p>
            Ilova imkoniyatlari o&apos;zgargani sari bu sahifa ham yangilanadi. Sana
            yuqorida ko&apos;rsatiladi; sezilarli o&apos;zgarish bo&apos;lsa ilovada
            xabar beriladi.
          </p>
        </Section>

        <Section title="10. Bog'lanish">
          <p>
            Savol, tuzatish yoki ma&apos;lumotni o&apos;chirish so&apos;rovi bo&apos;lsa
            maktab ma&apos;muriyati yoki ingliz tili o&apos;qituvchisi orqali murojaat
            qiling — u so&apos;rovni platforma administratoriga yetkazadi.
          </p>
        </Section>

        <div className="mt-12 border-t border-line pt-6 text-sm">
          <Link href="/" className="text-navy hover:underline">
            ← Bosh sahifaga qaytish
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <div className="mt-3 space-y-1 leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-line" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-l-2 border-gold bg-white px-5 py-4 leading-relaxed text-ink">
      {children}
    </p>
  );
}
