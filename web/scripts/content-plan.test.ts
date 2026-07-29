// Kontent rejasi tekshiruvi: npm run test:plan
//
// Bu test model chaqirmaydi va bazaga tegmaydi — faqat `content-plan.ts` dagi
// ro'yxatni tekshiradi. Nima uchun kerak:
//   - mnemonika bosqichi `Coach` taniydigan nom bilan yozilmasa, o'sha mashqda
//     struktura maslahati JIM qoladi — hech qayerda xato chiqmaydi;
//   - takrorlangan ID mavjud mashqni USTIGA YOZADI (generator `onConflictDoUpdate`
//     ishlatadi), ya'ni kontent sekin yo'qoladi.

import { PLAN, assertBankIsCheckable, itemId } from "./content-plan";
import { checkableMoves } from "../src/lib/coach";

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

check("mnemonika banki Coach ga tushunarli", () => {
  assertBankIsCheckable();
});

check("ID'lar takrorlanmaydi", () => {
  const seen = new Set<string>();
  for (const item of PLAN) {
    const id = itemId(item);
    assert(!seen.has(id), `takrorlangan ID: ${id}`);
    seen.add(id);
  }
});

check("har bir mashq/dialogda mnemonika bor", () => {
  for (const item of PLAN) {
    if (item.kind === "readaloud") {
      assert(item.mnemonic === undefined, `${itemId(item)}: takrorlash mashqiga mnemonika kerak emas`);
      continue;
    }
    assert(item.mnemonic !== undefined, `${itemId(item)}: mnemonika yo'q`);
  }
});

check("erkin nutq mashqlarida kamida 2 ta tekshiriladigan bosqich bor", () => {
  for (const item of PLAN) {
    // Dialoglar Coach'siz ishlaydi — ular tekshirilmaydi.
    if (item.kind !== "exercise") continue;
    const moves = checkableMoves(item.mnemonic!.steps.map((s) => s.en));
    assert(moves.length >= 2, `${itemId(item)} (${item.mnemonic!.acronym}): faqat ${moves.length} bosqich`);
  }
});

check("vaqt chegarasi mantiqiy", () => {
  for (const item of PLAN) {
    assert(
      item.timeLimitSec >= 30 && item.timeLimitSec <= 120,
      `${itemId(item)}: ${item.timeLimitSec}s mos emas`,
    );
  }
});

check("har bir modulda kamida bitta yangi element bor", () => {
  const expected = ["discussion", "storytelling", "picture_narrating", "roleplay", "interview"];
  for (const moduleId of expected) {
    assert(
      PLAN.some((p) => p.moduleId === moduleId),
      `${moduleId} uchun reja yo'q`,
    );
  }
});

console.log(`\n${passed}/${passed + failed} o'tdi`);
if (failed > 0) process.exit(1);
