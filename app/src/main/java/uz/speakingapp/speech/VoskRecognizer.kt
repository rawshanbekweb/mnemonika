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
 *
 * ## Oqimlar bo'yicha qat'iy qoida
 *
 * `Recognizer` va `AudioRecord` — mahalliy (native) obyektlar va oqim-xavfsiz
 * EMAS. Ular yopilgandan keyin ishlatilsa Java istisnosi emas, SIGSEGV bo'ladi
 * va ilova bir zumda yopiladi — hech qanday `try/catch` ushlab qololmaydi.
 * Shuning uchun: **ikkalasi ham faqat "vosk-audio" oqimida yaratiladi,
 * o'qiladi va yopiladi.** `stop()` faqat bayroqni tushiradi va darhol qaytadi;
 * yakuniy natija, mikrofonni yopish va resurslarni bo'shatish — hammasi
 * o'sha oqimning o'zida, tsikl tugagach bajariladi.
 *
 * (Avvalgi versiya `stop()` ichida `thread.join(1500)` qilib, keyin main
 * oqimidan `record.release()` va `rec.close()` chaqirardi. Sekin telefonda
 * bir bo'lakni dekodlash 1.5 soniyadan oshsa join kutmay o'tib ketardi va
 * ikki oqim bitta yopilgan obyektga tegib, ilova yozuvni to'xtatish tugmasi
 * bosilganda yopilib qolardi.)
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

    /** Audio oqimi ham yopishi mumkin (`release()` yozuv paytida chaqirilsa). */
    @Volatile
    private var model: Model? = null

    /**
     * Effektlar main oqimida (start paytida) qo'shiladi, audio oqimida
     * bo'shatiladi. Ikkalasi bir vaqtda bo'lmaydi: yangi yozuv oldingisi
     * yakunlanmaguncha boshlanmaydi ([finished] tekshiruvi).
     */
    private val effects = mutableListOf<AudioEffect>()

    @Volatile
    private var running = false

    /**
     * Audio oqimi butunlay tugadimi (resurslar bo'shatildi, model bilan ishlash
     * mumkin). Oqimning eng oxirgi amali — buni `true` qilish, keyin main'ga
     * xabar yuborish; shuning uchun `onFinished` yetib kelganda bu doim `true`.
     */
    @Volatile
    private var finished = true

    /** `release()` yozuv paytida chaqirilsa, modelni oqim o'zi yopadi. */
    private var closeModelWhenDone = false

    /**
     * Modelni kim yopishini hal qiladi: `release()` (main) yoki audio oqimining
     * yakunlovchi qismi. Qulfsiz ikkalasi bir vaqtda kelib qolsa, model yo ikki
     * marta yopilardi, yo umuman yopilmay 125MB xotira qolib ketardi.
     */
    private val modelLock = Any()

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

    /**
     * Yozuv to'liq yakunlandi: yakuniy [onSegment] allaqachon yuborilgan va
     * mikrofon bo'shatilgan. Tahlilni shu signaldan keyin boshlash kerak —
     * belgilangan muddat kutish o'rniga (sekin qurilmada yetmasdi, tezida
     * ortiqcha kutish edi).
     */
    var onFinished: () -> Unit = {}

    /** Modelni og'ir I/O da yuklaydi (fon oqimida chaqiring). */
    suspend fun loadModel(path: String) = withContext(Dispatchers.IO) {
        model = Model(path)
    }

    /** Mikrofondan tinglashni boshlaydi. Asosiy (main) oqimda chaqiring. */
    @SuppressLint("MissingPermission") // RECORD_AUDIO ruxsati UI darajasida so'raladi
    fun startListening() {
        val m = model ?: error("Model yuklanmagan")
        if (running) return
        // Oldingi yozuv hali yakunlanmagan bo'lsa ikkinchi AudioRecord ochilmasligi
        // kerak — mikrofon band bo'ladi va ikki oqim bitta modelga tegadi.
        // Amalda bu deyarli bo'lmaydi: natija ekrani onFinished'dan keyin chiqadi.
        if (!finished) error("Oldingi yozuv yakunlanmoqda — bir soniyadan keyin urinib ko'ring")

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

        running = true
        finished = false

        ar.startRecording()
        Thread({ audioThread(rec, ar) }, "vosk-audio").apply {
            priority = Thread.MAX_PRIORITY
            start()
        }
    }

    /**
     * Tinglashni to'xtatishni so'raydi va DARHOL qaytadi.
     *
     * Bu yerda hech narsa yopilmaydi va kutilmaydi: main oqimini bloklash
     * (avvalgi 1.5 soniyalik `join`) UI'ni muzlatardi, mahalliy obyektlarni
     * boshqa oqimdan yopish esa ilovani yiqitardi. Yakuniy natija tayyor
     * bo'lganda [onSegment], so'ng [onFinished] chaqiriladi.
     */
    fun stop() {
        if (!running) return
        running = false
    }

    /**
     * Resurslarni bo'shatadi. Yozuv ketayotgan bo'lsa modelni audio oqimining
     * o'zi yopadi — model yopilgandan keyin `acceptWaveForm` chaqirilsa ilova
     * yiqiladi.
     */
    fun release() {
        stop()
        synchronized(modelLock) {
            if (!finished) {
                // Oqim hali tirik — modelni o'zi yopadi.
                closeModelWhenDone = true
                return
            }
            model?.close()
            model = null
        }
    }

    /**
     * Audio oqimining butun umri. `Recognizer` va `AudioRecord` shu yerda,
     * boshqa hech qayerda ishlatilmaydi.
     */
    private fun audioThread(rec: Recognizer, ar: AudioRecord) {
        try {
            readLoop(rec, ar)
            // Yakuniy natija — hali `rec` tirik, o'sha oqimda.
            runCatching {
                val hypotheses = parseHypotheses(rec.finalResult)
                if (hypotheses.isNotEmpty()) {
                    main.post { onSegment(hypotheses.first(), hypotheses) }
                }
            }
        } finally {
            runCatching { ar.stop() }
            releaseEffects()
            runCatching { ar.release() }
            // Model recognizer'dan KEYIN yopiladi: recognizer unga tayanadi.
            runCatching { rec.close() }
            running = false
            synchronized(modelLock) {
                if (closeModelWhenDone) {
                    closeModelWhenDone = false
                    runCatching { model?.close() }
                    model = null
                }
                // Bayroq qulf ichida ko'tariladi — `release()` shundan keyin
                // kelsa, modelni o'zi yopadi va u ikki marta yopilmaydi.
                finished = true
            }
            // Xabar bayroqdan keyin: `onFinished` yetib kelganda yangi yozuvni
            // boshlash mumkin bo'lishi kerak.
            main.post {
                onLevel(0f)
                onFinished()
            }
        }
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
            // To'xtatish so'ralgandan keyingi xato kutilgan hol — jim o'tkazamiz.
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

    private fun releaseEffects() {
        effects.forEach { runCatching { it.release() } }
        effects.clear()
    }
}
