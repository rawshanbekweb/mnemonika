package uz.speakingapp.speech

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.media.audiofx.AudioEffect
import android.media.audiofx.AutomaticGainControl
import android.media.audiofx.NoiseSuppressor
import android.os.Handler
import android.os.Looper
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer
import uz.speakingapp.BuildConfig
import kotlin.math.sqrt

/**
 * Vosk orqali mikrofondan real vaqt nutqni matnga o'giradi (offline).
 * - onPartial: gapirayotganda jonli (tugallanmagan) matn.
 * - onSegment: bir bo'lak tugadi (sukut/pauza) — yakuniy matn qismi.
 * - onLevel: mikrofon signal darajasi 0f..1f (bola eshitilayotganini ko'rsatish uchun).
 *
 * Nega Vosk'ning tayyor `SpeechService` sinfi ishlatilmaydi?
 * U mikrofonni o'zi ochadi va `audioSessionId` ni bermaydi — natijada unga
 * shovqin bostirish (NoiseSuppressor) va avtomatik kuchaytirish (AGC) ni
 * ulab bo'lmaydi. Sinf sharoitida va bolalar sekin gapirganda bular muhim,
 * shuning uchun audio quvuri qo'lda yozilgan.
 */
class VoskRecognizer {

    companion object {
        private const val TAG = "VoskRecognizer"
        private const val SAMPLE_RATE = 16000

        /** Vosk'ga ~0.2 soniyalik bo'laklar berish tavsiya etiladi. */
        private const val CHUNK_SHORTS = 3200

        /**
         * Vosk har bo'lak uchun nechta variant qaytarsin.
         *
         * Bu kalit so'zlarni topishda ishlatiladi: bola "dog" desa, tanigich
         * birinchi variantda "dock" deb yozishi mumkin, lekin "dog" ikkinchi
         * variantda turadi. Taxmin qilish o'rniga tanigichning o'z shubhasidan
         * foydalanamiz — bu ancha ishonchli.
         */
        private const val MAX_ALTERNATIVES = 3
    }

    private var model: Model? = null
    private var recognizer: Recognizer? = null
    private var record: AudioRecord? = null
    private var thread: Thread? = null
    private val effects = mutableListOf<AudioEffect>()

    @Volatile
    private var running = false

    private val main = Handler(Looper.getMainLooper())

    var onPartial: (String) -> Unit = {}

    /**
     * Bo'lak tugadi.
     * @param text eng ishonchli variant (ekranda ko'rsatiladi).
     * @param alternatives shu bo'lakning barcha variantlari (kalit so'z qidirish uchun).
     */
    var onSegment: (text: String, alternatives: List<String>) -> Unit = { _, _ -> }
    var onErrorMsg: (String) -> Unit = {}
    var onLevel: (Float) -> Unit = {}

    /** Modelni og'ir I/O da yuklaydi (fon oqimida chaqiring). */
    suspend fun loadModel(path: String) = withContext(Dispatchers.IO) {
        model = Model(path)
    }

    /** Mikrofondan tinglashni boshlaydi. Asosiy (main) oqimda chaqiring. */
    @SuppressLint("MissingPermission") // RECORD_AUDIO ruxsati UI darajasida so'raladi
    fun startListening() {
        val m = model ?: error("Model yuklanmagan")
        if (running) return

        val rec = Recognizer(m, SAMPLE_RATE.toFloat())
        runCatching { rec.setMaxAlternatives(MAX_ALTERNATIVES) }
        // So'z darajasidagi ishonch (conf) uchun. Vosk versiyasi buni
        // `alternatives` bilan birga bermasligi mumkin — shuning uchun
        // runCatching, va haqiqiy shakl DEBUG jurnalidan ko'riladi.
        runCatching { rec.setWords(true) }

        val minBuffer = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
        )
        if (minBuffer <= 0) {
            rec.close()
            error("Mikrofon bu qurilmada qo'llab-quvvatlanmaydi")
        }
        // Kattaroq bufer — sekin telefonlarda ovoz bo'lagi yo'qolib ketmasin.
        val bufferBytes = maxOf(minBuffer, CHUNK_SHORTS * 2 * 4)

        val ar = AudioRecord(
            // VOICE_RECOGNITION — tizim ortiqcha ishlov bermaydi, ASR uchun mo'ljallangan manba.
            MediaRecorder.AudioSource.VOICE_RECOGNITION,
            SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferBytes,
        )
        if (ar.state != AudioRecord.STATE_INITIALIZED) {
            ar.release()
            rec.close()
            error("Mikrofonni ochib bo'lmadi")
        }

        attachEffects(ar.audioSessionId)

        recognizer = rec
        record = ar
        running = true

