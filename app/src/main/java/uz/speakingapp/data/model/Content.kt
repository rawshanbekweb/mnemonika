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

/** Butun kontent to'plami (JSON ildizi). */
@Serializable
data class ContentPack(
    val version: Int,
    val modules: List<SpeakingModule>,
)
