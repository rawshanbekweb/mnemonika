package uz.speakingapp.analysis

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Suhbat tahlili testlari.
 *
 * Asosiy talab: tahlil bolani ayblamasin va bir vaqtda 3 tadan ko'p tavsiya
 * bermasin — `Coach` dagi bilan bir xil pedagogik qoida.
 */
class ConversationCoachTest {

    private fun turn(text: String, understood: Boolean = true, sec: Int = 15) =
        ConversationTurn(nodeKey = "n", transcript = text, understood = understood, durationSec = sec)

    @Test
    fun `bo'sh suhbat nol ball beradi va yiqilmaydi`() {
        val r = ConversationCoach.analyze(emptyList())
        assertEquals(0, r.score)
        assertEquals(0, r.turnCount)
        assertTrue(r.tips.isNotEmpty())
    }

    @Test
    fun `tushunilgan javoblar foizi hisoblanadi`() {
        val r = ConversationCoach.analyze(
            listOf(
                turn("i like football", understood = true),
                turn("hmm", understood = false),
                turn("my favourite subject is english", understood = true),
                turn("yes", understood = true),
            )
        )
        assertEquals(75, r.understoodPercent)
        assertEquals(4, r.turnCount)
    }

    @Test
    fun `savol berish aniqlanadi`() {
        val r = ConversationCoach.analyze(listOf(turn("what is the weather like in london")))
        assertTrue(r.askedQuestion)
    }

    @Test
    fun `savol bermagan bolaga savol berish tavsiya qilinadi`() {
        val r = ConversationCoach.analyze(listOf(turn("i like football very much indeed")))
        assertFalse(r.askedQuestion)
        assertTrue(r.tips.any { it.title == "Savol ber" })
    }

    @Test
    fun `xushmuomalalik aniqlanadi`() {
        val r = ConversationCoach.analyze(listOf(turn("hello my name is ali"), turn("thank you goodbye")))
        assertTrue(r.wasPolite)
        assertFalse(r.tips.any { it.title == "Xushmuomalalik" })
    }

    @Test
    fun `maslahatlar soni cheklangan - maqtov va eng ko'pi uch tavsiya`() {
        // Ataylab yomon suhbat: qisqa, tushunilmagan, savolsiz, xushmuomalasiz.
        val r = ConversationCoach.analyze(
            listOf(turn("yes", understood = false, sec = 20), turn("no", understood = false, sec = 20))
        )
        assertTrue(r.tips.size <= 4)
        assertEquals(TipKind.PRAISE, r.tips.first().kind)
    }

    @Test
    fun `birinchi maslahat doim maqtov`() {
        val r = ConversationCoach.analyze(listOf(turn("hello i think english is very interesting because it is useful")))
        assertEquals(TipKind.PRAISE, r.tips.first().kind)
    }

    @Test
    fun `yaxshi suhbat yuqori ball oladi`() {
        val good = List(6) {
            turn(
                "i really like playing football with my friends because it makes me happy and healthy",
                understood = true,
                sec = 12,
            )
        }
        val r = ConversationCoach.analyze(good)
        assertTrue("ball: ${r.score}", r.score >= 70)
    }

    @Test
    fun `hech narsa tushunilmagan suhbat past ball oladi`() {
        val r = ConversationCoach.analyze(List(4) { turn("hmm", understood = false, sec = 20) })
        assertTrue("ball: ${r.score}", r.score < 40)
    }

    @Test
    fun `so'z va tezlik hisoblari to'g'ri`() {
        // 10 so'z, jami 60 soniya → 10 so'z/daqiqa.
        val r = ConversationCoach.analyze(
            listOf(turn("one two three four five six seven eight nine ten", sec = 60))
        )
        assertEquals(10, r.wordCount)
        assertEquals(10, r.uniqueWordCount)
        assertEquals(10, r.wordsPerMinute)
    }

    @Test
    fun `jim navbatlar transkriptga qo'shilmaydi lekin hisobga olinadi`() {
        val r = ConversationCoach.analyze(listOf(turn("hello there", sec = 10), turn("", understood = false, sec = 5)))
        assertEquals("hello there", r.transcript)
        assertEquals(2, r.turnCount)
        assertEquals(50, r.understoodPercent)
    }
}
