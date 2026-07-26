package uz.speakingapp.analysis

/**
 * Qoidaga asoslangan "murabbiy" — transkriptdan bolaga AYNAN nima qilish
 * kerakligini aytadi. Model ham, internet ham kerak emas.
 *
 * MUHIM PEDAGOGIK QAROR: biz bolaning misol keltirgan-keltirmaganini bila
 * olmaymiz — buni aniqlash uchun tilni tushunadigan model kerak. Biz faqat
 * **signal iboralarni** (for example, because, I think…) qidiramiz va tavsiyani
 * ayblov emas, o'rgatish sifatida beramiz: "'for example' deb boshlab ko'r".
 * Bola misolni ibora ishlatmasdan aytgan bo'lsa ham, bu maslahat noto'g'ri
 * bo'lmaydi — imtihonda aynan shu signal iboralar baholanadi.
 *
 * Web'dagi `lib/coach.ts` shu faylning aynan porti. **Ikkalasi doim birga
 * o'zgartirilishi shart** (qarang: `scripts/coach.test.ts`).
 */

enum class TipKind { PRAISE, STRUCTURE, KEYWORDS, LENGTH, FLUENCY, VOCABULARY, HABIT, GRAMMAR }

/** Bitta maslahat. `title` — qisqa sarlavha, `detail` — bir gaplik tavsiya. */
data class CoachTip(val kind: TipKind, val title: String, val detail: String)

/** Transkriptdan aniqlab bo'ladigan "nutq harakatlari". */
private enum class Move { OPINION, EXAMPLE, REASON, OTHERS, SUMMARY, SEQUENCE, EMOTION, PLACE, DESCRIBE }

object Coach {

    /**
     * @param mnemonicSteps mnemonika bosqichlarining inglizcha nomlari
     *   (masalan PETS uchun ["Position", "Example", ...]). Bo'sh bo'lsa
     *   struktura tekshirilmaydi.
     */
    fun tips(
        transcript: String,
        wordCount: Int,
        uniqueWordCount: Int,
        wordsPerMinute: Int,
        matchedKeywords: List<String>,
        keywords: List<String>,
        mnemonicSteps: List<String>,
    ): List<CoachTip> {
        val words = splitWords(transcript)
        // Iboralarni so'z chegarasi bilan qidirish uchun bo'shliq bilan o'raymiz.
        val hay = " " + words.joinToString(" ") + " "

        val out = mutableListOf<CoachTip>()
        out.add(praise(wordCount, wordsPerMinute, matchedKeywords, keywords, mnemonicSteps, hay))

        val ranked = mutableListOf<CoachTip>()

        // 1) Struktura — eng muhimi. Faqat BITTA yetishmagan bosqich aytiladi,
        // aks holda bola bir vaqtda 4 ta narsani tuzatishga urinadi.
        firstMissingMove(mnemonicSteps, hay)?.let { ranked.add(moveTip(it)) }

        // 2) Kalit so'zlar
        val missing = keywords.filter { it !in matchedKeywords }
        if (missing.isNotEmpty()) {
            val shown = missing.take(3).joinToString(", ")
            ranked.add(
                CoachTip(
                    TipKind.KEYWORDS,
                    "Kalit so'zlar",
                    "Bu so'zlarni ham ishlatib ko'r: $shown.",
                )
            )
        }

        // 3) Uzunlik
        if (wordCount < 25) {
            ranked.add(
                CoachTip(
                    TipKind.LENGTH,
                    "Kengaytir",
                    "Javobing qisqa ($wordCount so'z). Har bir fikringga bittadan gap qo'shib ko'r.",
                )
            )
        }

        // 4) Odatlar: to'ldiruvchi so'zlar va takrorlash
        val fillers = countFillers(words)
        if (fillers >= 3) {
            ranked.add(
                CoachTip(
                    TipKind.HABIT,
                    "To'xtashlar",
                    "\"um\", \"uh\" kabi tovushlarni $fillers marta ishlatding — o'rniga bir soniya jim tur.",
                )
            )
        }
        overusedWord(words, wordCount)?.let {
            ranked.add(
                CoachTip(
                    TipKind.VOCABULARY,
                    "Takrorlash",
                    "\"$it\" so'zini juda ko'p takrorlading — unga sinonim topib ko'r.",
                )
            )
        }
        if (wordCount >= 12 && !hasConnector(hay)) {
            ranked.add(
                CoachTip(
                    TipKind.HABIT,
                    "Gaplarni bog'la",
                    "Gaplaringni \"and\", \"but\", \"because\" bilan bog'la — nutqing ravonroq bo'ladi.",
                )
            )
        }

        // 5) Tezlik
        if (wordsPerMinute < 40) {
            ranked.add(
                CoachTip(TipKind.FLUENCY, "Tezlik", "Biroz tezroq gapir — uzoq to'xtamaslikka harakat qil.")
            )
        } else if (wordsPerMinute > 140) {
            ranked.add(
                CoachTip(TipKind.FLUENCY, "Tezlik", "Sekinroq gapir — har bir so'z aniq eshitilsin.")
            )
        }

        // 6) So'z boyligi
        if (uniqueWordCount < 15) {
            ranked.add(
                CoachTip(TipKind.VOCABULARY, "So'z boyligi", "Turli xil so'zlardan foydalan — bir xil so'zlarni takrorlama.")
            )
        }

        // Bola bir vaqtda 3 tadan ko'p narsani tuzata olmaydi.
        out.addAll(ranked.take(MAX_TIPS))
        return out
    }

