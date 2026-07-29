// Erkin suhbat daraxtining SKELETI va tekshiruvi.
//
// ASOSIY QAROR: daraxtning SHAKLI shu yerda qat'iy yozilgan, model esa faqat
// MATN yozadi (gaplar, ko'rsatmalar, kalit so'zlar). Ya'ni model tugun kaliti
// ham, havola ham o'ylab topmaydi — havolalar skeletdan olinadi.
//
// Nima uchun shunday: modelga butun grafni topshirsak, u yetim havola ("keyingi
// tugun yo'q"), boshi berk ko'cha yoki cheksiz halqa yasashi mumkin. Bularning
// hech biri kompilyatsiyada ham, testda ham bilinmaydi — faqat bola suhbat
// o'rtasida qotib qolganda ma'lum bo'ladi. Skelet bilan bu MUMKIN EMAS.
//
// Skelet shakli qo'lda yozilgan `free_talk_ben_london` bilan bir xil g'oyada:
// "stansiyalar" — har mavzu tugagach umumiy tugunga qaytadi, shuning uchun
// oz tugun bilan ham qisqa va uzoq suhbat chiqadi.

export type Branch = { intent: string; keywords: string[]; nextKey: string };

export type TreeNode = {
  nodeKey: string;
  line: string;
  hintUz: string;
  branches: Branch[];
  fallbackKey: string;
  isEnd: boolean;
};

export type Tree = {
  startKey: string;
  closingKey: string;
  nodes: TreeNode[];
};

/**
 * Bitta tugunning skeletdagi o'rni.
 *
 * `role` — modelga beriladigan izoh: shu tugunda nima deyilishi kerak.
 * `branchTargets` — tarmoqlar qayerga boradi (model faqat kalit so'z yozadi).
 */
export type NodeSpec = {
  key: string;
  role: string;
  branchTargets: string[];
  fallbackKey: string;
  isEnd?: boolean;
  /** Tarmoq kalit so'zlarini model emas, biz to'ldiramiz. */
  fixedKeywords?: string[][];
};

/**
 * Savol berganini bildiruvchi iboralar.
 *
 * Bularni modeldan so'ramaymiz: ro'yxat til bilimiga bog'liq va har suhbatda
 * bir xil bo'lishi kerak (`ConversationCoach` ham aynan shu usulni ishlatadi).
 */
export const QUESTION_CUES = [
  "what", "where", "when", "which", "how", "why",
  "do you", "are you", "can you", "have you", "did you",
];

