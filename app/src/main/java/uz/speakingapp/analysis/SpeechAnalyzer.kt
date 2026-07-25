package uz.speakingapp.analysis

/** Nutq tahlili natijasi (bepul, mahalliy hisoblanadi). */
data class SpeechResult(
    val transcript: String,
    val wordCount: Int,
    val uniqueWordCount: Int,
    val durationSec: Int,
    val wordsPerMinute: Int,
    val matchedKeywords: List<String>,
    val totalKeywords: Int,
    val overallScore: Int,
    val feedback: List<String>,
    val grammarScore: Int? = null,
    val grammarIssues: List<String> = emptyList(),
) {
    val keywordCoverage: Int
        get() = if (totalKeywords == 0) 0 else (matchedKeywords.size * 100 / totalKeywords)
}

/**
 * Transkript va davomiylikdan bepul metrikalarni hisoblaydi:
 * so'z boyligi, ravonlik (WPM), kalit so'z qamrovi va umumiy ball.
 * (Grammatika tekshiruvi — Bosqich 2, LanguageTool.)
 */
object SpeechAnalyzer {

    /** Grammatika hisobotini natijaga qo'shadi va umumiy ballni qayta hisoblaydi. */
    fun withGrammar(result: SpeechResult, report: GrammarReport): SpeechResult {
        val newOverall = ((result.overallScore * 4 + report.score) / 5).coerceIn(0, 100)
        val feedback = result.feedback.toMutableList()
        feedback.add(
            if (report.issueCount == 0) "Grammatik xatolar topilmadi — juda yaxshi!"
            else "Grammatikada ${report.issueCount} ta e'tibor talab qiladigan joy bor."
        )
        return result.copy(
            overallScore = newOverall,
            grammarScore = report.score,
            grammarIssues = report.issues,
            feedback = feedback,
        )
    }

    /**
     * @param alternatives tanigichning qo'shimcha variantlari — FAQAT kalit so'z
     *   qidirishda ishlatiladi. So'z soni va tezlik asosiy transkriptdan olinadi,
     *   aks holda variantlar so'zlarni ikki marta sanab yuborardi.
     */
    fun analyze(
        transcript: String,
        durationSec: Int,
        keywords: List<String>,
        alternatives: List<String> = emptyList(),
    ): SpeechResult {
        val words = transcript
            .lowercase()
            .split(Regex("[^\\p{L}']+"))
            .filter { it.isNotBlank() }

        val wordCount = words.size
        val uniqueWordCount = words.toSet().size
        val safeDuration = durationSec.coerceAtLeast(1)
        val wpm = (wordCount * 60.0 / safeDuration).toInt()

        // ASR xatolariga chidamli solishtirish (qarang: KeywordMatcher).
        val matched = KeywordMatcher.matched(transcript, keywords, alternatives)

        val fluencyScore = fluencyScore(wpm)
        val vocabScore = vocabScore(uniqueWordCount)
        val keywordScore =
            if (keywords.isEmpty()) 100 else matched.size * 100 / keywords.size
        val lengthScore = lengthScore(wordCount)

        val overall = ((fluencyScore + vocabScore + keywordScore + lengthScore) / 4)
            .coerceIn(0, 100)

        return SpeechResult(
            transcript = transcript.trim(),
            wordCount = wordCount,
            uniqueWordCount = uniqueWordCount,
            durationSec = durationSec,
            wordsPerMinute = wpm,
            matchedKeywords = matched,
            totalKeywords = keywords.size,
            overallScore = overall,
            feedback = buildFeedback(wpm, wordCount, uniqueWordCount, matched, keywords),
        )
    }

    // 5-6 sinf uchun ~60-110 wpm yaxshi oraliq
    private fun fluencyScore(wpm: Int): Int = when {
        wpm >= 90 -> 100
        wpm >= 60 -> 80
        wpm >= 40 -> 60
        wpm >= 20 -> 40
        else -> 20
    }

    private fun vocabScore(unique: Int): Int = when {
        unique >= 40 -> 100
        unique >= 25 -> 80
        unique >= 15 -> 60
        unique >= 8 -> 40
        else -> 20
    }

    private fun lengthScore(words: Int): Int = when {
        words >= 60 -> 100
        words >= 40 -> 80
        words >= 25 -> 60
        words >= 12 -> 40
        else -> 20
    }

    private fun buildFeedback(
        wpm: Int,
        words: Int,
        unique: Int,
        matched: List<String>,
        keywords: List<String>,
    ): List<String> {
        val tips = mutableListOf<String>()

        if (words < 25) {
            tips.add("Ko'proq gapirishga harakat qiling — hikoyangizni kengaytiring.")
        } else {
            tips.add("Yaxshi! Yetarlicha gapirdingiz ($words so'z).")
        }

        when {
            wpm < 40 -> tips.add("Biroz tezroq va ravonroq gapirishga urinib ko'ring.")
            wpm > 140 -> tips.add("Sekinroq gapiring — har bir so'z aniq eshitilsin.")
            else -> tips.add("Nutq tezligingiz yaxshi ($wpm so'z/daqiqa).")
        }

        if (unique < 15) {
            tips.add("Turli xil so'zlardan foydalaning — so'z boyligini oshiring.")
        }

        val missing = keywords.filter { it !in matched }
        if (missing.isNotEmpty()) {
            tips.add("Bu so'zlarni ham qo'shsangiz bo'lardi: ${missing.joinToString(", ")}.")
        } else if (keywords.isNotEmpty()) {
            tips.add("Barcha tavsiya etilgan kalit so'zlarni ishlatdingiz!")
        }

        return tips
    }
}
