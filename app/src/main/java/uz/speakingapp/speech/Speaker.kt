package uz.speakingapp.speech

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale

/**
 * Virtual personaj ovozi — Android TextToSpeech (bepul, o'rnatilgan).
 * TTS mavjud bo'lmasa ham dialog oqimi to'xtamaydi (matn ekranда ko'rinadi, onDone chaqiriladi).
 */
class Speaker(context: Context) {

    companion object {
        /** Suhbat va dialog uchun — odatdagi tezlik. */
        const val RATE_NORMAL = 1.0f

        /**
         * Talaffuz namunasi uchun. Bola namunani ESHITIB takrorlaydi va har
         * so'zi solishtiriladi, shuning uchun namuna shoshmasligi kerak.
         */
        const val RATE_SLOW = 0.75f

        /** "Dona dona" aytish uchun so'zlar orasidagi jimlik. */
        const val WORD_GAP_MS = 180L
    }

    private var tts: TextToSpeech? = null
    private var ready = false
    private var counter = 0
    private val callbacks = HashMap<String, () -> Unit>()

    init {
        tts = TextToSpeech(context.applicationContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale.US
                ready = true
            }
        }
        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {}
            override fun onDone(utteranceId: String?) {
                utteranceId?.let { fire(it) }
            }

            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) {
                utteranceId?.let { fire(it) }
            }

            override fun onError(utteranceId: String?, errorCode: Int) {
                utteranceId?.let { fire(it) }
            }
        })
    }

    private fun fire(id: String) {
        callbacks.remove(id)?.invoke()
    }

    /**
     * Matnni ovoz bilan aytadi; tugagach onDone chaqiradi.
     *
     * [rate] — nutq tezligi ([RATE_NORMAL] yoki [RATE_SLOW]).
     * [wordGapMs] — noldan katta bo'lsa gap so'zlarga bo'linib, har so'z
     * orasiga shuncha jimlik qo'yiladi ("dona dona" aytish). Talaffuz
     * namunasi uchun kerak: bola qaysi so'z qayerda tugashini eshitadi.
     *
     * Tezlik dvigatelda saqlanib qoladi, shuning uchun HAR chaqiruvda
     * o'rnatiladi — aks holda talaffuz mashqidan keyin dialog ham sekin
     * gapirib qolardi.
     */
    fun speak(
        text: String,
        rate: Float = RATE_NORMAL,
        wordGapMs: Long = 0L,
        onDone: () -> Unit,
    ) {
        val engine = tts
        if (!ready || engine == null || text.isBlank()) {
            onDone()
            return
        }
        engine.setSpeechRate(rate)

        val id = "u${counter++}"
        callbacks[id] = onDone

        val parts =
            if (wordGapMs > 0L) text.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }
            else listOf(text.trim())
        if (parts.isEmpty()) {
            fire(id)
            return
        }

        // onDone faqat OXIRGI bo'lakka bog'lanadi — oradagi bo'laklar tugaganda
        // mashq davom etib ketmasligi kerak. Navbatning boshi FLUSH: yangi
        // eshittirish eskisini uzadi (avvalgi xatti-harakat saqlanadi).
        var queueMode = TextToSpeech.QUEUE_FLUSH
        var lastRes = TextToSpeech.ERROR
        parts.forEachIndexed { i, part ->
            val last = i == parts.lastIndex
            lastRes = engine.speak(part, queueMode, null, if (last) id else "${id}_$i")
            queueMode = TextToSpeech.QUEUE_ADD
            if (!last && wordGapMs > 0L) {
                engine.playSilentUtterance(wordGapMs, TextToSpeech.QUEUE_ADD, null)
            }
        }

        // Oxirgi bo'lak navbatga tushmasa onDone hech qachon kelmaydi — o'zimiz chaqiramiz.
        if (lastRes != TextToSpeech.SUCCESS) {
            fire(id)
        }
    }

    fun stop() {
        tts?.stop()
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        callbacks.clear()
    }
}
