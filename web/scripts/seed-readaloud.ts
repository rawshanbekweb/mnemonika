// Talaffuz ("Takrorlang") mashqlarini bazaga yozadi — qo'lda yozilgan, idempotent.
//
//   npm run seed:readaloud
//   npm run export:content   — keyin APK ichidagi zaxira faylga
//
// NIMA UCHUN GENERATOR EMAS: `gen:content` dagi `readaloud` rejasi modelga
// "bitta jumla yoz" deydi va model MAVZU haqida jumla yozadi — tovush haqida
// emas. Talaffuz mashqining butun ma'nosi esa QAYSI TOVUSH mashq qilinishida:
// bir jumlada bitta qiyin tovush ko'p marta takrorlanishi kerak ("think —
// three — thing"). Buni rejalashtirish uchun model kerak emas, aksincha
// model har ishga tushganda jumlani o'zgartirib, mashqni buzib qo'yadi.
// Shuning uchun jumlalar shu yerda qo'lda va QAT'IY yozilgan.
//
// JUMLA YOZISH QOIDALARI (buzilsa mashq foydasiz bo'ladi):
//   1. Mashq qilinayotgan tovush jumlada KAMIDA 4 marta uchrasin.
//   2. 10–16 so'z: qisqasi tovushni takrorlamaydi, uzuni bolani charchatadi.
//   3. RAQAM YO'Q ("3" emas, "three") — tanigich raqamni so'z sifatida
//      qaytaradi va so'zma-so'z solishtirish yiqilardi.
//   4. QISQARTMA YO'Q ("don't", "it's") — Vosk kichik modeli ularni ba'zan
//      ikki so'zga yoyadi va bola aybsiz "xato" oladi.
//   5. Faqat 5–6 sinf so'z boyligi: model bilmagan so'zni bola to'g'ri aytsa
//      ham tanimaydi.
//
// ID'lar `_pron_` bilan: `content-plan.ts` dagi rejadan yaratiladiganlar bilan
// (`<modul>_<slug>`) hech qachon to'qnashmasin — `gen:content` qayta ishga
// tushsa bu mashqlar tegilmay qoladi.

import "../src/db/load-env";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "../src/db";

type ReadAloudSeed = {
  /** Bazadagi ID — o'zgartirilmasin, o'quvchilar progressi shunga bog'langan. */
  id: string;
  moduleId: string;
  /** O'zbekcha sarlavha: qaysi tovush mashq qilinishi ko'rinib tursin. */
  title: string;
  /** O'qiladigan jumla. */
  targetText: string;
  visuals: string[];
};

/**
 * Munozara moduli — undosh tovushlar.
 *
 * O'zbek tilida yo'q yoki boshqacha aytiladigan tovushlar tanlangan: "th"
 * (o'zbekcha "z"/"s" ga almashtiriladi), "w"/"v" (bitta harf deb o'ylanadi),
 * "r"/"l" farqi va "sh"/"ch".
 */
const DISCUSSION: ReadAloudSeed[] = [
  {
    id: "discussion_pron_th",
    moduleId: "discussion",
    title: "Takrorlang: 'th' tovushi",
    targetText:
      "I think that this thing is better than the other three things over there",
    visuals: ["🗣️", "👅", "🔤"],
  },
  {
    id: "discussion_pron_w_v",
    moduleId: "discussion",
    title: "Takrorlang: 'w' va 'v' tovushlari",
    targetText:
      "We watched a very interesting video with seven very quiet visitors last winter",
    visuals: ["📺", "👀", "❄️"],
  },
  {
    id: "discussion_pron_r_l",
    moduleId: "discussion",
    title: "Takrorlang: 'r' va 'l' tovushlari",
    targetText:
      "The little red rabbit really likes to run along the long yellow river",
    visuals: ["🐰", "🏃", "🌊"],
  },
  {
    id: "discussion_pron_sh_ch",
    moduleId: "discussion",
    title: "Takrorlang: 'sh' va 'ch' tovushlari",
    targetText:
      "She chose a short shirt and a cheap chair in the shop near the church",
    visuals: ["👕", "🪑", "🛍️"],
  },
  {
    id: "discussion_pron_s_endings",
    moduleId: "discussion",
    title: "Takrorlang: so'z oxiridagi 's'",
    targetText:
      "My friends bring books, pens and boxes to their classes on cold mornings",
    visuals: ["📚", "✏️", "🎒"],
  },
];

