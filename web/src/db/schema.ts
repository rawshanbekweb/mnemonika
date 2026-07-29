import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
  index,
  unique,
} from "drizzle-orm/pg-core";

/** Mnemonik bosqich — Android'dagi MnemonicStep bilan bir xil. */
export type MnemonicStep = { letter: string; en: string; uz: string };

/** Nutq turi moduli (Munozara, Rolli o'yin, Hikoya, Intervyu, Rasmli hikoya). */
export const modules = pgTable("modules", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  titleUz: text("title_uz").notNull(),
  titleEn: text("title_en").notNull(),
  descriptionUz: text("description_uz").notNull().default(""),
  emoji: text("emoji").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
});

/** Bitta mashq (Munozara / Hikoya / Rasmli hikoya). Mnemonika shu yerda embed. */
export const exercises = pgTable(
  "exercises",
  {
    id: text("id").primaryKey(),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    topic: text("topic").notNull().default(""),
    title: text("title").notNull(),
    acronym: text("acronym").notNull().default(""),
    mnemonicSteps: jsonb("mnemonic_steps").$type<MnemonicStep[]>().notNull().default([]),
    prompts: jsonb("prompts").$type<string[]>().notNull().default([]),
    keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
    visuals: jsonb("visuals").$type<string[]>().notNull().default([]),
    timeLimitSec: integer("time_limit_sec").notNull().default(60),
    sortOrder: integer("sort_order").notNull().default(0),
    /** Bo'sh bo'lmasa — "Takrorlang" mashqi (bola aynan shu matnni o'qiydi). */
    targetText: text("target_text").notNull().default(""),
  },
  (t) => [index("exercises_module_idx").on(t.moduleId)],
);

/** Rolli o'yin / Intervyu senariysi. Mnemonika embed. */
export const dialogs = pgTable(
  "dialogs",
  {
    id: text("id").primaryKey(),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    topic: text("topic").notNull().default(""),
    title: text("title").notNull(),
    characterName: text("character_name").notNull().default(""),
    characterEmoji: text("character_emoji").notNull().default(""),
    intro: text("intro").notNull().default(""),
    acronym: text("acronym").notNull().default(""),
    mnemonicSteps: jsonb("mnemonic_steps").$type<MnemonicStep[]>().notNull().default([]),
    visuals: jsonb("visuals").$type<string[]>().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("dialogs_module_idx").on(t.moduleId)],
);

/** Bitta dialog almashishi. */
export const dialogTurns = pgTable(
  "dialog_turns",
  {
    id: serial("id").primaryKey(),
    dialogId: text("dialog_id")
      .notNull()
      .references(() => dialogs.id, { onDelete: "cascade" }),
    characterLine: text("character_line").notNull().default(""),
    studentHint: text("student_hint").notNull().default(""),
    expectedKeywords: jsonb("expected_keywords").$type<string[]>().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("dialog_turns_dialog_idx").on(t.dialogId)],
);

/**
 * Erkin suhbat senariysi — tarmoqlanuvchi daraxt ("offline suhbatdosh").
 *
 * Nima uchun `dialogs` dan alohida: `dialog_turns` — QAT'IY TARTIBDAGI ro'yxat,
 * bola nima desa ham keyingi gap o'zgarmaydi. Bu yerda esa keyingi gap bolaning
 * javobiga qarab tanlanadi, ya'ni tuzilma ro'yxat emas, GRAF. Mavjud rolli
 * o'yin/intervyu senariylari o'z holicha ishlashda davom etadi.
 *
 * $0 SHARTI: suhbat davomida hech qanday model chaqirilmaydi — butun daraxt
 * oldindan yaratilgan, telefon uni offline aylanib chiqadi.
 */
export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    topic: text("topic").notNull().default(""),
    title: text("title").notNull(),
    characterName: text("character_name").notNull().default(""),
    characterEmoji: text("character_emoji").notNull().default(""),
    /** Bolaga o'zbekcha vazifa: suhbatda nimaga erishish kerak. */
    goalUz: text("goal_uz").notNull().default(""),
    visuals: jsonb("visuals").$type<string[]>().notNull().default([]),
    /** Suhbatning mo'ljallangan davomiyligi — vaqt tugaganda yakunga o'tiladi. */
    targetMinutes: integer("target_minutes").notNull().default(3),
    /** Boshlanish tugunining kaliti. */
    startKey: text("start_key").notNull().default("start"),
    /** Vaqt tugaganda o'tiladigan yakuniy tugun. */
    closingKey: text("closing_key").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("conversations_module_idx").on(t.moduleId)],
);

/**
 * Suhbat daraxtining bitta tuguni.
 *
 * `branches` — bolaning javobiga qarab qayerga o'tish. Mos keladigan tarmoq
 * topilmasa `fallback_key` ishlatiladi (odatda "tushunmadim, qaytar" tuguni),
 * shuning uchun suhbat hech qachon boshi berk ko'chaga kirmaydi.
 */
