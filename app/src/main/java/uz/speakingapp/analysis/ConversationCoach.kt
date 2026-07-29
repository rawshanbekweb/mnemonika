package uz.speakingapp.analysis

/**
 * Suhbat tugagandan keyingi tahlil — butun suhbat bo'yicha, bitta javob emas.
 *
 * Model chaqirilmaydi: bola nutqining transkripti qurilmadan chiqmaydi.
 * Barcha o'lchovlar matndan hisoblanadi.
 *
 * `Coach` bilan farqi: u BITTA javobning mnemonika strukturasini tekshiradi,
 * bu esa SUHBAT ko'nikmalarini — tushunarli gapirish, javoblarni kengaytirish,
 * savol berish, xushmuomalalik.
 */

/** Suhbatdagi bitta javob. */
data class ConversationTurn(
    val nodeKey: String,
    val transcript: String,
    /** Dvigatel tarmoqni topdimi (ya'ni javob mavzuga tushdimi). */
    val understood: Boolean,
    val durationSec: Int,
)

data class ConversationResult(
    val score: Int,
    /** Dastur tushungan javoblar ulushi — "meni tushunishdi" o'lchovi. */
    val understoodPercent: Int,
    val turnCount: Int,
    val wordCount: Int,
    val uniqueWordCount: Int,
    val wordsPerMinute: Int,
    val speakingSec: Int,
    val askedQuestion: Boolean,
    val wasPolite: Boolean,
    val transcript: String,
    val tips: List<CoachTip>,
)

object ConversationCoach {

    /** Bir javobda kutilgan o'rtacha so'z soni (A2 daraja, 20–40 soniyalik navbat). */
    private const val TARGET_WORDS_PER_TURN = 10

    /** To'liq ball uchun yetarli har xil so'z soni. */
    private const val TARGET_UNIQUE_WORDS = 40

    private const val MAX_TIPS = 3

    /** Savol berganini bildiruvchi signal iboralar (Coach'dagi usulning o'zi). */
    private val QUESTION_CUES = listOf(
        "what", "where", "when", "which", "why", "how",
        "do you", "are you", "can you", "have you", "did you", "is it",
    )

    /** Xushmuomalalik signal iboralari. */
    private val POLITE_CUES = listOf(
        "hello", "hi", "nice to meet", "thank", "thanks", "please",
        "goodbye", "bye", "see you", "sorry",
    )

    /** `SpeechAnalyzer` va `Coach` dagi bo'lish bilan bir xil bo'lishi shart. */
    private fun splitWords(text: String): List<String> =
        text.lowercase().split(Regex("[^\\p{L}']+")).filter { it.isNotBlank() }

    fun analyze(turns: List<ConversationTurn>): ConversationResult {
        val spoken = turns.filter { it.transcript.isNotBlank() }
        val transcript = spoken.joinToString(" ") { it.transcript.trim() }
        val words = splitWords(transcript)
        val wordCount = words.size
        val uniqueWordCount = words.toSet().size
        val speakingSec = turns.sumOf { it.durationSec }
        val wordsPerMinute = if (speakingSec <= 0) 0 else wordCount * 60 / speakingSec

        val understoodCount = turns.count { it.understood }
        val understoodPercent = if (turns.isEmpty()) 0 else understoodCount * 100 / turns.size

        val hay = " " + words.joinToString(" ") + " "
        val askedQuestion = QUESTION_CUES.any { hay.contains(" $it ") }
        val wasPolite = POLITE_CUES.any { hay.contains(" $it ") }

        val score = score(
            understoodPercent = understoodPercent,
            turnCount = turns.size,
            wordCount = wordCount,
            uniqueWordCount = uniqueWordCount,
            wordsPerMinute = wordsPerMinute,
        )

        return ConversationResult(
            score = score,
            understoodPercent = understoodPercent,
            turnCount = turns.size,
            wordCount = wordCount,
            uniqueWordCount = uniqueWordCount,
            wordsPerMinute = wordsPerMinute,
            speakingSec = speakingSec,
            askedQuestion = askedQuestion,
            wasPolite = wasPolite,
            transcript = transcript,
            tips = tips(
                understoodPercent = understoodPercent,
                turnCount = turns.size,
                wordCount = wordCount,
                uniqueWordCount = uniqueWordCount,
                wordsPerMinute = wordsPerMinute,
                askedQuestion = askedQuestion,
                wasPolite = wasPolite,
            ),
        )
    }

