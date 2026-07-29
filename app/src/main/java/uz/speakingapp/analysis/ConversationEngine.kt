package uz.speakingapp.analysis

import uz.speakingapp.data.model.Conversation
import uz.speakingapp.data.model.ConversationNode

/**
 * Erkin suhbat dvigateli: bolaning javobiga qarab daraxtning keyingi tugunini
 * tanlaydi.
 *
 * NIMA UCHUN MODEL EMAS: suhbat davomida bulutli model chaqirish bepul tarif
 * kvotasiga sig'maydi (5 daqiqalik suhbat ≈ 12–15 so'rov, kunlik chegara esa
 * 20) va bolaning nutqi qurilmadan chiqib ketardi. Shuning uchun butun daraxt
 * OLDINDAN yaratiladi, telefon esa uni offline aylanib chiqadi.
 *
 * Tanlov [KeywordMatcher] orqali boradi — ya'ni tanigichning "dog"/"dock" kabi
 * xatolari suhbatni buzmaydi (mashqlardagi bilan aynan bir xil mantiq).
 */
object ConversationEngine {

    /**
     * Bitta qadamning natijasi.
     *
     * [understood] — tarmoq topildimi. Bu suhbatning eng muhim o'lchovi: bola
     * mavzuga oid gapira oldimi yoki dastur uni tushunmadimi. Tahlilda shu
     * foiz ishlatiladi.
     */
    data class Step(
        val nextKey: String,
        val intent: String,
        val matchedKeywords: List<String>,
        val understood: Boolean,
    )

    /**
     * Bolaning javobiga qarab keyingi tugunni tanlaydi.
     *
     * Qoidalar (tartib MUHIM, testlar shunga bog'liq):
     *  1. Har tarmoq uchun mos kelgan kalit so'zlar sanaladi.
     *  2. Eng ko'p moslikka ega tarmoq yutadi.
     *  3. Teng bo'lsa — RO'YXATDAGI BIRINCHISI. Shuning uchun senariyda
     *     aniqroq tarmoq yuqoriroq turishi kerak.
     *  4. Hech biri mos kelmasa — [ConversationNode.fallbackKey].
     *  5. Fallback ham bo'sh bo'lsa — birinchi tarmoq (boshi berk ko'cha
     *     bo'lmasligi uchun), u ham bo'lmasa bo'sh satr (suhbat tugaydi).
     *
     * @param alternatives tanigichning qo'shimcha variantlari.
     */
    fun next(
        node: ConversationNode,
        transcript: String,
        alternatives: List<String> = emptyList(),
    ): Step {
        val fallback = fallbackStep(node)
        if (transcript.isBlank() && alternatives.all { it.isBlank() }) return fallback

        var best: Step? = null
        var bestCount = 0
        for (branch in node.branches) {
            val matched = KeywordMatcher.matched(transcript, branch.keywords, alternatives)
            if (matched.size > bestCount) {
                bestCount = matched.size
                best = Step(
                    nextKey = branch.nextKey,
                    intent = branch.intent,
                    matchedKeywords = matched,
                    understood = true,
                )
            }
        }
        return best ?: fallback
    }

    private fun fallbackStep(node: ConversationNode): Step {
        val key = when {
            node.fallbackKey.isNotBlank() -> node.fallbackKey
            node.branches.isNotEmpty() -> node.branches.first().nextKey
            else -> ""
        }
        return Step(nextKey = key, intent = "", matchedKeywords = emptyList(), understood = false)
    }

    /**
     * Suhbatni yakunlash vaqti keldimi.
     *
     * Bola suhbat uzunligini oldindan biladi (1–5 daqiqa), shuning uchun vaqt
     * tugaganda daraxtning qolgan qismi tashlab yuboriladi va yakuniy tugunga
     * o'tiladi — suhbat "keskin uzilgan" emas, "xayrlashgan" bo'lib tugaydi.
     */
    fun timeIsUp(elapsedSec: Int, targetMinutes: Int): Boolean =
        targetMinutes > 0 && elapsedSec >= targetMinutes * 60

    /**
     * Keyingi ko'rsatiladigan tugun: vaqt tugagan bo'lsa yakuniy tugun.
     * Yakuniy tugun topilmasa `null` — chaqiruvchi suhbatni tugatadi.
     */
    fun resolve(conversation: Conversation, nextKey: String, elapsedSec: Int): ConversationNode? {
        if (timeIsUp(elapsedSec, conversation.targetMinutes)) {
            val closing = conversation.node(conversation.closingKey)
            if (closing != null) return closing
        }
        return conversation.node(nextKey)
    }
}
