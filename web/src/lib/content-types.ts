// Android'dagi data class'larga AYNAN mos JSON shakli (Content.kt).
// Ilova shu JSON'ni o'zgartirmasdan parse qiladi.

export type MnemonicStep = { letter: string; en: string; uz: string };
export type Mnemonic = { acronym: string; steps: MnemonicStep[] };

/**
 * Mashqqa xos murabbiy maslahati. `move` — Coach dagi harakat kaliti
 * ("OPINION", "EXAMPLE", …). Yozuv bo'lmasa Coach umumiy matnni ishlatadi.
 */
export type StructureTip = { move: string; title: string; detail: string };

export type Exercise = {
  id: string;
  topic: string;
  title: string;
  mnemonic: Mnemonic;
  prompts: string[];
  keywords: string[];
  timeLimitSec: number;
  visuals: string[];
  /**
   * Bo'sh bo'lmasa — mashq "Takrorlang" turiga o'tadi: bola aynan shu matnni
   * o'qiydi va aytilgan so'zlar so'zma-so'z solishtiriladi (qarang: read-aloud.ts).
   * Bo'sh bo'lsa — odatdagi erkin nutq mashqi.
   */
  targetText: string;
  /**
   * Yaratilgan talaffuz audiosi (Gemini TTS). `prompts` bilan INDEKS BO'YICHA
   * moslashadi; audio bo'lmagan savol o'rnida bo'sh satr turadi.
   *
   * Har build'da matn xeshi bo'yicha qaytadan hisoblanadi, shuning uchun
   * eskirgan audio ulanib qolishi mumkin emas (qarang: lib/audio-key.ts).
   * Bo'sh bo'lsa — qurilmaning o'z TTS'i ishlatiladi.
   */
  promptsAudio: string[];
  /** "Takrorlang" matnining talaffuz audiosi; bo'sh bo'lsa qurilma TTS'i. */
  targetAudioUrl: string;
  /**
   * Shu mashqqa moslangan murabbiy maslahatlari. Bo'sh yoki to'liq bo'lmasa
   * Coach umumiy matnlarni ishlatadi — hech narsa buzilmaydi.
   */
  structureTips: StructureTip[];
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

/**
 * Suhbat daraxtining bitta tarmog'i: bola shu kalit so'zlardan gapirsa,
 * suhbat `nextKey` tuguniga o'tadi.
 *
 * `intent` — faqat tahlil va nosozlikni izlash uchun nom; mantiqqa ta'sir
 * qilmaydi, tanlov kalit so'zlar bo'yicha boradi.
 */
export type ConversationBranch = { intent: string; keywords: string[]; nextKey: string };

export type ConversationNode = {
  nodeKey: string;
  /** Personajning gapi (ingliz tilida). */
  line: string;
  /** O'quvchiga o'zbekcha ko'rsatma. */
  hintUz: string;
  branches: ConversationBranch[];
  /** Hech bir tarmoq mos kelmasa — bu yerga o'tiladi (boshi berk ko'cha bo'lmasin). */
  fallbackKey: string;
  isEnd: boolean;
};

/**
 * Erkin suhbat — tarmoqlanuvchi daraxt. Suhbat davomida MODEL CHAQIRILMAYDI:
 * butun daraxt oldindan yaratilgan, telefon uni offline aylanib chiqadi.
 */
export type Conversation = {
  id: string;
  topic: string;
  title: string;
  characterName: string;
  characterEmoji: string;
  goalUz: string;
  visuals: string[];
  targetMinutes: number;
  startKey: string;
  /** Vaqt tugaganda o'tiladigan yakuniy tugun. */
  closingKey: string;
  nodes: ConversationNode[];
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
  /** Erkin suhbatlar. Bo'sh standart — bu maydonni bilmaydigan eski ilova ham parse qiladi. */
  conversations: Conversation[];
};

export type ContentPack = {
  version: number;
  modules: SpeakingModule[];
};
