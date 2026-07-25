package uz.speakingapp.analysis

import kotlin.math.abs
import kotlin.math.min

/**
 * Kalit so'zlarni transkriptda topadi — ASR xatolariga chidamli.
 *
 * Nega kerak: offline tanigich bolaning "dog" so'zini "dock" deb yozishi mumkin.
 * Aynan mos kelishni talab qilsak, tanigichning xatosi bolaning xatosiga aylanadi
 * va u haqiqatda to'g'ri aytgan so'z uchun ball yo'qotadi.
 *
 * MUHIM: bu mantiq `web/src/lib/keyword-matcher.ts` bilan aynan bir xil bo'lishi shart —
 * aks holda bir xil nutq ikki platformada turli ball oladi.
 */
object KeywordMatcher {

    /** O'zak mosligi (play/playing) uchun eng kichik uzunlik. */
    private const val MIN_STEM_LENGTH = 4

    /**
     * Harf almashish (Levenshtein) faqat UZUN so'zlarda ruxsat etiladi.
     *
     * Nega 6? Qisqa so'zlarda bir harf farqi ko'pincha BOSHQA so'z bo'ladi:
     * "house"/"horse", "cat"/"cap", "bat"/"bad" — bularni bir xil deb hisoblasak,
     * kalit so'z metrikasi ma'nosini yo'qotadi. 6+ harfli so'zlarda esa bir harf
     * farqi deyarli doim tanigichning xatosi ("museum" → "musium").
     */
    private const val MIN_EDIT_LENGTH = 6

    /**
     * @param transcript ekranda ko'rinadigan asosiy matn.
     * @param alternatives tanigichning boshqa variantlari (bo'lsa). Kalit so'z shulardan
     *   birida topilsa ham hisobga olinadi — "dog" ni "dock" deb yozgan holat shu yerda hal bo'ladi.
     */
    fun matched(
        transcript: String,
        keywords: List<String>,
        alternatives: List<String> = emptyList(),
    ): List<String> {
        val haystacks = (listOf(transcript) + alternatives).filter { it.isNotBlank() }
        if (haystacks.isEmpty()) return emptyList()

        val prepared = haystacks.map { text ->
            val lower = text.lowercase()
            lower to lower.split(Regex("[^\\p{L}']+")).filter { it.isNotBlank() }.toSet()
        }
        return keywords.filter { kw ->
            prepared.any { (lower, spoken) -> matches(kw, lower, spoken) }
        }
    }

    private fun matches(keyword: String, lowerTranscript: String, spoken: Set<String>): Boolean {
        val k = keyword.lowercase().trim()
        if (k.isEmpty()) return false

        // 1) To'g'ridan-to'g'ri uchrasa — tayyor. ("cat" → "cats" ham shu yerda topiladi.)
        if (lowerTranscript.contains(k)) return true

        // 2) Ko'p so'zli ibora uchun taxminiy solishtirish qilmaymiz — xato ehtimoli katta.
        if (k.contains(' ')) return false

        // 3) Bitta so'z: aytilgan so'zlar bilan taqqoslaymiz.
        return spoken.any { word -> similar(k, word) }
    }

    private fun similar(keyword: String, word: String): Boolean {
        if (keyword == word) return true
        if (keyword.length < MIN_STEM_LENGTH || word.length < MIN_STEM_LENGTH) return false

        // O'zak mosligi: "play" ↔ "playing", "friend" ↔ "friends". Bu xavfsiz.
        if (word.startsWith(keyword) || keyword.startsWith(word)) return true

        // Harf almashishga faqat uzun KALIT SO'ZLARDA yo'l qo'yamiz.
        // Shart aytilgan so'zga emas, kalit so'zga qo'yiladi: tanigich harf tushirib
        // qoldirsa ("sister" → "siter") aytilgan so'z qisqaroq bo'lib qolishi normal.
        if (keyword.length < MIN_EDIT_LENGTH) return false

        // Birinchi harf mos kelishi shart. Tanigich odatda so'z o'rtasi/oxirida
        // adashadi; birinchi harf farqi esa deyarli doim BOSHQA so'z ("father"/"rather").
        if (keyword[0] != word[0]) return false

        val allowed = if (keyword.length >= 9) 2 else 1
        if (abs(keyword.length - word.length) > allowed) return false

        return levenshtein(keyword, word, allowed) <= allowed
    }

    /** Levenshtein masofasi; [limit] dan oshsa erta to'xtaydi (limit + 1 qaytaradi). */
    private fun levenshtein(a: String, b: String, limit: Int): Int {
        var previous = IntArray(b.length + 1) { it }
        var current = IntArray(b.length + 1)

        for (i in 1..a.length) {
            current[0] = i
            var rowMin = current[0]
            for (j in 1..b.length) {
                val cost = if (a[i - 1] == b[j - 1]) 0 else 1
                current[j] = min(
                    min(current[j - 1] + 1, previous[j] + 1),
                    previous[j - 1] + cost,
                )
                rowMin = min(rowMin, current[j])
            }
            if (rowMin > limit) return limit + 1
            val swap = previous
            previous = current
            current = swap
        }
        return previous[b.length]
    }
}