/**
 * Hikoya moduli — o'tgan zamon.
 *
 * "-ed" qo'shimchasi uch xil o'qiladi (/t/, /d/, /ɪd/) va bolalar uni doim
 * "-ed" deb aytadi. Noto'g'ri fe'llar esa umuman boshqa shaklga o'tadi —
 * ikkalasi ham hikoya aytishda har gapda uchraydi.
 */
const STORYTELLING: ReadAloudSeed[] = [
  {
    id: "storytelling_pron_ed",
    moduleId: "storytelling",
    title: "Takrorlang: '-ed' qo'shimchasi",
    targetText:
      "Yesterday we walked to the park, played football and visited our old friends",
    visuals: ["🚶", "⚽", "👬"],
  },
  {
    id: "storytelling_pron_irregular",
    moduleId: "storytelling",
    title: "Takrorlang: noto'g'ri fe'llar",
    targetText:
      "Last summer I went to the village, saw my grandmother and ate warm bread",
    visuals: ["🚌", "👵", "🍞"],
  },
  {
    id: "storytelling_pron_ing",
    moduleId: "storytelling",
    title: "Takrorlang: '-ing' tovushi",
    targetText:
      "The singing birds were flying and jumping in the bright morning sunshine",
    visuals: ["🐦", "☀️", "🌳"],
  },
  {
    id: "storytelling_pron_long_vowels",
    moduleId: "storytelling",
    title: "Takrorlang: cho'ziq unlilar",
    targetText:
      "He read a green book about a sweet dream beside the deep blue sea",
    visuals: ["📗", "💭", "🌊"],
  },
  {
    id: "storytelling_pron_clusters",
    moduleId: "storytelling",
    title: "Takrorlang: qo'sh undoshlar",
    targetText:
      "The strong students climbed the steep street and stopped near the small bridge",
    visuals: ["🧗", "🛣️", "🌉"],
  },
];

/**
 * Rasmli hikoya moduli — tasvirlash iboralari va qisqa unlilar.
 *
 * Bu yerdagi jumlalar modulning o'z vazifasiga ham xizmat qiladi: "there is /
 * there are", ranglar va joy predloglari rasm tasvirlashda har safar kerak.
 */
const PICTURE: ReadAloudSeed[] = [
  {
    id: "picture_narrating_pron_there",
    moduleId: "picture_narrating",
    title: "Takrorlang: 'there is' va 'there are'",
    targetText:
      "There is a big tree in the picture and there are two children under it",
    visuals: ["🌳", "👦", "👧"],
  },
  {
    id: "picture_narrating_pron_short_a_e",
    moduleId: "picture_narrating",
    title: "Takrorlang: qisqa 'a' va 'e'",
    targetText:
      "A happy man in a black hat is sitting at a red desk near ten pens",
    visuals: ["🎩", "🪑", "🖊️"],
  },
  {
    id: "picture_narrating_pron_p_b",
    moduleId: "picture_narrating",
    title: "Takrorlang: 'p' va 'b' tovushlari",
    targetText:
      "The boy puts a purple box beside the big brown bag on the paper",
    visuals: ["📦", "🎒", "📄"],
  },
  {
    id: "picture_narrating_pron_k_g",
    moduleId: "picture_narrating",
    title: "Takrorlang: 'k' va 'g' tovushlari",
    targetText:
      "A grey cat is walking quickly across the green garden to the old gate",
    visuals: ["🐈", "🌿", "🚪"],
  },
  {
    id: "picture_narrating_pron_igh",
    moduleId: "picture_narrating",
    title: "Takrorlang: 'igh' tovushi",
    targetText:
      "The night sky was bright and the light of the moon was right above us",
    visuals: ["🌙", "⭐", "🌌"],
  },
];

