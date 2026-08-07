package uz.speakingapp.speech

import android.content.Context
import android.media.MediaPlayer
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import kotlin.coroutines.resume

/**
 * Ingliz talaffuzi namunasini ijro etadi.
 *
 * Ustuvorlik: **yaratilgan audio** (Gemini TTS bilan tayyorlangan, kontent
 * paketida URL sifatida keladi) → topilmasa **qurilma TTS'i** ([Speaker]).
 *
 * Nega shunday: Android TTS ovozi qurilmaga bog'liq — o'zbek telefonida ingliz
 * ovoz paketi yo o'rnatilmagan, yo juda sun'iy. "Takrorlang" mashqining butun
 * mohiyati to'g'ri talaffuzni eshitib takrorlash, shuning uchun ovoz sifati
 * bu yerda bezak emas.
 *
 * ## Offline
 *
 * Har klip birinchi eshitilganda `cacheDir/voice/` ga yuklab olinadi va keyin
 * **tarmoqsiz ishlaydi** — ilovaning offline-first va'dasi buzilmaydi. Tarmoq
 * yo'q va klip hali keshlanmagan bo'lsa jimgina TTS'ga qaytadi, xato
 * ko'rsatilmaydi: bola uchun ovoz eshitilishi muhim, qaysi manbadan emas.
 */
class VoiceCue(context: Context, private val speaker: Speaker) {

    /**
     * Bitta eshittirish: audio URL (bo'sh bo'lishi mumkin) va zaxira matn.
     *
     * [slow] — talaffuz namunasi (bola aynan shuni takrorlaydi). Yaratilgan
     * klip sekinroq ijro etiladi, qurilma TTS'i esa "dona dona" aytadi.
     */
    data class Cue(val url: String, val text: String, val slow: Boolean = false)

    private companion object {
        const val TAG = "VoiceCue"
        const val CONNECT_TIMEOUT_MS = 15_000
        const val READ_TIMEOUT_MS = 20_000

        /**
         * Talaffuz namunasi uchun ijro tezligi.
         *
         * NEGA IJRODA, GENERATSIYADA EMAS: TTS ko'rsatmasi bilan tezlikni
         * boshqarish uch marta sinaldi va ishonchsiz chiqdi (`audio-key.ts`
         * dagi uslub tarixiga qarang) — model ba'zan sekin, ba'zan oddiy
         * tezlikda o'qiydi. `setPlaybackParams` esa aniq: har klip har doim
         * bir xil koeffitsiyentga sekinlashadi va tovush balandligi (pitch)
         * o'zgarmaydi — Android vaqtni cho'zadi, tezlikni emas.
         */
        const val SLOW_SPEED = 0.8f
    }

    private val cacheDir = File(context.applicationContext.cacheDir, "voice")

    /** MediaPlayer — faqat asosiy oqimda yaratiladi/bo'shatiladi. */
    private var player: MediaPlayer? = null

    /**
     * Ijro avlodi. Har yangi [play] chaqiruvi buni oshiradi, shuning uchun
     * eski ketma-ketlik (masalan yozuv boshlanganda to'xtatilgan) davom etmaydi.
     */
    private var generation = 0

    /**
     * Klip(lar)ni ketma-ket ijro etadi. Chaqiruvchi coroutine'da kutadi.
     * Yangi [play] yoki [stop] kelsa jimgina uziladi.
     */
    suspend fun play(cues: List<Cue>) {
        val run = ++generation
        for (cue in cues) {
            if (run != generation) return
            val file = cue.url.takeIf { it.isNotBlank() }?.let { cached(it) }
            if (run != generation) return
            if (file != null && playFile(file, cue.slow)) continue
            // Audio yo'q yoki ijro bo'lmadi — qurilma TTS'i.
            if (run != generation) return
            speakSuspend(cue.text, cue.slow)
        }
    }

    /** Ijroni to'xtatadi (yozuv boshlanganda mikrofon TTS ovozini yozmasin). */
    fun stop() {
        generation++
        releasePlayer()
        speaker.stop()
    }

    fun release() {
        stop()
    }

    private fun releasePlayer() {
        runCatching { player?.stop() }
        runCatching { player?.release() }
        player = null
    }