    /** Grammatika hisoboti kelganda qo'shiladigan maslahat. */
    fun grammarTip(issueCount: Int): CoachTip =
        if (issueCount == 0) {
            CoachTip(TipKind.GRAMMAR, "Grammatika", "Grammatik xatolar topilmadi — juda yaxshi!")
        } else {
            CoachTip(TipKind.GRAMMAR, "Grammatika", "Grammatikada $issueCount ta e'tibor talab qiladigan joy bor.")
        }

    // ── Ichki mantiq ────────────────────────────────────────────────────

    private const val MAX_TIPS = 3

    /** SpeechAnalyzer'dagi bo'lish bilan bir xil bo'lishi shart. */
    private fun splitWords(transcript: String): List<String> =
        transcript.lowercase().split(Regex("[^\\p{L}']+")).filter { it.isNotBlank() }

    private val CUES: Map<Move, List<String>> = mapOf(
        Move.OPINION to listOf(
            "i think", "i believe", "in my opinion", "i feel", "for me",
            "i would", "i like", "i love", "my favourite", "my favorite",
        ),
        Move.EXAMPLE to listOf("for example", "for instance", "such as", "like when", "one day"),
        Move.REASON to listOf("because", "since", "that's why", "that is why", "the reason", "so that"),
        Move.OTHERS to listOf(
            "some people", "other people", "people say", "people think",
            "many people", "my friend", "everyone",
        ),
        Move.SUMMARY to listOf("in conclusion", "to sum up", "finally", "overall", "in the end", "all in all"),
        Move.SEQUENCE to listOf("first", "then", "after that", "next", "later", "suddenly", "at the end"),
        Move.EMOTION to listOf(
            "happy", "sad", "excited", "scared", "afraid", "angry",
            "surprised", "nervous", "proud", "worried", "glad", "upset",
        ),
        // "in the" / "on the" ataylab yo'q — ular deyarli har gapda uchraydi
        // va tekshiruvni ma'nosiz qilib qo'yadi.
        Move.PLACE to listOf(
            "next to", "behind", "in front of", "at the top", "at the bottom",
            "in the middle", "on the left", "on the right", "background",
        ),
        Move.DESCRIBE to listOf("there is", "there are", "i can see", "it looks", "wearing"),
    )

    /**
     * Mnemonika bosqichining inglizcha nomini aniqlab bo'ladigan harakatga
     * bog'laydi. Mos kelmasa `null` — bunday bosqich TEKSHIRILMAYDI.
     * "Eye contact", "Speak clearly" kabi bosqichlar nutq matnidan
     * aniqlanmaydi, shuning uchun ular haqida hech narsa deyilmaydi.
     */
    private fun moveOf(step: String): Move? {
        val s = step.lowercase()
        return when {
            s.contains("position") || s.contains("opinion") -> Move.OPINION
            s.contains("example") -> Move.EXAMPLE
            s.contains("reason") -> Move.REASON
            s.contains("thoughts of") -> Move.OTHERS
            s.contains("summary") || s.contains("conclusion") || s.contains("next steps") -> Move.SUMMARY
            s.contains("events") || s.contains("opening") || s.contains("natural flow") -> Move.SEQUENCE
            s.contains("emotion") || s.contains("feel") || s.contains("mood") -> Move.EMOTION
            s.contains("location") || s.contains("background") -> Move.PLACE
            s.contains("describe") || s.contains("what you see") || s.contains("appearance") -> Move.DESCRIBE
            else -> null
        }
    }

    private fun hasMove(move: Move, hay: String): Boolean =
        CUES[move]?.any { hay.contains(" $it ") } ?: false

    /** Bosqichlar tartibida birinchi yetishmagan (va tekshirsa bo'ladigan) harakat. */
    private fun firstMissingMove(steps: List<String>, hay: String): Move? {
        val seen = mutableSetOf<Move>()
        for (step in steps) {
            val move = moveOf(step) ?: continue
            if (!seen.add(move)) continue
            if (!hasMove(move, hay)) return move
        }
        return null
    }

