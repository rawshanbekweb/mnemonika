// Qo'lda yozilgan erkin suhbat senariylarini bazaga yozadi (idempotent).
//
//   npm run db:conversations   — avval jadvallar
//   npm run seed:conversations — keyin shu fayl
//
// NIMA UCHUN QO'LDA: bu birinchi suhbat ham SINOV MA'LUMOTI, ham generator
// uchun USLUB NAMUNASI. `gen:tips` da o'rganilgan saboq: modelga "shunday yoz"
// deyishdan ko'ra tayyor namuna ko'rsatish ancha ishonchli.
//
// DARAXT TUZILISHI (muhim g'oya): daraxt chiziqli emas, "stansiyalar" ketma-ketligi —
// har mavzu tugagach suhbat keyingi umumiy tugunga (hub) qaytadi. Shu sababli
// 23 ta tugun bilan ham 1 daqiqalik ham, 5 daqiqalik ham suhbat chiqadi:
// vaqt tugaganda dvigatel `closingKey` ga o'tadi.
//
// KALIT SO'Z TANLASHDAGI TUZOQ: `KeywordMatcher` avval ODDIY QISM SATRNI
// qidiradi, ya'ni "read" so'zi "bread" va "already" ichida ham topiladi.
// Shuning uchun tarmoq kalit so'zlari sifatida qisqa va boshqa so'z ichiga
// kirib ketadigan so'zlar YOZILMAYDI ("read" emas, "reading").

import "../src/db/load-env";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";
import { validateTree } from "./conversation-tree";

type Node = {
  nodeKey: string;
  line: string;
  hintUz: string;
  branches?: { intent: string; keywords: string[]; nextKey: string }[];
  fallbackKey?: string;
  isEnd?: boolean;
};

type Conversation = {
  id: string;
  moduleId: string;
  topic: string;
  title: string;
  characterName: string;
  characterEmoji: string;
  goalUz: string;
  visuals: string[];
  targetMinutes: number;
  startKey: string;
  closingKey: string;
  nodes: Node[];
};