    /** Keshdagi faylni qaytaradi; yo'q bo'lsa yuklab oladi. Muvaffaqiyatsiz bo'lsa null. */
    private suspend fun cached(url: String): File? = withContext(Dispatchers.IO) {
        val target = File(cacheDir, fileNameFor(url))
        if (target.exists() && target.length() > 0) return@withContext target

        runCatching {
            cacheDir.mkdirs()
            // Yarim yuklangan fayl keshda qolmasligi kerak — avval .part ga yozib,
            // to'liq bo'lgandan keyin qayta nomlanadi.
            val part = File(cacheDir, "${target.name}.part")
            val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                connectTimeout = CONNECT_TIMEOUT_MS
                readTimeout = READ_TIMEOUT_MS
            }
            try {
                if (conn.responseCode !in 200..299) {
                    error("HTTP ${conn.responseCode}")
                }
                conn.inputStream.use { input ->
                    part.outputStream().use { out -> input.copyTo(out) }
                }
            } finally {
                conn.disconnect()
            }
            if (part.length() <= 0L) error("bo'sh fayl")
            if (!part.renameTo(target)) {
                part.delete()
                error("keshga ko'chirib bo'lmadi")
            }
            target
        }.onFailure {
            Log.i(TAG, "Audio yuklab olinmadi, TTS'ga qaytamiz: ${it.message}")
        }.getOrNull()
    }

    /** Faylni ijro etadi. `true` — muvaffaqiyatli tugadi, `false` — TTS kerak. */
    private suspend fun playFile(file: File, slow: Boolean): Boolean = suspendCancellableCoroutine { cont ->
        releasePlayer()
        val mp = MediaPlayer()
        player = mp
        var settled = false
        fun finish(ok: Boolean) {
            if (settled) return
            settled = true
            if (player === mp) {
                runCatching { mp.release() }
                player = null
            }
            if (cont.isActive) cont.resume(ok)
        }

        mp.setOnCompletionListener { finish(true) }
        mp.setOnErrorListener { _, what, extra ->
            Log.i(TAG, "MediaPlayer xatosi ($what/$extra) — TTS'ga qaytamiz")
            finish(false)
            true
        }
        cont.invokeOnCancellation { finish(false) }

        runCatching {
            mp.setDataSource(file.absolutePath)
            mp.setOnPreparedListener { player ->
                // Tezlik faqat TAYYOR bo'lgandan keyin o'rnatiladi — undan oldin
                // ba'zi qurilmalarda IllegalStateException beradi. Qo'llab-
                // quvvatlamagan qurilmada xato yutiladi va klip oddiy tezlikda
                // ijro etiladi: sekinlik yo'qoladi, lekin ovoz eshitiladi.
                if (slow) {
                    runCatching {
                        player.playbackParams = player.playbackParams.setSpeed(SLOW_SPEED)
                    }.onFailure { e ->
                        Log.i(TAG, "Sekin ijro qo'llab-quvvatlanmadi: ${e.message}")
                    }
                }
                // setPlaybackParams ba'zi qurilmalarda ijroni o'zi boshlab
                // yuboradi; start() ni qayta chaqirish zararsiz.
                runCatching { player.start() }
            }
            mp.prepareAsync()
        }.onFailure {
            Log.i(TAG, "Audio ochilmadi: ${it.message}")
            // Buzuq keshni o'chiramiz — keyingi urinishda qayta yuklanadi.
            runCatching { file.delete() }
            finish(false)
        }
    }

    /** [Speaker.speak] ning coroutine ko'rinishi. */
    private suspend fun speakSuspend(text: String, slow: Boolean) = suspendCancellableCoroutine<Unit> { cont ->
        var settled = false
        val rate = if (slow) Speaker.RATE_SLOW else Speaker.RATE_NORMAL
        val gap = if (slow) Speaker.WORD_GAP_MS else 0L
        speaker.speak(text, rate, gap) {
            if (!settled) {
                settled = true
                if (cont.isActive) cont.resume(Unit)
            }
        }
        cont.invokeOnCancellation {
            if (!settled) settled = true
        }
    }

    /** URL → keshdagi fayl nomi. Kengaytma saqlanadi (MediaPlayer formatni undan biladi). */
    private fun fileNameFor(url: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(url.toByteArray())
        val hash = digest.joinToString("") { "%02x".format(it) }.take(32)
        val ext = url.substringAfterLast('.', "").takeIf { it.length in 2..4 } ?: "wav"
        return "$hash.$ext"
    }
}
