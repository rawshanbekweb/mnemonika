package uz.speakingapp.analysis

/**
 * "Takrorlang" mashqi: bola ekrandagi jumlani o'qiydi.
 *
 * Nega bu alohida turadi: erkin nutqda biz bola nima demoqchi bo'lganini
 * bilmaymiz, shuning uchun talaffuzni baholay olmaymiz. Bu yerda kutilgan matn
 * OLDINDAN MA'LUM — demak har bir so'zni solishtirib, haqiqiy aniqlik
 * foizini chiqarish mumkin. Loyihadagi yagona o'lchanadigan talaffuz bahosi
 * shu (Vosk confidence taxminiy edi).
 *
 * Web'dagi `lib/read-aloud.ts` shu faylning aynan porti — **doim birga
 * o'zgartiriladi** (`scripts/read-aloud.test.ts`).
 */

enum class WordStatus { CORRECT, MISSED }

/** Kutilgan matnning bitta so'zi va uning holati. */
data class ReadWord(val word: String, val status: WordStatus)

data class ReadAloudResult(
    val words: List<ReadWord>,
    val correctCount: Int,
    val targetCount: Int,
    /** Matnda yo'q, lekin aytilgan so'zlar soni. */
    val extraCount: Int,
    val accuracy: Int,
    val tips: List<CoachTip>,
)

object ReadAloud {

    /** Juda uzun kirishda DP jadvali kattalashib ketmasligi uchun chegara. */
    private const val MAX_WORDS = 200

    /**
     * @param alternatives tanigichning boshqa variantlari. Birinchi solishtirishda
     *   topilmagan so'z shu variantlarning birida bo'lsa — TO'G'RI hisoblanadi.
     *   Sabab KeywordMatcher'dagi bilan bir xil: tanigichning noaniqligi bolaning
     *   xatosiga aylanmasligi kerak.
     */
    fun analyze(
        targetText: String,
        transcript: String,
        durationSec: Int,
        alternatives: List<String> = emptyList(),
    ): ReadAloudResult {
        val target = splitWords(targetText).take(MAX_WORDS)
        val spoken = splitWords(transcript).take(MAX_WORDS)

        if (target.isEmpty()) {
            return ReadAloudResult(emptyList(), 0, 0, 0, 0, emptyList())
        }

        val (statuses, extras) = align(target, spoken)

        // Ikkinchi bosqich: topilmagan so'z tanigichning boshqa variantida bormi?
        val altWords = alternatives.flatMap { splitWords(it) }.toSet()
        for (i in statuses.indices) {
            if (statuses[i] == WordStatus.MISSED && target[i] in altWords) {
                statuses[i] = WordStatus.CORRECT
            }
        }

        val words = target.mapIndexed { i, w -> ReadWord(w, statuses[i]) }
        val correct = statuses.count { it == WordStatus.CORRECT }
        val accuracy = correct * 100 / target.size
        val wpm = spoken.size * 60 / durationSec.coerceAtLeast(1)

        return ReadAloudResult(
            words = words,
            correctCount = correct,
            targetCount = target.size,
            extraCount = extras,
            accuracy = accuracy,
            tips = tips(accuracy, words, extras, wpm),
        )
    }

    /** SpeechAnalyzer va Coach'dagi bo'lish bilan bir xil bo'lishi shart. */
    private fun splitWords(text: String): List<String> =
        text.lowercase().split(Regex("[^\\p{L}']+")).filter { it.isNotBlank() }

    /**
     * Kutilgan va aytilgan so'z ketma-ketligini tekislaydi (so'z darajasidagi
     * Levenshtein). Qaytaradi: har bir kutilgan so'zning holati + ortiqcha
     * aytilgan so'zlar soni.
     *
     * Teng variantlar bo'lganda tanlov tartibi QAT'IY (moslik → almashtirish →
     * tushirish → qo'shish), aks holda Kotlin va TS turli natija berardi.
     */
    private fun align(target: List<String>, spoken: List<String>): Pair<MutableList<WordStatus>, Int> {
        val n = target.size
        val m = spoken.size
        val d = Array(n + 1) { IntArray(m + 1) }
        for (i in 0..n) d[i][0] = i
        for (j in 0..m) d[0][j] = j

        for (i in 1..n) {
            for (j in 1..m) {
                val cost = if (target[i - 1] == spoken[j - 1]) 0 else 1
                d[i][j] = minOf(
                    d[i - 1][j - 1] + cost,
                    d[i - 1][j] + 1,
                    d[i][j - 1] + 1,
                )
            }
        }

        val statuses = MutableList(n) { WordStatus.MISSED }
        var extras = 0
        var i = n
        var j = m
        while (i > 0 || j > 0) {
            when {
                i > 0 && j > 0 && target[i - 1] == spoken[j - 1] && d[i][j] == d[i - 1][j - 1] -> {
                    statuses[i - 1] = WordStatus.CORRECT
                    i--; j--
                }
                i > 0 && j > 0 && d[i][j] == d[i - 1][j - 1] + 1 -> { i--; j-- } // almashtirilgan
                i > 0 && d[i][j] == d[i - 1][j] + 1 -> i--                        // aytilmagan
                else -> { extras++; j-- }                                          // ortiqcha
            }
        }
        return statuses to extras
    }

    private fun tips(accuracy: Int, words: List<ReadWord>, extras: Int, wpm: Int): List<CoachTip> {
        val out = mutableListOf<CoachTip>()

        out.add(
            CoachTip(
                TipKind.PRAISE,
                "Yaxshi tomoni",
                when {
                    accuracy >= 90 -> "Deyarli mukammal o'qiding — $accuracy% to'g'ri!"
                    accuracy >= 70 -> "Yaxshi o'qiding — $accuracy% to'g'ri."
                    accuracy >= 40 -> "Yarmidan ko'pini to'g'ri o'qiding. Yana bir marta urinib ko'r."
                    else -> "Boshlash qiyin — matnni sekin, so'zma-so'z o'qib ko'r."
                },
            )
        )

        val missed = words.filter { it.status == WordStatus.MISSED }.map { it.word }
        if (missed.isNotEmpty()) {
            out.add(
                CoachTip(
                    TipKind.STRUCTURE,
                    "Qiynalgan so'zlar",
                    "Bu so'zlarni qaytadan ayt: ${missed.take(4).joinToString(", ")}.",
                )
            )
        }

        if (extras >= 3) {
            out.add(
                CoachTip(
                    TipKind.HABIT,
                    "Faqat matnni o'qi",
                    "Matnda yo'q so'zlar qo'shding — ekranda yozilganini aynan o'qishga harakat qil.",
                )
            )
        }

        if (wpm in 1..49) {
            out.add(CoachTip(TipKind.FLUENCY, "Tezlik", "Biroz tezroq o'qi — so'zlar orasida uzoq to'xtama."))
        } else if (wpm > 160) {
            out.add(CoachTip(TipKind.FLUENCY, "Tezlik", "Sekinroq o'qi — shoshilsang so'zlar tushib qoladi."))
        }

        return out
    }
}
