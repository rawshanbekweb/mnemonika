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
)

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