        ar.startRecording()
        thread = Thread({ readLoop(rec, ar) }, "vosk-audio").apply {
            priority = Thread.MAX_PRIORITY
            start()
        }
    }

    /** Tinglashni to'xtatadi va yakuniy natijani chiqaradi. */
    fun stop() {
        if (!running) return
        running = false
        runCatching { thread?.join(1500) }
        thread = null

        val rec = recognizer
        runCatching {
            record?.stop()
        }
        releaseAudio()

        if (rec != null) {
            runCatching {
                val hypotheses = parseHypotheses(rec.finalResult)
                if (hypotheses.isNotEmpty()) {
                    main.post { onSegment(hypotheses.first(), hypotheses) }
                }
            }
            rec.close()
        }
        recognizer = null
        main.post { onLevel(0f) }
    }

    /** Resurslarni bo'shatadi. */
    fun release() {
        stop()
        model?.close()
        model = null
    }

    private fun readLoop(rec: Recognizer, ar: AudioRecord) {
        val buffer = ShortArray(CHUNK_SHORTS)
        try {
            while (running) {
                val read = ar.read(buffer, 0, buffer.size)
                if (read <= 0) continue

                emitLevel(buffer, read)

                if (rec.acceptWaveForm(buffer, read)) {
                    val hypotheses = parseHypotheses(rec.result)
                    if (hypotheses.isNotEmpty()) {
                        main.post { onSegment(hypotheses.first(), hypotheses) }
                    }
                } else {
                    val partial = JSONObject(rec.partialResult).optString("partial")
                    if (partial.isNotBlank()) main.post { onPartial(partial) }
                }
            }
        } catch (e: Exception) {
            if (running) {
                Log.w(TAG, "Audio oqimida xato", e)
                running = false
                main.post { onErrorMsg(e.message ?: "Nutqni tanishda xato") }
            }
        }
    }

    /**
     * Vosk natijasidan variantlarni ajratib oladi.
     *
     * `setMaxAlternatives` yoqilganda JSON `{"alternatives":[{"text":…}, …]}` ko'rinishida,
     * aks holda `{"text":…}` ko'rinishida keladi — ikkalasini ham qo'llab-quvvatlaymiz,
     * chunki `setMaxAlternatives` eski Vosk versiyalarida mavjud bo'lmasligi mumkin.
     * Birinchi element — eng ishonchli variant.
     */
    private fun parseHypotheses(json: String): List<String> {
        // Vosk qaytaradigan XOM JSON — faqat debug qurilishida.
        //
        // Nega kerak: `setMaxAlternatives` va `setWords` birga yoqilganda bu
        // Vosk versiyasi so'z darajasidagi `conf` ni beradimi — hujjatdan emas,
        // faqat qurilmadan bilinadi. Bir marta ishga tushirilsa shu jurnal
        // savolga javob beradi va taxminiy parsing yozish shart bo'lmaydi.
        //
        // Release qurilishida CHIQMAYDI: bola nutqi jurnalga tushmasligi kerak.
        if (BuildConfig.DEBUG) {
            Log.d(TAG, "XOM natija: ${json.take(600)}")
        }

        val root = JSONObject(json)
        val alternatives = root.optJSONArray("alternatives")
        if (alternatives != null) {
            val list = ArrayList<String>(alternatives.length())
            for (i in 0 until alternatives.length()) {
                val text = alternatives.optJSONObject(i)?.optString("text").orEmpty()
                if (text.isNotBlank()) list.add(text)
            }
            return list
        }
        val text = root.optString("text")
        return if (text.isNotBlank()) listOf(text) else emptyList()
    }

    /** RMS asosida 0f..1f daraja — UI'da "eshitilyapti" indikatori uchun. */
    private fun emitLevel(buffer: ShortArray, read: Int) {
        var sum = 0.0
        for (i in 0 until read) {
            val v = buffer[i].toDouble()
            sum += v * v
        }
        val rms = sqrt(sum / read)
        // 32768 — maksimal amplituda; gapirish odatda 500..8000 oralig'ida bo'ladi.
        val level = (rms / 6000.0).coerceIn(0.0, 1.0).toFloat()
        main.post { onLevel(level) }
    }

    /**
     * Shovqin bostirish va avtomatik kuchaytirishni ulaydi (qurilma qo'llab-quvvatlasa).
     * Ikkalasi ham bepul, tizim ichida. Mavjud bo'lmasa jimgina o'tkazib yuboriladi.
     */
    private fun attachEffects(sessionId: Int) {
        runCatching {
            if (NoiseSuppressor.isAvailable()) {
                NoiseSuppressor.create(sessionId)?.let {
                    it.enabled = true
                    effects += it
                    Log.i(TAG, "NoiseSuppressor yoqildi")
                }
            }
        }
        runCatching {
            if (AutomaticGainControl.isAvailable()) {
                AutomaticGainControl.create(sessionId)?.let {
                    it.enabled = true
                    effects += it
                    Log.i(TAG, "AutomaticGainControl yoqildi")
                }
            }
        }
    }

    private fun releaseAudio() {
        effects.forEach { runCatching { it.release() } }
        effects.clear()
        runCatching { record?.release() }
        record = null
    }
}
