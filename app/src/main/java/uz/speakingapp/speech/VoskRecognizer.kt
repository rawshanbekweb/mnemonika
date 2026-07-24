package uz.speakingapp.speech

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer
import org.vosk.android.RecognitionListener
import org.vosk.android.SpeechService

/**
 * Vosk orqali mikrofondan real vaqt nutqni matnga o'giradi (offline).
 * - onPartial: gapirayotganda jonli (tugallanmagan) matn.
 * - onSegment: bir bo'lak tugadi (sukut/pauza) — yakuniy matn qismi.
 */
class VoskRecognizer {

    companion object {
        private const val SAMPLE_RATE = 16000.0f
    }

    private var model: Model? = null
    private var speechService: SpeechService? = null

    var onPartial: (String) -> Unit = {}
    var onSegment: (String) -> Unit = {}
    var onErrorMsg: (String) -> Unit = {}

    /** Modelni og'ir I/O da yuklaydi (fon oqimida chaqiring). */
    suspend fun loadModel(path: String) = withContext(Dispatchers.IO) {
        model = Model(path)
    }

    /** Mikrofondan tinglashni boshlaydi. Asosiy (main) oqimda chaqiring. */
    fun startListening() {
        val m = model ?: error("Model yuklanmagan")
        val recognizer = Recognizer(m, SAMPLE_RATE)
        speechService = SpeechService(recognizer, SAMPLE_RATE).also {
            it.startListening(listener)
        }
    }

    /** Tinglashni to'xtatadi va yakuniy natijani chiqaradi. */
    fun stop() {
        speechService?.stop()
    }

    /** Resurslarni bo'shatadi. */
    fun release() {
        speechService?.shutdown()
        speechService = null
        model?.close()
        model = null
    }

    private val listener = object : RecognitionListener {
        override fun onPartialResult(hypothesis: String?) {
            val text = hypothesis?.let { JSONObject(it).optString("partial") }.orEmpty()
            if (text.isNotBlank()) onPartial(text)
        }

        override fun onResult(hypothesis: String?) {
            val text = hypothesis?.let { JSONObject(it).optString("text") }.orEmpty()
            if (text.isNotBlank()) onSegment(text)
        }

        override fun onFinalResult(hypothesis: String?) {
            val text = hypothesis?.let { JSONObject(it).optString("text") }.orEmpty()
            if (text.isNotBlank()) onSegment(text)
        }

        override fun onError(exception: Exception?) {
            onErrorMsg(exception?.message ?: "Nutqni tanishда xato")
        }

        override fun onTimeout() { /* jim */ }
    }
}