/** 20 tugunli standart skelet. */
export const SKELETON: NodeSpec[] = [
  {
    key: "start",
    role: "Salomlashish va o'zini tanishtirish, oxirida bolaning ismini so'rash.",
    branchTargets: [],
    fallbackKey: "topic_ask",
  },
  {
    key: "topic_ask",
    role:
      "Asosiy savol: suhbat mavzusi bo'yicha bolaning tanlovini so'rash. " +
      "Javob uch xil bo'lishi mumkin (A, B, C) — savol shu uch yo'nalishga ochiq bo'lsin.",
    branchTargets: ["a1", "b1", "c1"],
    fallbackKey: "topic_repeat",
  },
  {
    key: "topic_repeat",
    role:
      "Tushunmaganda: xushmuomalalik bilan qayta so'rash va uchta variantni " +
      "AYTIB berish (\"Do you like A, B or C?\").",
    branchTargets: ["a1", "b1", "c1"],
    fallbackKey: "hub_two",
  },

  { key: "a1", role: "A tanlovi bo'yicha qiziqish bildirish va batafsil savol berish.", branchTargets: [], fallbackKey: "a2" },
  { key: "a2", role: "A mavzusida ikkinchi savol — sabab yoki tafsilot so'rash.", branchTargets: [], fallbackKey: "hub_two" },
  { key: "b1", role: "B tanlovi bo'yicha qiziqish bildirish va batafsil savol berish.", branchTargets: [], fallbackKey: "b2" },
  { key: "b2", role: "B mavzusida ikkinchi savol — sabab yoki tafsilot so'rash.", branchTargets: [], fallbackKey: "hub_two" },
  { key: "c1", role: "C tanlovi bo'yicha qiziqish bildirish va batafsil savol berish.", branchTargets: [], fallbackKey: "c2" },
  { key: "c2", role: "C mavzusida ikkinchi savol — sabab yoki tafsilot so'rash.", branchTargets: [], fallbackKey: "hub_two" },

  {
    key: "hub_two",
    role:
      "YANGI MAVZUGA o'tish: ikkinchi mavzu bo'yicha savol. Javob uch xil " +
      "bo'lishi mumkin (D, E, F); F — eng umumiy javob.",
    branchTargets: ["d1", "e1", "f1"],
    fallbackKey: "f1",
  },
  { key: "d1", role: "D javobiga qisqa munosabat va bitta qo'shimcha savol.", branchTargets: [], fallbackKey: "hub_three" },
  { key: "e1", role: "E javobiga qisqa munosabat va bitta qo'shimcha savol.", branchTargets: [], fallbackKey: "hub_three" },
  { key: "f1", role: "Umumiy javobga munosabat va bitta qo'shimcha savol.", branchTargets: [], fallbackKey: "hub_three" },

  {
    key: "hub_three",
    role:
      "UCHINCHI MAVZU bo'yicha savol. Javob ikki xil bo'lishi mumkin (G, H); " +
      "H — eng umumiy javob.",
    branchTargets: ["g1", "h1"],
    fallbackKey: "h1",
  },
  { key: "g1", role: "G javobiga munosabat va bitta qo'shimcha savol.", branchTargets: [], fallbackKey: "ask_question" },
  { key: "h1", role: "H javobiga munosabat va bitta qo'shimcha savol.", branchTargets: [], fallbackKey: "ask_question" },

  {
    key: "ask_question",
    role:
      "Navbatni bolaga berish: undan O'ZI savol berishini so'rash va bitta " +
      "namuna savol aytish.",
    branchTargets: ["answer_question"],
    fallbackKey: "answer_hint",
    fixedKeywords: [QUESTION_CUES],
  },
  {
    key: "answer_hint",
    role: "Bola savol bermadi — savol boshlashga yordam berish, namuna ko'rsatish.",
    branchTargets: ["answer_question"],
    fallbackKey: "closing",
    fixedKeywords: [QUESTION_CUES],
  },
  {
    key: "answer_question",
    role:
      "Bolaning savoliga javob berish — o'zi haqida yoki shahri haqida 2 gap. " +
      "Savol nima bo'lishini bilmaymiz, shuning uchun javob umumiy bo'lsin.",
    branchTargets: [],
    fallbackKey: "closing",
  },
  {
    key: "closing",
    role: "Xayrlashish: rahmat aytish va yana uchrashishga umid bildirish.",
    branchTargets: [],
    fallbackKey: "",
    isEnd: true,
  },
];

export const START_KEY = "start";
export const CLOSING_KEY = "closing";

/** Model qaytarishi kerak bo'lgan bitta tugun matni. */
export type NodeText = {
  key: string;
  line: string;
  hintUz: string;
  /** Tarmoqli tugunlarda: skeletdagi `branchTargets` bilan BIR XIL TARTIBDA. */
  branches?: { intent: string; keywords: string[] }[];
};

/**
 * Kalit so'zlarni tozalaydi.
 *
 * 4 harfdan qisqa so'zlar TASHLANADI: tanigich ularni boshqa so'zga aylantirib
 * yuboradi, ustiga qisqa so'z boshqa so'z ichida ham topiladi ("read" →
 * "bread"). Ko'p so'zli iboralar (`do you`) qoladi — ular xavfsiz.
 */
