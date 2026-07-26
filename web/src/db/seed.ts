/**
 * Android'dagi bundled `modules.json` ni Neon bazasiga import qiladi.
 * Ishga tushirish:  npm run seed
 * Qayta ishga tushsa — mavjud yozuvlarni yangilaydi (idempotent).
 */
import "./load-env"; // BIRINCHI: db/index yuklanishidan oldin .env o'qilsin
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { db, schema } from "./index";

type JsonMnemonic = { acronym: string; steps: { letter: string; en: string; uz: string }[] };
type JsonExercise = {
  id: string;
  topic?: string;
  title: string;
  mnemonic: JsonMnemonic;
  prompts?: string[];
  keywords?: string[];
  timeLimitSec?: number;
  visuals?: string[];
  targetText?: string;
};
type JsonTurn = { characterLine?: string; studentHint: string; expectedKeywords?: string[] };
type JsonDialog = {
  id: string;
  topic?: string;
  title: string;
  visuals?: string[];
  mnemonic: JsonMnemonic;
  characterName?: string;
  characterEmoji?: string;
  intro?: string;
  turns: JsonTurn[];
};
type JsonModule = {
  id: string;
  type: string;
  titleUz: string;
  titleEn: string;
  descriptionUz?: string;
  emoji?: string;
  exercises?: JsonExercise[];
  dialogs?: JsonDialog[];
};
type JsonPack = { version: number; modules: JsonModule[] };

async function main() {
  const path = resolve(process.cwd(), "../app/src/main/assets/content/modules.json");
  console.log("Import:", path);
  const pack = JSON.parse(readFileSync(path, "utf8")) as JsonPack;

  // app_meta
  const [meta] = await db.select().from(schema.appMeta).limit(1);
  if (meta) {
    await db
      .update(schema.appMeta)
      .set({ contentVersion: pack.version ?? 1 })
      .where(eq(schema.appMeta.id, meta.id));
  } else {
    await db.insert(schema.appMeta).values({ id: 1, contentVersion: pack.version ?? 1 });
  }

  let modOrder = 0;
  for (const m of pack.modules) {
    await db
      .insert(schema.modules)
      .values({
        id: m.id,
        type: m.type,
        titleUz: m.titleUz,
        titleEn: m.titleEn,
        descriptionUz: m.descriptionUz ?? "",
        emoji: m.emoji ?? "",
        sortOrder: modOrder++,
        enabled: true,
      })
      .onConflictDoUpdate({
        target: schema.modules.id,
        set: {
          type: m.type,
          titleUz: m.titleUz,
          titleEn: m.titleEn,
          descriptionUz: m.descriptionUz ?? "",
          emoji: m.emoji ?? "",
        },
      });

    let exOrder = 0;
    for (const e of m.exercises ?? []) {
      await db
        .insert(schema.exercises)
        .values({
          id: e.id,
          moduleId: m.id,
          topic: e.topic ?? "",
          title: e.title,
          acronym: e.mnemonic?.acronym ?? "",
          mnemonicSteps: e.mnemonic?.steps ?? [],
          prompts: e.prompts ?? [],
          keywords: e.keywords ?? [],
          visuals: e.visuals ?? [],
          timeLimitSec: e.timeLimitSec ?? 60,
          targetText: e.targetText ?? "",
          sortOrder: exOrder++,
        })
        .onConflictDoUpdate({
          target: schema.exercises.id,
          set: {
            moduleId: m.id,
            topic: e.topic ?? "",
            title: e.title,
            acronym: e.mnemonic?.acronym ?? "",
            mnemonicSteps: e.mnemonic?.steps ?? [],
            prompts: e.prompts ?? [],
            keywords: e.keywords ?? [],
            visuals: e.visuals ?? [],
            timeLimitSec: e.timeLimitSec ?? 60,
            targetText: e.targetText ?? "",
          },
        });
    }

    let dOrder = 0;
    for (const d of m.dialogs ?? []) {
      await db
        .insert(schema.dialogs)
        .values({
          id: d.id,
          moduleId: m.id,
          topic: d.topic ?? "",
          title: d.title,
          characterName: d.characterName ?? "",
          characterEmoji: d.characterEmoji ?? "",
          intro: d.intro ?? "",
          acronym: d.mnemonic?.acronym ?? "",
          mnemonicSteps: d.mnemonic?.steps ?? [],
          visuals: d.visuals ?? [],
          sortOrder: dOrder++,
        })
        .onConflictDoUpdate({
          target: schema.dialogs.id,
          set: {
            moduleId: m.id,
            topic: d.topic ?? "",
            title: d.title,
            characterName: d.characterName ?? "",
            characterEmoji: d.characterEmoji ?? "",
            intro: d.intro ?? "",
            acronym: d.mnemonic?.acronym ?? "",
            mnemonicSteps: d.mnemonic?.steps ?? [],
            visuals: d.visuals ?? [],
          },
        });

      // Turns'ni to'liq almashtiramiz.
      await db.delete(schema.dialogTurns).where(eq(schema.dialogTurns.dialogId, d.id));
      let tOrder = 0;
      for (const t of d.turns ?? []) {
        await db.insert(schema.dialogTurns).values({
          dialogId: d.id,
          characterLine: t.characterLine ?? "",
          studentHint: t.studentHint,
          expectedKeywords: t.expectedKeywords ?? [],
          sortOrder: tOrder++,
        });
      }
    }
  }

  console.log(`✅ Import tugadi: ${pack.modules.length} modul, versiya ${pack.version}.`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