export const conversationNodes = pgTable(
  "conversation_nodes",
  {
    id: serial("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    /** Daraxt ichidagi kalit ("start", "hobby_sport", …). */
    nodeKey: text("node_key").notNull(),
    /** Personajning gapi (ingliz tilida) — TTS shuni aytadi. */
    line: text("line").notNull().default(""),
    /** O'quvchiga o'zbekcha ko'rsatma. */
    hintUz: text("hint_uz").notNull().default(""),
    branches: jsonb("branches")
      .$type<{ intent: string; keywords: string[]; nextKey: string }[]>()
      .notNull()
      .default([]),
    fallbackKey: text("fallback_key").notNull().default(""),
    /** Suhbat shu tugunda tugaydi. */
    isEnd: boolean("is_end").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("conversation_nodes_conversation_idx").on(t.conversationId),
    unique("conversation_nodes_key_unique").on(t.conversationId, t.nodeKey),
  ],
);

/** Media kutubxonasi — haqiqiy rasmlar (emoji o'rniga). */
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  pathname: text("pathname").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Yaratilgan ingliz talaffuzi klipi (Gemini TTS → Vercel Blob).
 *
 * Kalit — MATN xeshi, mashq ID'si emas (izoh: `lib/audio-key.ts`). Shu sababli
 * bir xil gap bir necha mashqda uchrasa bir marta yaratiladi, va savol matni
 * tahrirlansa eski audio o'z-o'zidan uzilib qoladi (qurilma TTS'i zaxira).
 */
export const audioClips = pgTable("audio_clips", {
  id: serial("id").primaryKey(),
  /** sha256(voice + normalized text) — qarang: lib/audio-key.ts */
  textHash: text("text_hash").notNull().unique(),
  /** Diagnostika uchun asl matn (qaysi gap ekanini ko'rish oson bo'lsin). */
  text: text("text").notNull(),
  voice: text("voice").notNull().default(""),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Mashqqa xos murabbiy maslahatlari ("maslahat banki").
 *
 * Murabbiyning umumiy matnlari mavzuga bog'lanmagan: "For example… deb misol
 * qo'sh". Bu jadval o'sha o'rinni AYNAN shu mashq mavzusiga moslangan matn
 * bilan almashtiradi ("hayvon haqidagi misol keltir…").
 *
 * MUHIM: qaror qabul qilish qoidalarda qoladi — qaysi bosqich yetishmaganini
 * `Coach` o'zi aniqlaydi (offline, modelsiz), bu jadval faqat KO'RSATILADIGAN
 * MATNni beradi. Ball formulasiga ta'siri yo'q.
 *
 * `move` — `Coach` dagi harakat kaliti ("OPINION", "EXAMPLE", "REASON", …).
 * Yozuv yo'q bo'lsa umumiy matn ishlatiladi, ya'ni bank to'liq bo'lmasa ham
 * hech narsa buzilmaydi.
 */
export const exerciseTips = pgTable(
  "exercise_tips",
  {
    id: serial("id").primaryKey(),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    move: text("move").notNull(),
    title: text("title").notNull().default(""),
    detail: text("detail").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("exercise_tips_exercise_idx").on(t.exerciseId),
    unique("exercise_tips_exercise_move_unique").on(t.exerciseId, t.move),
  ],
);

/** Bitta qatorli meta jadval: joriy kontent versiyasi. */
export const appMeta = pgTable("app_meta", {
  id: integer("id").primaryKey().default(1),
  contentVersion: integer("content_version").notNull().default(1),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Panel foydalanuvchilari (admin / o'qituvchi). */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default("teacher"), // "admin" | "teacher"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** O'quvchilar (ilova device_id yoki login orqali). */
export const students = pgTable("students", {
  id: text("id").primaryKey(), // device_id yoki tayinlangan id
  name: text("name").notNull().default(""),
  classGroup: text("class_group").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Har bir mashq urinishi (progress). */
export const attempts = pgTable(
  "attempts",
  {
    id: serial("id").primaryKey(),
    studentId: text("student_id").notNull().default("anon"),
    moduleId: text("module_id").notNull().default(""),
    exerciseId: text("exercise_id").notNull().default(""),
    exerciseTitle: text("exercise_title").notNull().default(""),
    overallScore: integer("overall_score").notNull().default(0),
    grammarScore: integer("grammar_score"),
    wordsPerMinute: integer("words_per_minute").notNull().default(0),
    wordCount: integer("word_count").notNull().default(0),
    uniqueWordCount: integer("unique_word_count").notNull().default(0),
    durationSec: integer("duration_sec").notNull().default(0),
    keywordCoverage: integer("keyword_coverage").notNull().default(0),
    transcript: text("transcript").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("attempts_student_idx").on(t.studentId),
    index("attempts_created_idx").on(t.createdAt),
  ],
);