const ALL: ReadAloudSeed[] = [...DISCUSSION, ...STORYTELLING, ...PICTURE];

/** Yuqoridagi qoidalarni tekshiradi — buzilgan jumla bazaga tushmasin. */
function validate(s: ReadAloudSeed): string[] {
  const problems: string[] = [];
  const words = s.targetText.trim().split(/\s+/).filter(Boolean);
  if (words.length < 10 || words.length > 16) {
    problems.push(`jumla ${words.length} so'z (10–16 bo'lishi kerak)`);
  }
  if (/\d/.test(s.targetText)) problems.push("matnda raqam bor");
  if (/['’]/.test(s.targetText)) problems.push("matnda qisqartma (apostrof) bor");
  if (!s.title.startsWith("Takrorlang:")) problems.push('sarlavha "Takrorlang:" bilan boshlanmaydi');
  if (s.visuals.length < 3) problems.push(`emoji ${s.visuals.length} ta (3 ta kerak)`);
  return problems;
}

/** Modul oxiriga qo'shiladi — mavjud mashqlar tartibi o'zgarmaydi. */
async function nextSortOrder(moduleId: string): Promise<number> {
  const rows = await db
    .select()
    .from(schema.exercises)
    .where(eq(schema.exercises.moduleId, moduleId))
    .orderBy(asc(schema.exercises.sortOrder));
  return rows.length === 0 ? 0 : rows[rows.length - 1].sortOrder + 1;
}

async function main() {
  let broken = 0;
  for (const s of ALL) {
    const problems = validate(s);
    if (problems.length > 0) {
      console.error(`${s.id}:\n  ${problems.join("\n  ")}`);
      broken++;
    }
  }
  if (broken > 0) {
    console.error(`\n${broken} ta mashq qoidalarga mos emas — hech narsa yozilmadi.`);
    process.exit(1);
  }

  const moduleIds = [...new Set(ALL.map((s) => s.moduleId))];
  const existing = await db.select().from(schema.modules);
  const known = new Set(existing.map((m) => m.id));
  const missing = moduleIds.filter((id) => !known.has(id));
  if (missing.length > 0) {
    console.error(`Bazada bunday modul yo'q: ${missing.join(", ")}`);
    process.exit(1);
  }

  // Tartib raqami har modul uchun bir marta olinadi va shu yerda oshiriladi:
  // har mashq uchun qaytadan so'ralsa hammasi bitta raqamni olardi.
  const orderByModule = new Map<string, number>();
  for (const id of moduleIds) orderByModule.set(id, await nextSortOrder(id));

  for (const s of ALL) {
    const values = {
      moduleId: s.moduleId,
      topic: "Talaffuz mashqi",
      title: s.title,
      // "Takrorlang" mashqida mnemonika va kalit so'zlar YO'Q: baho so'zma-so'z
      // solishtirishdan chiqadi (`ReadAloud`), struktura maslahati bermaydi.
      acronym: "",
      mnemonicSteps: [],
      prompts: [],
      keywords: [],
      visuals: s.visuals,
      timeLimitSec: 40,
      targetText: s.targetText,
    };
    const order = orderByModule.get(s.moduleId)!;
    orderByModule.set(s.moduleId, order + 1);

    await db
      .insert(schema.exercises)
      .values({ id: s.id, sortOrder: order, ...values })
      // Qayta ishga tushirilsa matn yangilanadi, `sortOrder` esa tegilmaydi —
      // aks holda har safar mashq ro'yxat oxiriga sakrab ketardi.
      .onConflictDoUpdate({ target: schema.exercises.id, set: values });
    console.log(`✓ ${s.id} — ${s.title}`);
  }

  console.log(
    `\nTayyor: ${ALL.length} ta talaffuz mashqi.\n` +
      "Keyingi qadamlar:\n" +
      "  npm run gen:audio        — namuna talaffuzi (bo'lmasa ilova TTS bilan o'qiydi)\n" +
      "  npm run export:content   — APK ichidagi zaxira fayl\n" +
      '  admin panelida "Publish"  — internetdagi o\'quvchilarga',
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
