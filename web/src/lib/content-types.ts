// Android'dagi data class'larga AYNAN mos JSON shakli (Content.kt).
// Ilova shu JSON'ni o'zgartirmasdan parse qiladi.

export type MnemonicStep = { letter: string; en: string; uz: string };
export type Mnemonic = { acronym: string; steps: MnemonicStep[] };

export type Exercise = {
  id: string;
  topic: string;
  title: string;
  mnemonic: Mnemonic;
  prompts: string[];
  keywords: string[];
  timeLimitSec: number;
  visuals: string[];
};

export type DialogTurn = {
  characterLine: string;
  studentHint: string;
  expectedKeywords: string[];
};

export type DialogScenario = {
  id: string;
  topic: string;
  title: string;
  visuals: string[];
  mnemonic: Mnemonic;
  characterName: string;
  characterEmoji: string;
  intro: string;
  turns: DialogTurn[];
};

export type SpeakingModule = {
  id: string;
  type: string;
  titleUz: string;
  titleEn: string;
  descriptionUz: string;
  emoji: string;
  exercises: Exercise[];
  dialogs: DialogScenario[];
};

export type ContentPack = {
  version: number;
  modules: SpeakingModule[];
};