const FREE_TIME: Conversation = {
  id: "free_talk_ben_london",
  moduleId: "free_talk",
  topic: "Free Time and School",
  title: "Talking with Ben",
  characterName: "Ben (London'lik tengdoshing)",
  characterEmoji: "🧒",
  goalUz: "Ben bilan tanish, qiziqishlaring va maktabing haqida gapir, oxirida unga o'zing savol ber.",
  visuals: ["🇬🇧", "⚽", "🎸", "📚"],
  targetMinutes: 3,
  startKey: "start",
  closingKey: "closing",
  nodes: [
    {
      nodeKey: "start",
      line: "Hi! My name is Ben. I am eleven years old and I live in London. What is your name?",
      hintUz: 'Salomlash va ismingni ayt: "Hello! My name is …"',
      fallbackKey: "ask_hobby",
    },
    {
      nodeKey: "ask_hobby",
      line: "Nice to meet you! Tell me, what do you like doing in your free time?",
      hintUz: 'Bo\'sh vaqtingda nima qilishni yoqtirasan? "I like …" deb boshla.',
      branches: [
        {
          intent: "sport",
          keywords: ["sport", "football", "basketball", "swimming", "tennis", "volleyball", "running"],
          nextKey: "sport_1",
        },
        {
          intent: "music",
          keywords: ["music", "guitar", "piano", "singing", "dancing", "songs"],
          nextKey: "music_1",
        },
        {
          intent: "books",
          keywords: ["books", "reading", "story", "library"],
          nextKey: "book_1",
        },
        {
          intent: "games",
          keywords: ["computer", "games", "video", "phone", "internet", "tablet"],
          nextKey: "games_1",
        },
      ],
      fallbackKey: "hobby_repeat",
    },
    {
      nodeKey: "hobby_repeat",
      line: "Sorry, I did not hear you well. Do you like sport, music, books or computer games?",
      hintUz: "Yana bir marta ayt — sport, musiqa, kitob yoki kompyuter o'yinlari.",
      branches: [
        { intent: "sport", keywords: ["sport", "football", "basketball", "swimming"], nextKey: "sport_1" },
        { intent: "music", keywords: ["music", "guitar", "piano", "singing"], nextKey: "music_1" },
        { intent: "books", keywords: ["books", "reading", "story"], nextKey: "book_1" },
        { intent: "games", keywords: ["computer", "games", "video", "phone"], nextKey: "games_1" },
      ],
      // Ikkinchi marta ham tushunmasak, suhbatni to'xtatmaymiz — keyingi
      // mavzuga o'tamiz. Aks holda bola shu yerda qamalib qolardi.
      fallbackKey: "hub_weekend",
    },

    {
      nodeKey: "sport_1",
      line: "That is great! I play football every Saturday. How often do you do sport?",
      hintUz: 'Qanchalik tez-tez? "I play football every day" kabi javob ber.',
      fallbackKey: "sport_2",
    },
    {
      nodeKey: "sport_2",
      line: "Sport is really good for our health. Do you play with your friends or alone?",
      hintUz: 'Do\'stlaring bilanmi? Sababini ham qo\'sh: "because …"',
      fallbackKey: "hub_weekend",
    },
    {
      nodeKey: "music_1",
      line: "Wonderful! I play the guitar a little. What is your favourite song?",
      hintUz: "Sevimli qo'shiging yoki qo'shiqchingni ayt.",
      fallbackKey: "music_2",
    },
    {
      nodeKey: "music_2",
      line: "Nice choice! Do you listen to music when you do your homework?",
      hintUz: 'Dars qilayotganda musiqa eshitasanmi? "Yes, because …"',
      fallbackKey: "hub_weekend",
    },
    {
      nodeKey: "book_1",
      line: "I love books too! What book are you reading now?",
      hintUz: "Hozir qanday kitob o'qiyapsan?",
      fallbackKey: "book_2",
    },
    {
      nodeKey: "book_2",
      line: "That sounds interesting. Do you prefer paper books or reading on a phone?",
      hintUz: "Qog'oz kitobmi yoki telefonda? Sababini ayt.",
      fallbackKey: "hub_weekend",
    },
    {
      nodeKey: "games_1",
      line: "I see! What game do you play the most?",
      hintUz: "Ko'proq qaysi o'yinni o'ynaysan?",
      fallbackKey: "games_2",
    },
    {
      nodeKey: "games_2",
      line: "Interesting. How much time do you spend on the computer every day?",
      hintUz: 'Kuniga qancha vaqt? "About one hour" kabi ayt.',
      fallbackKey: "hub_weekend",
    },

    {
      nodeKey: "hub_weekend",
      line: "Let me ask you about last weekend. What did you do on Sunday?",
      hintUz: 'O\'tgan zamonda ayt: "I went …", "I played …", "I watched …"',
      branches: [
        {
          intent: "family",
          keywords: ["family", "mother", "father", "parents", "grandmother", "brother", "sister"],
          nextKey: "weekend_family",
        },
        {
          intent: "outside",
          keywords: ["park", "outside", "street", "walked", "village", "mountains", "garden"],
          nextKey: "weekend_outside",
        },
        {
          intent: "home",
          keywords: ["watched", "television", "slept", "rested", "cartoon"],
          nextKey: "weekend_home",
        },
      ],
      fallbackKey: "weekend_home",
    },
    {
      nodeKey: "weekend_family",
      line: "Family time is the best. What did you eat together?",
      hintUz: "Qanday taom yedinglar?",
      fallbackKey: "hub_school",
    },
    {
      nodeKey: "weekend_outside",
      line: "That sounds fun! Was the weather good on that day?",
      hintUz: "Ob-havo qanday edi? \"It was sunny/rainy/cold\".",
      fallbackKey: "hub_school",
    },
    {
      nodeKey: "weekend_home",
      line: "A calm weekend is also nice. What did you watch or read at home?",
      hintUz: "Uyda nima qilding?",
      fallbackKey: "hub_school",
    },

    {
      nodeKey: "hub_school",
      line: "Now tell me about your school. What is your favourite subject?",
      hintUz: 'Sevimli faning qaysi? "My favourite subject is …"',
      branches: [
        { intent: "english", keywords: ["english", "language", "foreign"], nextKey: "subject_english" },
        {
          intent: "science",
          keywords: ["maths", "mathematics", "science", "physics", "biology", "chemistry"],
          nextKey: "subject_science",
        },
        {
          intent: "other",
          keywords: ["history", "geography", "drawing", "literature", "informatics"],
          nextKey: "subject_other",
        },
      ],
      fallbackKey: "subject_other",
    },
    {
      nodeKey: "subject_english",
      line: "English is my favourite lesson too! Why do you like it?",
      hintUz: 'Nega yoqtirasan? "because" bilan tushuntir.',
      fallbackKey: "ask_question",
    },
    {
      nodeKey: "subject_science",
      line: "Wow, that is a difficult subject. Is it hard for you?",
      hintUz: "Qiyinmi yoki osonmi? Sababini ayt.",
      fallbackKey: "ask_question",
    },
    {
      nodeKey: "subject_other",
      line: "Good choice. What do you usually do in that lesson?",
      hintUz: "O'sha darsda nima qilasizlar?",
      fallbackKey: "ask_question",
    },

    {
      nodeKey: "ask_question",
      line: "Now it is your turn. Ask me a question about London or about me!",
      hintUz: 'Endi SEN savol ber! Masalan: "What is the weather like in London?"',
      branches: [
        {
          // Savol bergani signal so'zlardan bilinadi — bu Coach'dagi usulning
          // aynan o'zi (imtihonda ham aynan shu iboralar baholanadi).
          intent: "asked_question",
          keywords: ["what", "where", "when", "which", "how", "why", "do you", "are you", "can you", "have you"],
          nextKey: "answer_question",
        },
      ],
      fallbackKey: "answer_hint",
    },
    {
      nodeKey: "answer_hint",
      line: "You can ask me anything. For example: What is the weather like in London?",
      hintUz: 'Savolni shunday boshla: "What …?" yoki "Do you …?"',
      branches: [
        {
          intent: "asked_question",
          keywords: ["what", "where", "when", "which", "how", "why", "do you", "are you", "can you"],
          nextKey: "answer_question",
        },
      ],
      fallbackKey: "closing",
    },
    {
      nodeKey: "answer_question",
      line: "Good question! London is big and often rainy, but I love it. My favourite place is Hyde Park.",
      hintUz: "Ben javob berdi — fikringni ayt yoki yana bir savol ber.",
      fallbackKey: "closing",
    },

    {
      nodeKey: "closing",
      line: "It was really nice talking to you today. Thank you and see you next time. Goodbye!",
      hintUz: 'Xayrlash: "Goodbye! It was nice to talk to you."',
      isEnd: true,
    },
  ],
};

