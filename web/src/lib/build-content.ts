import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { audioKey, needsAudio } from "./audio-key";
import type { ContentPack, SpeakingModule } from "./content-types";

/**
 * Bazadan butun ContentPack'ni yig'adi — Android ilova kutgan shaklda.
 * Faqat `enabled = true` modullar chiqadi.
 */
export async function buildContentPack(): Promise<ContentPack> {
  const [meta] = await db.select().from(schema.appMeta).limit(1);
  const version = meta?.contentVersion ?? 1;

  const mods = await db
    .select()
    .from(schema.modules)
    .where(eq(schema.modules.enabled, true))
    .orderBy(asc(schema.modules.sortOrder));

  const allExercises = await db
    .select()
    .from(schema.exercises)
    .orderBy(asc(schema.exercises.sortOrder));

  const allDialogs = await db
    .select()
    .from(schema.dialogs)
    .orderBy(asc(schema.dialogs.sortOrder));

  const allTurns = await db
    .select()
    .from(schema.dialogTurns)
    .orderBy(asc(schema.dialogTurns.sortOrder));

  const turnsByDialog = new Map<string, typeof allTurns>();
  for (const t of allTurns) {
    const list = turnsByDialog.get(t.dialogId) ?? [];
    list.push(t);
    turnsByDialog.set(t.dialogId, list);
  }

  // Audio URL'lari har build'da matn xeshi bo'yicha qaytadan izlanadi — shuning
  // uchun tahrirlangan savolga eski audio ulanib qolishi mumkin emas.
  const clips = await db.select().from(schema.audioClips);
  const urlByHash = new Map(clips.map((c) => [c.textHash, c.url]));
  const audioFor = (text: string): string =>
    needsAudio(text) ? (urlByHash.get(audioKey(text)) ?? "") : "";

  const modules: SpeakingModule[] = mods.map((m) => ({
    id: m.id,
    type: m.type,
    titleUz: m.titleUz,
    titleEn: m.titleEn,
    descriptionUz: m.descriptionUz,
    emoji: m.emoji,
    exercises: allExercises
      .filter((e) => e.moduleId === m.id)
      .map((e) => ({
        id: e.id,
        topic: e.topic,
        title: e.title,
        mnemonic: { acronym: e.acronym, steps: e.mnemonicSteps },
        prompts: e.prompts,
        keywords: e.keywords,
        timeLimitSec: e.timeLimitSec,
        visuals: e.visuals,
        targetText: e.targetText,
        promptsAudio: e.prompts.map(audioFor),
        targetAudioUrl: audioFor(e.targetText),
      })),
    dialogs: allDialogs
      .filter((d) => d.moduleId === m.id)
      .map((d) => ({
        id: d.id,
        topic: d.topic,
        title: d.title,
        visuals: d.visuals,
        mnemonic: { acronym: d.acronym, steps: d.mnemonicSteps },
        characterName: d.characterName,
        characterEmoji: d.characterEmoji,
        intro: d.intro,
        turns: (turnsByDialog.get(d.id) ?? []).map((t) => ({
          characterLine: t.characterLine,
          studentHint: t.studentHint,
          expectedKeywords: t.expectedKeywords,
        })),
      })),
  }));

  return { version, modules };
}

/** Kontent versiyasini oshiradi (admin "Publish" bosganda). */
export async function bumpContentVersion(): Promise<number> {
  const [meta] = await db.select().from(schema.appMeta).limit(1);
  const next = (meta?.contentVersion ?? 1) + 1;
  if (meta) {
    await db
      .update(schema.appMeta)
      .set({ contentVersion: next, publishedAt: new Date() })
      .where(eq(schema.appMeta.id, meta.id));
  } else {
    await db.insert(schema.appMeta).values({ id: 1, contentVersion: next });
  }
  return next;
}

export async function currentVersion(): Promise<number> {
  const [meta] = await db.select().from(schema.appMeta).limit(1);
  return meta?.contentVersion ?? 1;
}
