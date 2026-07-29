// Suhbat daraxti skeleti va tekshiruvi: npm run test:tree
//
// Nima uchun kerak: buzilgan daraxt hech qanday xato bermaydi — bola suhbat
// o'rtasida qotib qoladi yoki personaj jim qoladi. Shuning uchun skeletning
// o'zi ham test bilan qo'riqlanadi.

import {
  SKELETON,
  START_KEY,
  CLOSING_KEY,
  buildTree,
  validateTree,
  cleanBranchKeywords,
  type NodeText,
  type Tree,
} from "./conversation-tree";

let passed = 0;
let failed = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}\n    ${e instanceof Error ? e.message : String(e)}`);
    failed++;
  }
}

function assert(cond: boolean, message: string): void {
  if (!cond) throw new Error(message);
}

/** Modelning "ideal" javobi — har tugunga gap, har tarmoqqa kalit so'z. */
function fullTexts(): NodeText[] {
  return SKELETON.map((spec) => ({
    key: spec.key,
    line: `Line for ${spec.key}.`,
    hintUz: `${spec.key} uchun ko'rsatma`,
    branches: spec.branchTargets.map((_, i) => ({
      intent: `intent_${i}`,
      keywords: [`keyword${i}`, `option${i}`],
    })),
  }));
}

check("skelet tugun kalitlari takrorlanmaydi", () => {
  const seen = new Set<string>();
  for (const spec of SKELETON) {
    assert(!seen.has(spec.key), `takrorlangan kalit: ${spec.key}`);
    seen.add(spec.key);
  }
});

check("skelet boshlanish va yakuniy tugunni o'z ichiga oladi", () => {
  const keys = SKELETON.map((s) => s.key);
  assert(keys.includes(START_KEY), "start tuguni yo'q");
  assert(keys.includes(CLOSING_KEY), "closing tuguni yo'q");
  assert(SKELETON.find((s) => s.key === CLOSING_KEY)?.isEnd === true, "closing isEnd emas");
});

check("to'liq javobdan yig'ilgan daraxt sog'lom", () => {
  const tree = buildTree(fullTexts());
  const problems = validateTree(tree);
  assert(problems.length === 0, problems.join("; "));
});

check("skeletdagi har bir tugun boshlanishdan erishiladi", () => {
  // Yuqoridagi tekshiruvning bir qismi, lekin alohida turgani muhim:
  // skeletga yangi tugun qo'shilib, unga havola qo'yilmasa shu yerda yiqiladi.
  const tree = buildTree(fullTexts());
  assert(
    !validateTree(tree).some((p) => p.includes("erishib bo'lmaydi")),
    "yetim tugun bor",
  );
});

check("havolalar modeldan emas, skeletdan olinadi", () => {
  // Model butunlay boshqa kalitlar qaytardi — graf baribir buzilmaydi.
  const rogue: NodeText[] = SKELETON.map((spec) => ({
    key: spec.key,
    line: "Hello there.",
    hintUz: "ko'rsatma",
    branches: spec.branchTargets.map(() => ({ intent: "x", keywords: ["something"] })),
  }));
  const tree = buildTree(rogue);
  const problems = validateTree(tree);
  assert(problems.length === 0, problems.join("; "));

  const topicAsk = tree.nodes.find((n) => n.nodeKey === "topic_ask")!;
  assert(
    topicAsk.branches.map((b) => b.nextKey).join(",") === "a1,b1,c1",
    `havolalar noto'g'ri: ${topicAsk.branches.map((b) => b.nextKey).join(",")}`,
  );
});

check("savol iboralari modeldan so'ralmaydi", () => {
  const tree = buildTree(fullTexts());
  const askNode = tree.nodes.find((n) => n.nodeKey === "ask_question")!;
  assert(askNode.branches.length === 1, "savol tarmog'i yo'q");
  assert(
    askNode.branches[0].keywords.includes("what") && askNode.branches[0].keywords.includes("do you"),
    `kalit so'zlar model javobidan olinib qolgan: ${askNode.branches[0].keywords.join(",")}`,
  );
});

check("bo'sh gap ushlanadi", () => {
  const texts = fullTexts().map((t) => (t.key === "hub_two" ? { ...t, line: "  " } : t));
  const problems = validateTree(buildTree(texts));
  assert(problems.some((p) => p.includes("hub_two") && p.includes("bo'sh")), problems.join("; "));
});

check("kalit so'zsiz tarmoq olib tashlanadi", () => {
  const texts = fullTexts().map((t) =>
    t.key === "topic_ask" ? { ...t, branches: [] } : t,
  );
  const tree = buildTree(texts);
  const node = tree.nodes.find((n) => n.nodeKey === "topic_ask")!;
  assert(node.branches.length === 0, "kalit so'zsiz tarmoq qolib ketdi");
  // Suhbat baribir davom etadi: fallback `topic_repeat` ga olib boradi va
  // a1/b1/c1 ga o'sha yerdan ham havola bor. Shuning uchun yetim tugun YO'Q.
  assert(
    !validateTree(tree).some((p) => p.includes("erishib bo'lmaydi")),
    "tarmoq yo'qolganda suhbat yo'li uzilib qoldi",
  );
});

check("ikkala savol tuguni ham tarmoqsiz qolsa yetim tugunlar topiladi", () => {
  const texts = fullTexts().map((t) =>
    t.key === "topic_ask" || t.key === "topic_repeat" ? { ...t, branches: [] } : t,
  );
  const problems = validateTree(buildTree(texts));
  assert(
    problems.filter((p) => p.includes("erishib bo'lmaydi")).length === 6,
    `kutilgan 6 ta yetim tugun, topildi: ${problems.filter((p) => p.includes("erishib")).join("; ")}`,
  );
});

check("qisqa kalit so'zlar tashlanadi, iboralar qoladi", () => {
  const cleaned = cleanBranchKeywords(["dog", "READING", "do you", "  music  ", "reading", "a"]);
  assert(!cleaned.includes("dog"), "qisqa so'z qoldi");
  assert(cleaned.includes("reading"), "uzun so'z tushib qoldi");
  assert(cleaned.includes("do you"), "ibora tushib qoldi");
  assert(cleaned.filter((k) => k === "reading").length === 1, "takror tozalanmadi");
});

check("buzilgan daraxt tekshiruvdan o'tmaydi", () => {
  const broken: Tree = {
    startKey: "start",
    closingKey: "closing",
    nodes: [
      { nodeKey: "start", line: "Hi.", hintUz: "", branches: [], fallbackKey: "yoq", isEnd: false },
      { nodeKey: "closing", line: "Bye.", hintUz: "", branches: [], fallbackKey: "", isEnd: true },
    ],
  };
  const problems = validateTree(broken);
  assert(problems.some((p) => p.includes("yoq")), "yetim havola topilmadi");
});

check("chiqish yo'li yo'q tugun topiladi", () => {
  const stuck: Tree = {
    startKey: "start",
    closingKey: "",
    nodes: [
      { nodeKey: "start", line: "Hi.", hintUz: "", branches: [], fallbackKey: "", isEnd: false },
    ],
  };
  assert(
    validateTree(stuck).some((p) => p.includes("chiqish yo'li yo'q")),
    "qotib qolgan tugun topilmadi",
  );
});

console.log(`\n${passed}/${passed + failed} o'tdi`);
if (failed > 0) process.exit(1);
