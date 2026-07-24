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

    /** Matnni ovoz bilan aytadi; tugagach onDone chaqiradi. */
    fun speak(text: String, onDone: () -> Unit) {
        val engine = tts
        if (!ready || engine == null || text.isBlank()) {
            onDone()
            return
        }
        val id = "u${counter++}"
        callbacks[id] = onDone
        val res = engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, id)
        if (res != TextToSpeech.SUCCESS) {
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