    private fun checkedMoves(steps: List<String>): List<Move> =
        steps.mapNotNull { moveOf(it) }.distinct()

    private fun moveTip(move: Move): CoachTip = when (move) {
        Move.OPINION -> CoachTip(TipKind.STRUCTURE, "Fikringni ayt", "Javobingni \"I think…\" yoki \"In my opinion…\" bilan boshla.")
        Move.EXAMPLE -> CoachTip(TipKind.STRUCTURE, "Misol keltir", "\"For example…\" deb bitta misol qo'sh — javobing ishonchli bo'ladi.")
        Move.REASON -> CoachTip(TipKind.STRUCTURE, "Sababini ayt", "\"because\" so'zini ishlat — nega shunday deb o'ylashingni tushuntir.")
        Move.OTHERS -> CoachTip(TipKind.STRUCTURE, "Boshqalar fikri", "\"Some people think…\" deb boshqalarning fikrini ham ayt.")
        Move.SUMMARY -> CoachTip(TipKind.STRUCTURE, "Xulosa qil", "Oxirida \"Finally…\" yoki \"Overall…\" deb qisqa xulosa ayt.")
        Move.SEQUENCE -> CoachTip(TipKind.STRUCTURE, "Voqealar tartibi", "\"First…\", \"Then…\", \"After that…\" bilan voqealarni tartib bilan ayt.")
        Move.EMOTION -> CoachTip(TipKind.STRUCTURE, "His-tuyg'u", "O'zingni qanday his qilganingni ayt: happy, excited, scared…")
        Move.PLACE -> CoachTip(TipKind.STRUCTURE, "Joyni ko'rsat", "\"in front of\", \"behind\", \"on the left\" bilan joyni tasvirla.")
        Move.DESCRIBE -> CoachTip(TipKind.STRUCTURE, "Tasvirla", "\"There is…\", \"I can see…\" deb ko'rganingni tasvirlab ber.")
    }

    private val FILLERS = setOf("um", "uh", "er", "erm", "hmm", "mmm", "ah", "eh")

    /**
     * Tanigich to'ldiruvchi tovushlarni har doim ham yozmaydi (Web Speech API
     * ularni deyarli tashlab yuboradi), shuning uchun bu qo'shimcha signal —
     * asosiy baholashga ta'sir qilmaydi.
     */
    private fun countFillers(words: List<String>): Int = words.count { it in FILLERS }

    private val CONNECTORS = listOf("and", "but", "because", "so", "then", "also", "when", "after", "before")

    private fun hasConnector(hay: String): Boolean = CONNECTORS.any { hay.contains(" $it ") }

    /** Mazmunsiz so'zlar — takrorlanishi tabiiy, shuning uchun sanalmaydi. */
    private val STOPWORDS = setOf(
        "the", "and", "that", "this", "with", "have", "they", "them", "there",
        "very", "like", "about", "would", "because", "when", "what", "your",
        "from", "into", "then", "also", "some", "just", "than", "these", "those",
    )

    /** 4+ harfli mazmunli so'z javobning 15%+ ini egallasa — takrorlash. */
    private fun overusedWord(words: List<String>, wordCount: Int): String? {
        if (wordCount < 15) return null
        val counts = mutableMapOf<String, Int>()
        for (w in words) {
            if (w.length < 4 || w in STOPWORDS) continue
            counts[w] = (counts[w] ?: 0) + 1
        }
        // Teng chiqqanda barqaror natija uchun alifbo tartibi.
        val top = counts.entries.sortedWith(compareByDescending<Map.Entry<String, Int>> { it.value }.thenBy { it.key })
            .firstOrNull() ?: return null
        if (top.value < 4) return null
        return if (top.value * 100 / wordCount >= 15) top.key else null
    }

    private fun praise(
        wordCount: Int,
        wpm: Int,
        matched: List<String>,
        keywords: List<String>,
        steps: List<String>,
        hay: String,
    ): CoachTip {
        val checked = checkedMoves(steps)
        val detail = when {
            keywords.isNotEmpty() && matched.size == keywords.size ->
                "Barcha kalit so'zlarni ishlatding — zo'r!"
            checked.isNotEmpty() && checked.all { hasMove(it, hay) } ->
                "Javobingni struktura bo'yicha to'liq qurding!"
            wordCount >= 40 -> "Juda yaxshi gapirding — $wordCount ta so'z!"
            wpm in 60..120 -> "Nutq tezliging juda yaxshi ($wpm so'z/daqiqa)."
            else -> "Boshlaganing yaxshi — yana urinib ko'r, har safar yaxshilanadi."
        }
        return CoachTip(TipKind.PRAISE, "Yaxshi tomoni", detail)
    }
}
