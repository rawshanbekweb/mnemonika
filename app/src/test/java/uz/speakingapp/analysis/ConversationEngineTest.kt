package uz.speakingapp.analysis

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import uz.speakingapp.data.model.Conversation
import uz.speakingapp.data.model.ConversationBranch
import uz.speakingapp.data.model.ConversationNode

/**
 * Suhbat dvigateli testlari — loyihadagi birinchi Android testlari.
 *
 * Nima uchun aynan shu qism: tarmoq tanlash suhbatning butun mantiqi. Xato
 * bo'lsa ilova yiqilmaydi, shunchaki suhbat noto'g'ri yo'ldan ketadi va buni
 * faqat qurilmada, qo'lda gapirib ko'rib sezish mumkin.
 *
 * Ishga tushirish:  .\gradlew.bat testDebugUnitTest
 */
class ConversationEngineTest {

    private val hobbyNode = ConversationNode(
        nodeKey = "ask_hobby",
        line = "What do you like doing in your free time?",
        branches = listOf(
            ConversationBranch("sport", listOf("football", "sport", "swimming"), "sport_1"),
            ConversationBranch("music", listOf("music", "guitar", "singing"), "music_1"),
        ),
        fallbackKey = "repeat",
    )

    @Test
    fun `mos kalit so'z topilsa o'sha tarmoqqa o'tadi`() {
        val step = ConversationEngine.next(hobbyNode, "i like playing football with my friends")
        assertEquals("sport_1", step.nextKey)
        assertEquals("sport", step.intent)
        assertTrue(step.understood)
    }

    @Test
    fun `hech narsa mos kelmasa fallback ishlaydi`() {
        val step = ConversationEngine.next(hobbyNode, "i do not know")
        assertEquals("repeat", step.nextKey)
        assertFalse(step.understood)
    }

    @Test
    fun `jim turgan bola ham boshi berk ko'chaga tushmaydi`() {
        val step = ConversationEngine.next(hobbyNode, "")
        assertEquals("repeat", step.nextKey)
        assertFalse(step.understood)
    }

    @Test
    fun `ko'proq moslikka ega tarmoq yutadi`() {
        // "music" va "guitar" — ikkita moslik; "sport" — bitta.
        val step = ConversationEngine.next(hobbyNode, "i play sport but i love music and guitar")
        assertEquals("music_1", step.nextKey)
        assertEquals(2, step.matchedKeywords.size)
    }

    @Test
    fun `teng moslikda ro'yxatdagi birinchi tarmoq tanlanadi`() {
        val step = ConversationEngine.next(hobbyNode, "i like football and music")
        assertEquals("sport_1", step.nextKey)
    }

    @Test
    fun `tanigich variantlaridan ham topiladi`() {
        // Asosiy matnda "футбол" yo'q, lekin ikkinchi variantda bor —
        // qisqa so'zlardagi ASR xatosi shu yo'l bilan hal bo'ladi.
        val step = ConversationEngine.next(
            hobbyNode,
            "i like playing forball",
            alternatives = listOf("i like playing football"),
        )
        assertEquals("sport_1", step.nextKey)
        assertTrue(step.understood)
    }

    @Test
    fun `fallback ham tarmoq ham bo'lmasa bo'sh kalit qaytadi`() {
        val dead = ConversationNode(nodeKey = "x", line = "The end.", isEnd = true)
        val step = ConversationEngine.next(dead, "anything")
        assertEquals("", step.nextKey)
    }

    @Test
    fun `fallback bo'sh bo'lsa birinchi tarmoqqa o'tadi`() {
        val node = ConversationNode(
            nodeKey = "y",
            line = "Tell me more.",
            branches = listOf(ConversationBranch("any", listOf("zzzz"), "next_node")),
        )
        val step = ConversationEngine.next(node, "nothing matches here")
        assertEquals("next_node", step.nextKey)
        assertFalse(step.understood)
    }

    // ——— Vaqt bo'yicha yakunlash ———

    private val conversation = Conversation(
        id = "c1",
        title = "Test",
        targetMinutes = 3,
        startKey = "start",
        closingKey = "closing",
        nodes = listOf(
            ConversationNode(nodeKey = "start", line = "Hi!", fallbackKey = "middle"),
            ConversationNode(nodeKey = "middle", line = "And you?", fallbackKey = "start"),
            ConversationNode(nodeKey = "closing", line = "Goodbye!", isEnd = true),
        ),
    )

    @Test
    fun `vaqt tugamagan bo'lsa oddiy tugun qaytadi`() {
        val node = ConversationEngine.resolve(conversation, "middle", elapsedSec = 60)
        assertEquals("middle", node?.nodeKey)
    }

    @Test
    fun `vaqt tugaganda yakuniy tugunga o'tiladi`() {
        val node = ConversationEngine.resolve(conversation, "middle", elapsedSec = 180)
        assertEquals("closing", node?.nodeKey)
    }

    @Test
    fun `yakuniy tugun yo'q bo'lsa suhbat oddiy yo'ldan davom etadi`() {
        val noClosing = conversation.copy(closingKey = "yoq_tugun")
        val node = ConversationEngine.resolve(noClosing, "middle", elapsedSec = 999)
        assertEquals("middle", node?.nodeKey)
    }

    @Test
    fun `noma'lum kalit null qaytaradi - chaqiruvchi suhbatni tugatadi`() {
        assertEquals(null, ConversationEngine.resolve(conversation, "yoq", elapsedSec = 10))
    }

    @Test
    fun `targetMinutes nol bo'lsa vaqt bo'yicha tugatilmaydi`() {
        assertFalse(ConversationEngine.timeIsUp(elapsedSec = 10_000, targetMinutes = 0))
    }
}