export function cleanBranchKeywords(raw: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const word = item.trim().toLowerCase().replace(/[^a-z' ]/g, "").replace(/\s+/g, " ").trim();
    if (word === "" || seen.has(word)) continue;
    if (!word.includes(" ") && word.length < 4) continue;
    seen.add(word);
    out.push(word);
  }
  return out;
}

/**
 * Skelet + model matnidan daraxt yig'adi.
 *
 * Havolalar FAQAT skeletdan olinadi — model qanday javob qaytarsa ham graf
 * buzilmaydi. Matn yetishmasa tugun bo'sh gap bilan qoladi va buni
 * [validateTree] ushlaydi.
 */
export function buildTree(texts: NodeText[]): Tree {
  const byKey = new Map(texts.map((t) => [t.key, t]));

  const nodes: TreeNode[] = SKELETON.map((spec) => {
    const text = byKey.get(spec.key);
    const branches: Branch[] = spec.branchTargets.map((target, i) => {
      const fixed = spec.fixedKeywords?.[i];
      const fromModel = text?.branches?.[i];
      return {
        intent: fromModel?.intent?.trim() || `branch_${i + 1}`,
        keywords: cleanBranchKeywords(fixed ?? fromModel?.keywords ?? []),
        nextKey: target,
      };
    });

    return {
      nodeKey: spec.key,
      line: text?.line?.trim() ?? "",
      hintUz: text?.hintUz?.trim() ?? "",
      // Kalit so'zi qolmagan tarmoq hech qachon tanlanmaydi — uni olib
      // tashlaymiz, aks holda daraxtda "o'lik" yo'l qolardi.
      branches: branches.filter((b) => b.keywords.length > 0),
      fallbackKey: spec.fallbackKey,
      isEnd: spec.isEnd ?? false,
    };
  });

  return { startKey: START_KEY, closingKey: CLOSING_KEY, nodes };
}

/**
 * Daraxtni tekshiradi. Bo'sh ro'yxat — daraxt sog'lom.
 *
 * Tekshiriladiganlar:
 *  - boshlanish va yakuniy tugun bor;
 *  - har bir havola mavjud tugunga boradi;
 *  - yakuniy bo'lmagan har tugunda chiqish yo'li bor;
 *  - har bir tugun boshlanishdan ERISHILADIGAN (yetim tugun qolmasin);
 *  - har bir tugunda gap bor (bo'sh gap — personaj jim qoladi).
 */
export function validateTree(tree: Tree): string[] {
  const problems: string[] = [];
  const keys = new Set(tree.nodes.map((n) => n.nodeKey));

  if (tree.nodes.length === 0) return ["daraxt bo'sh"];
  if (!keys.has(tree.startKey)) problems.push(`startKey "${tree.startKey}" tuguni yo'q`);
  if (tree.closingKey && !keys.has(tree.closingKey)) {
    problems.push(`closingKey "${tree.closingKey}" tuguni yo'q`);
  }

  for (const n of tree.nodes) {
    if (n.line.trim() === "") problems.push(`${n.nodeKey}: gap bo'sh`);
    for (const b of n.branches) {
      if (!keys.has(b.nextKey)) problems.push(`${n.nodeKey}/${b.intent} → "${b.nextKey}" tuguni yo'q`);
    }
    if (n.fallbackKey && !keys.has(n.fallbackKey)) {
      problems.push(`${n.nodeKey} fallback → "${n.fallbackKey}" tuguni yo'q`);
    }
    if (!n.isEnd && n.fallbackKey === "" && n.branches.length === 0) {
      problems.push(`${n.nodeKey}: chiqish yo'li yo'q`);
    }
  }

  // Erishiluvchanlik: yetim tugun kontentni behuda kattalashtiradi va odatda
  // havolada xato borligini bildiradi.
  const seen = new Set<string>([tree.startKey]);
  const queue = [tree.startKey];
  const byKey = new Map(tree.nodes.map((n) => [n.nodeKey, n]));
  while (queue.length > 0) {
    const node = byKey.get(queue.shift()!);
    if (!node) continue;
    const next = [...node.branches.map((b) => b.nextKey), node.fallbackKey].filter(Boolean);
    for (const key of next) {
      if (!seen.has(key) && keys.has(key)) {
        seen.add(key);
        queue.push(key);
      }
    }
  }
  for (const n of tree.nodes) {
    if (!seen.has(n.nodeKey)) problems.push(`${n.nodeKey}: boshlanishdan erishib bo'lmaydi`);
  }

  return problems;
}
