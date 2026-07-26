import type { MnemonicStep } from "@/db/schema";

export type ModuleRow = {
  id: string;
  type: string;
  titleUz: string;
  titleEn: string;
  descriptionUz: string;
  emoji: string;
  sortOrder: number;
  enabled: boolean;
};

export type ExerciseRow = {
  id: string;
  moduleId: string;
  topic: string;
  title: string;
  acronym: string;
  mnemonicSteps: MnemonicStep[];
  prompts: string[];
  keywords: string[];
  visuals: string[];
  timeLimitSec: number;
  sortOrder: number;
  /** Bo'sh bo'lmasa — "Takrorlang" mashqi. */
  targetText: string;
};

export type DialogRow = {
  id: string;
  moduleId: string;
  topic: string;
  title: string;
  characterName: string;
  characterEmoji: string;
  intro: string;
  acronym: string;
  mnemonicSteps: MnemonicStep[];
  visuals: string[];
  sortOrder: number;
};

export type TurnRow = {
  id: number;
  dialogId: string;
  characterLine: string;
  studentHint: string;
  expectedKeywords: string[];
  sortOrder: number;
};

export type FullContent = {
  modules: ModuleRow[];
  exercises: ExerciseRow[];
  dialogs: DialogRow[];
  turns: TurnRow[];
  version: number;
  publishedAt: string | null;
};

export type { MnemonicStep };