const ALL: Conversation[] = [FREE_TIME];

/**
 * Tekshiruv generator bilan BIR XIL kod orqali boradi (`conversation-tree.ts`) —
 * qo'lda yozilgan daraxtga qo'yiladigan talab yaratilganidan past bo'lmasin.
 */
function validate(c: Conversation): string[] {
  return validateTree({
    startKey: c.startKey,
    closingKey: c.closingKey,
    nodes: c.nodes.map((n) => ({
      nodeKey: n.nodeKey,
      line: n.line,
      hintUz: n.hintUz,
      branches: n.branches ?? [],
      fallbackKey: n.fallbackKey ?? "",
      isEnd: n.isEnd ?? false,
    })),
  });
}

async function main() {
  const [module] = await db
    .select()
    .from(schema.modules)
    .where(eq(schema.modules.id, "free_talk"));
  if (!module) {
    console.error('"free_talk" moduli yo\'q. Avval: npm run db:conversations');
    process.exit(1);
  }

  for (const c of ALL) {
    const problems = validate(c);
    if (problems.length > 0) {
      console.error(`${c.id} daraxti noto'g'ri:\n  ${problems.join("\n  ")}`);
      process.exit(1);
    }
  }

  let order = 0;
  for (const c of ALL) {
    const values = {
      moduleId: c.moduleId,
      topic: c.topic,
      title: c.title,
      characterName: c.characterName,
      characterEmoji: c.characterEmoji,
      goalUz: c.goalUz,
      visuals: c.visuals,
      targetMinutes: c.targetMinutes,
      startKey: c.startKey,
      closingKey: c.closingKey,
    };
    await db
      .insert(schema.conversations)
      .values({ id: c.id, sortOrder: order++, ...values })
      .onConflictDoUpdate({ target: schema.conversations.id, set: values });

    // Tugunlar to'liq almashtiriladi — qisman yangilash daraxtda yetim
    // tugunlar qoldirardi.
    await db.delete(schema.conversationNodes).where(eq(schema.conversationNodes.conversationId, c.id));
    let nodeOrder = 0;
    for (const n of c.nodes) {
      await db.insert(schema.conversationNodes).values({
        conversationId: c.id,
        nodeKey: n.nodeKey,
        line: n.line,
        hintUz: n.hintUz,
        branches: n.branches ?? [],
        fallbackKey: n.fallbackKey ?? "",
        isEnd: n.isEnd ?? false,
        sortOrder: nodeOrder++,
      });
    }
    console.log(`✓ ${c.id}: ${c.nodes.length} tugun`);
  }

  console.log(`\nTayyor: ${ALL.length} ta suhbat. Endi admin panelida "Publish".`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