    /**
     * Umumiy ball (0–100). Mashqlardagi formuladan ATAYLAB alohida — suhbatda
     * kalit so'z qamrovi va mnemonika yo'q, o'lchanadigan narsalar boshqa.
     * (Mashq balliga tegilmagan: eski urinishlar bilan taqqoslash buzilmasin.)
     *
     *  40 — tushunarlilik: dastur javobni mavzuga bog'lay oldimi;
     *  25 — ishtirok: javoblar qanchalik to'liq (navbatiga ~10 so'z);
     *  20 — ravonlik: 60–120 so'z/daqiqa oralig'i;
     *  15 — so'z boyligi: har xil so'zlar soni.
     */
    private fun score(
        understoodPercent: Int,
        turnCount: Int,
        wordCount: Int,
        uniqueWordCount: Int,
        wordsPerMinute: Int,
    ): Int {
        if (turnCount == 0) return 0

        val understanding = understoodPercent * 40 / 100

        val expectedWords = turnCount * TARGET_WORDS_PER_TURN
        val participation = if (expectedWords <= 0) 0 else minOf(wordCount * 25 / expectedWords, 25)

        val fluency = when {
            wordsPerMinute in 60..120 -> 20
            wordsPerMinute in 40..59 || wordsPerMinute in 121..150 -> 13
            wordsPerMinute > 0 -> 6
            else -> 0
        }

        val vocabulary = minOf(uniqueWordCount * 15 / TARGET_UNIQUE_WORDS, 15)

        return minOf(understanding + participation + fluency + vocabulary, 100)
    }

    private fun tips(
        understoodPercent: Int,
        turnCount: Int,
        wordCount: Int,
        uniqueWordCount: Int,
        wordsPerMinute: Int,
        askedQuestion: Boolean,
        wasPolite: Boolean,
    ): List<CoachTip> {
        val out = mutableListOf(praise(understoodPercent, turnCount, wordCount, askedQuestion))
        val ranked = mutableListOf<CoachTip>()

        // 1) Tushunarlilik — suhbatdagi eng muhim ko'nikma.
        if (turnCount > 0 && understoodPercent < 60) {
            ranked.add(
                CoachTip(
                    TipKind.KEYWORDS,
                    "Mavzudan gapir",
                    "Savolga tegishli so'zlarni ishlat — suhbatdoshing seni shunda tushunadi.",
                )
            )
        }

        // 2) Javob uzunligi
        val perTurn = if (turnCount == 0) 0 else wordCount / turnCount
        if (perTurn < 6) {
            ranked.add(
                CoachTip(
                    TipKind.LENGTH,
                    "Kengaytir",
                    "Javoblaring qisqa (navbatiga ~$perTurn so'z). Har javobga bitta sabab qo'sh.",
                )
            )
        }

        // 3) Savol berish — suhbat ikki tomonlama bo'lishi kerak.
        if (!askedQuestion) {
            ranked.add(
                CoachTip(
                    TipKind.STRUCTURE,
                    "Savol ber",
                    "Sen ham savol ber: \"What about you?\" yoki \"Do you like…?\"",
                )
            )
        }

        // 4) Xushmuomalalik
        if (!wasPolite) {
            ranked.add(
                CoachTip(
                    TipKind.HABIT,
                    "Xushmuomalalik",
                    "Suhbatni \"Hello!\" bilan boshla va \"Thank you. Goodbye!\" bilan tugat.",
                )
            )
        }

        // 5) Tezlik
        if (wordsPerMinute in 1..39) {
            ranked.add(CoachTip(TipKind.FLUENCY, "Tezlik", "Biroz tezroq gapir — uzoq to'xtamaslikka harakat qil."))
        } else if (wordsPerMinute > 140) {
            ranked.add(CoachTip(TipKind.FLUENCY, "Tezlik", "Sekinroq gapir — har bir so'z aniq eshitilsin."))
        }

        // 6) So'z boyligi
        if (uniqueWordCount < 20) {
            ranked.add(
                CoachTip(
                    TipKind.VOCABULARY,
                    "So'z boyligi",
                    "Turli xil so'zlardan foydalan — bir xil so'zlarni takrorlama.",
                )
            )
        }

        // Bola bir vaqtda 3 tadan ko'p narsani tuzata olmaydi (Coach bilan bir xil qoida).
        out.addAll(ranked.take(MAX_TIPS))
        return out
    }

    private fun praise(
        understoodPercent: Int,
        turnCount: Int,
        wordCount: Int,
        askedQuestion: Boolean,
    ): CoachTip {
        val detail = when {
            turnCount == 0 -> "Suhbatni boshlaganing ham yaxshi — keyingi safar gapirib ko'r."
            understoodPercent >= 80 -> "Suhbatdoshing seni deyarli har safar tushundi — zo'r!"
            askedQuestion -> "O'zing ham savol berding — haqiqiy suhbat shunday bo'ladi!"
            wordCount >= 60 -> "Suhbat davomida $wordCount ta so'z aytding — juda yaxshi!"
            else -> "Suhbatni oxirigacha olib bording — har safar yaxshilanadi."
        }
        return CoachTip(TipKind.PRAISE, "Yaxshi tomoni", detail)
    }
}
