package uz.speakingapp.data.model

import kotlinx.serialization.Serializable

/** Bir nutq turi moduli (Munozara, Rolli o'yin, Hikoya, Intervyu, Rasmli hikoya). */
@Serializable
data class SpeakingModule(
    val id: String,
    val type: String,
    val titleUz: String,
    val titleEn: String,
    val descriptionUz: String,
    val emoji: String,
    val exercises: List<Exercise> = emptyList(),
    val dialogs: List<DialogScenario> = emptyList(),
    /**
     * Erkin suhbatlar. Bo'sh standart — bu maydonni bilmaydigan eski kontent
     * JSON'i ham parse bo'lishi kerak.
     */
    val conversations: List<Conversation> = emptyList(),
)

/**
 * Erkin suhbat — tarmoqlanuvchi daraxt ("offline suhbatdosh").
 *
 * Suhbat davomida HECH QANDAY MODEL CHAQIRILMAYDI: butun daraxt oldindan
 * yaratilgan va kontent bilan birga keladi. Shu sababli suhbat internetsiz
 * ishlaydi, bir zumda javob beradi va bolaning nutqi qurilmadan chiqmaydi.
 */
@Serializable
data class Conversation(
    val id: String,
    val topic: String = "",
    val title: String,
    val characterName: String = "",
    val characterEmoji: String = "",
    /** Bolaga o'zbekcha vazifa: suhbatda nimaga erishish kerak. */
    val goalUz: String = "",
    val visuals: List<String> = emptyList(),
    /** Mo'ljallangan davomiylik — shu vaqt tugaganda [closingKey] ga o'tiladi. */
    val targetMinutes: Int = 3,
    val startKey: String = "start",
    val closingKey: String = "",
    val nodes: List<ConversationNode> = emptyList(),
) {
    private val byKey: Map<String, ConversationNode> by lazy { nodes.associateBy { it.nodeKey } }

    fun node(key: String): ConversationNode? = byKey[key]

    val startNode: ConversationNode? get() = node(startKey) ?: nodes.firstOrNull()
}

/**
 * Daraxtning bitta tuguni: personaj bir gap aytadi, bola javob beradi,
 * javobga qarab keyingi tugun tanlanadi.
 */
@Serializable
data class ConversationNode(
    val nodeKey: String,
    /** Personajning gapi (ingliz tilida) — TTS shuni aytadi. */
    val line: String = "",
    /** O'quvchiga o'zbekcha ko'rsatma. */
    val hintUz: String = "",
    val branches: List<ConversationBranch> = emptyList(),
    /** Hech bir tarmoq mos kelmaganda o'tiladigan tugun. */
    val fallbackKey: String = "",
    val isEnd: Boolean = false,
)

/**
 * Bitta tarmoq. [intent] — faqat nom (tahlil va nosozlikni izlash uchun),
 * tanlov [keywords] bo'yicha boradi.
 */
@Serializable
data class ConversationBranch(
    val intent: String = "",
    val keywords: List<String> = emptyList(),
    val nextKey: String,
)

/** Rolli o'yin / Intervyu senariysi (scripted dialog). */
@Serializable
data class DialogScenario(
    val id: String,
    val topic: String,
    val title: String,
    val visuals: List<String> = emptyList(),
    val mnemonic: Mnemonic,
    val characterName: String,
    val characterEmoji: String,
    val intro: String = "",
    val turns: List<DialogTurn>,
)

/**
 * Bitta almashish.
 * - Rolli o'yin: personaj avval [characterLine] ni aytadi, keyin o'quvchi javob beradi.
 * - Intervyu: o'quvchi [studentHint] bo'yicha savol beradi, keyin personaj [characterLine] (javob) ni aytadi.
 */
@Serializable
data class DialogTurn(
    val characterLine: String = "",
    val studentHint: String,
    val expectedKeywords: List<String> = emptyList(),
)

/** Bitta mashq (masalan "My Dream Pet"). */
@Serializable
data class Exercise(
    val id: String,
    val topic: String,
    val title: String,
    val mnemonic: Mnemonic,
    val prompts: List<String> = emptyList(),
    val keywords: List<String> = emptyList(),
    val timeLimitSec: Int = 60,
    /** Vizual ishoralar — emoji tokenlari (keyin haqiqiy rasm bilan almashtirilishi mumkin). */
    val visuals: List<String> = emptyList(),
    /**
     * Bo'sh bo'lmasa — mashq "Takrorlang" turiga o'tadi: bola aynan shu matnni
     * o'qiydi va aytilgan so'zlar so'zma-so'z solishtiriladi (qarang: ReadAloud).
     * Bo'sh bo'lsa — odatdagi erkin nutq mashqi.
     */
    val targetText: String = "",
    /**
     * Yaratilgan talaffuz audiosi URL'lari — [prompts] bilan INDEKS BO'YICHA
     * moslashadi (audio yo'q savol o'rnida bo'sh satr).
     *
     * Standart qiymat bo'sh: audio maydonlari yo'q eski kontent JSON'i ham
     * parse bo'lishi kerak (ilova yangi, kontent eski bo'lgan holat).
     */
    val promptsAudio: List<String> = emptyList(),
    /** "Takrorlang" matnining talaffuz audiosi; bo'sh bo'lsa [Speaker] TTS'i. */
    val targetAudioUrl: String = "",
    /**
     * Shu mashqqa moslangan murabbiy maslahatlari. Bo'sh yoki to'liq bo'lmasa
     * `Coach` umumiy matnlarni ishlatadi — hech narsa buzilmaydi.
     */
    val structureTips: List<StructureTip> = emptyList(),
) {
    val isReadAloud: Boolean get() = targetText.isNotBlank()

    /** Berilgan savol uchun audio URL (yo'q bo'lsa bo'sh satr). */
    fun promptAudioAt(index: Int): String = promptsAudio.getOrNull(index).orEmpty()
}

/** Mnemonik struktura (PETS, GREEN, OCEAN, ...). */
@Serializable
data class Mnemonic(
    val acronym: String,
    val steps: List<MnemonicStep>,
)

@Serializable
data class MnemonicStep(
    val letter: String,
    val en: String,
    val uz: String,
)

/**
 * Mashqqa xos murabbiy maslahati. [move] — `Coach` dagi harakat kaliti
 * ("OPINION", "EXAMPLE", …). Yozuv bo'lmasa `Coach` umumiy matnni ishlatadi.
 */
@Serializable
data class StructureTip(
    val move: String,
    val title: String = "",
    val detail: String = "",
)

/** Butun kontent to'plami (JSON ildizi). */
@Serializable
data class ContentPack(
    val version: Int,
    val modules: List<SpeakingModule>,
)
