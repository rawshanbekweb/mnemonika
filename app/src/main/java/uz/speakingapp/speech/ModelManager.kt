package uz.speakingapp.speech

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.zip.ZipInputStream
import kotlin.coroutines.coroutineContext

/**
 * Vosk offline nutq modelini boshqaradi.
 * Birinchi marta modelni internetdan yuklab oladi va telefon ichiga saqlaydi,
 * keyingi safar to'g'ridan-to'g'ri offline ishlatiladi.
 *
 * Model tanlovi: `lgraph` (~125MB) ataylab kichik `small` (~40MB) o'rniga olindi.
 * Kichik model bolalar ovozi va o'zbek aksentli ingliz tilida juda ko'p xato qilardi;
 * lgraph sezilarli aniqroq va hamon to'liq offline ishlaydi.
 *
 * ## Nega yuklab olish qismi shunchalik ehtiyotkor yozilgan
 *
 * 125MB ni mobil internetdan olish — bir necha daqiqalik ish va u albatta
 * uziladi. Birinchi versiya buni hisobga olmagan edi va uchta xato qilardi:
 *  1. Progress `Content-Length` bo'lmasa UMUMAN hisoblanmasdi — bola 0% da
 *     qotib qolgan ekranni ko'rib chiqib ketardi (yuklanish esa ishlab turardi).
 *  2. Uzilganda yarim fayl o'chirilardi — har safar noldan boshlanardi.
 *  3. Bitta xatoda taslim bo'lardi.
 * Endi: yarim fayl saqlanadi, `Range` bilan davom ettiriladi, xatoda qayta
 * urinadi va progress har doim ko'rinadi.
 */
class ModelManager(private val context: Context) {

    companion object {
        private const val TAG = "ModelManager"

        const val MODEL_NAME = "vosk-model-en-us-0.22-lgraph"
        const val MODEL_URL =
            "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22-lgraph.zip"

        /** Foydalanuvchiga ko'rsatish uchun taxminiy hajm. */
        const val MODEL_SIZE_MB = 125

        /**
         * Zip faylning haqiqiy hajmi (serverdan o'lchangan).
         *
         * Server `Content-Length` bermasa (proxy, gzip yoki chunked javob)
         * progress shu songa nisbatan hisoblanadi. Taxminiy son bilan
         * ko'rsatilgan foiz aniq bo'lmasligi mumkin, lekin **qimirlaydi** —
         * bu 0% da qotib turgan ekrandan ancha yaxshi.
         */
        private const val EXPECTED_ZIP_BYTES = 130_557_655L

        /** Yuklab olish + ochish uchun kerakli bo'sh joy (zip + ochilgan fayllar). */
        private const val REQUIRED_FREE_BYTES = 320L * 1024 * 1024

        /** Uzilgan ulanishni necha marta qayta urinib ko'ramiz. */
        private const val MAX_ATTEMPTS = 5

        /** Progress qayta chizilishi orasidagi eng kam vaqt (ms). */
        private const val PROGRESS_INTERVAL_MS = 250L
    }

    private val modelDir: File get() = File(context.filesDir, MODEL_NAME)

    /**
     * Yarim yuklangan zip.
     *
     * `cacheDir` da EMAS: Android xotira siqilganda cache'ni o'zi tozalaydi va
     * bu aynan uzoq yuklanish o'rtasida sodir bo'lishi mumkin.
     */
    private val partFile: File get() = File(context.filesDir, "$MODEL_NAME.zip.part")

    /** Model to'liq yuklab olingan va tayyor bo'lsa true. */
    fun isModelReady(): Boolean =
        File(modelDir, "am").isDirectory && File(modelDir, "conf").isDirectory

    fun modelPath(): String = modelDir.absolutePath

    /** Yarim yuklangan faylda nechta bayt bor (davom ettirishni ko'rsatish uchun). */
    fun partialBytes(): Long = if (partFile.exists()) partFile.length() else 0L

    /**
     * Modelni tayyorlaydi: agar yo'q bo'lsa yuklab olib ochadi.
     *
     * @param onProgress (yuklangan bayt, jami bayt) — jami taxminiy bo'lishi mumkin.
     * @param onUnzip yuklab olish tugab, ochish boshlanganda chaqiriladi.
     * @return model papkasining yo'li.
     */
    suspend fun ensureModel(
        onUnzip: () -> Unit = {},
        onProgress: (downloaded: Long, total: Long) -> Unit,
    ): String = withContext(Dispatchers.IO) {
        if (isModelReady()) {
            removeOutdatedModels()
            onProgress(EXPECTED_ZIP_BYTES, EXPECTED_ZIP_BYTES)
            return@withContext modelDir.absolutePath
        }

        // Yarim qolgan urinishdan qolgan ochilmagan papkani tozalaymiz
        // (zip'ning o'zi SAQLANADI — u davom ettiriladi).
        modelDir.deleteRecursively()

        // Bo'sh joyni tekshirishda allaqachon yuklangan qismni hisobga olamiz.
        val stillNeeded = REQUIRED_FREE_BYTES - partialBytes()
        if (context.filesDir.usableSpace < stillNeeded) {
            error("Xotirada joy yetarli emas. Kamida 320MB bo'sh joy kerak.")
        }

        downloadWithResume(onProgress)

        onUnzip()
        try {
            unzip(partFile, context.filesDir)
        } catch (e: Exception) {
            // Zip buzuq bo'lsa (yarim fayl noto'g'ri ulangan) — noldan boshlaymiz,
            // aks holda foydalanuvchi cheksiz shu xatoga urilib turadi.
            partFile.delete()
            modelDir.deleteRecursively()
            throw IOException("Yuklangan fayl buzuq. Qaytadan urinib ko'ring.", e)
        }

        if (!isModelReady()) {
            partFile.delete()
            modelDir.deleteRecursively()
            error("Model ochilmadi — fayllar to'liq emas")
        }
        partFile.delete()
        removeOutdatedModels()
        modelDir.absolutePath
    }

    /**
     * Zip'ni yuklab oladi, uzilsa `Range` sarlavhasi bilan qolgan joyidan davom ettiradi.
     * Xato bo'lganda yarim fayl O'CHIRILMAYDI — keyingi urinish shu joydan boshlanadi.
     */
    private suspend fun downloadWithResume(onProgress: (Long, Long) -> Unit) {
        var lastError: Exception? = null

        repeat(MAX_ATTEMPTS) { attempt ->
            coroutineContext.ensureActive()
            try {
                downloadOnce(onProgress)
                return
            } catch (e: IOException) {
                lastError = e
                val done = partialBytes()
                Log.w(TAG, "Yuklab olish uzildi ($done bayt olingan), urinish ${attempt + 1}", e)
                // Tarmoq tiklanishiga vaqt beramiz (2s, 4s, 6s…).
                delay(2000L * (attempt + 1))
            }
        }
        throw IOException(
            "Internet uzilib qoldi. Wi-Fi'ga ulanib qayta urinib ko'ring — " +
                "yuklangan qism saqlanadi.",
            lastError,
        )
    }

    private suspend fun downloadOnce(onProgress: (Long, Long) -> Unit) {
        var existing = partialBytes()
        val conn = (URL(MODEL_URL).openConnection() as HttpURLConnection).apply {
            connectTimeout = 20_000
            readTimeout = 60_000
            instanceFollowRedirects = true
            // MUHIM: Android o'zidan `Accept-Encoding: gzip` qo'shadi va javob
            // siqilgan bo'lsa `contentLength` -1 qaytadi — progress o'lik qoladi.
            // Zip allaqachon siqilgan, siqishdan foyda yo'q.
            setRequestProperty("Accept-Encoding", "identity")
            if (existing > 0) setRequestProperty("Range", "bytes=$existing-")
        }
        try {
            conn.connect()
            val code = conn.responseCode
            when {
                // 206 — server davom ettirishga rozi, qolgan qismni yuboryapti.
                code == HttpURLConnection.HTTP_PARTIAL -> Unit
                // 200 — server Range'ni e'tiborsiz qoldirdi, hammasini yubordi.
                code == HttpURLConnection.HTTP_OK -> existing = 0L
                code in 200..299 -> existing = 0L
                else -> throw IOException("Yuklab olishda xato: HTTP $code")
            }

            // Jami hajm: 206 da `Content-Length` faqat QOLGAN qismni bildiradi.
            val reported = conn.contentLengthLong
            val total = when {
                reported > 0 -> reported + existing
                else -> EXPECTED_ZIP_BYTES
            }

            var downloaded = existing
            onProgress(downloaded, total)
            var lastTick = 0L

            conn.inputStream.use { input ->
                FileOutputStream(partFile, existing > 0).use { output ->
                    val buffer = ByteArray(64 * 1024)
                    while (true) {
                        coroutineContext.ensureActive()
                        val read = input.read(buffer)
                        if (read < 0) break
                        output.write(buffer, 0, read)
                        downloaded += read
                        // Har 64KB da UI'ni qayta chizish ortiqcha (2000 marta) —
                        // chorak soniyada bir marta yetarli.
                        val now = System.currentTimeMillis()
                        if (now - lastTick >= PROGRESS_INTERVAL_MS) {
                            lastTick = now
                            onProgress(downloaded, maxOf(total, downloaded))
                        }
                    }
                }
            }
            onProgress(downloaded, maxOf(total, downloaded))
        } finally {
            conn.disconnect()
        }
    }

    /**
     * Eski (boshqa versiyadagi) model papkalarini o'chiradi.
     * Modelni yangilaganimizda foydalanuvchi telefonida 40MB behuda qolib ketmasin.
     */
    private fun removeOutdatedModels() {
        runCatching {
            context.filesDir.listFiles()
                ?.filter { it.isDirectory && it.name.startsWith("vosk-model-") && it.name != MODEL_NAME }
                ?.forEach {
                    Log.i(TAG, "Eski model o'chirilmoqda: ${it.name}")
                    it.deleteRecursively()
                }
        }
    }

    private fun unzip(zip: File, targetDir: File) {
        ZipInputStream(zip.inputStream().buffered()).use { zis ->
            var entry = zis.nextEntry
            while (entry != null) {
                val outFile = File(targetDir, entry.name)
                // Zip Slip himoyasi
                if (!outFile.canonicalPath.startsWith(targetDir.canonicalPath + File.separator)) {
                    error("Xavfli zip yo'li: ${entry.name}")
                }
                if (entry.isDirectory) {
                    outFile.mkdirs()
                } else {
                    outFile.parentFile?.mkdirs()
                    FileOutputStream(outFile).use { fos -> zis.copyTo(fos) }
                }
                zis.closeEntry()
                entry = zis.nextEntry
            }
        }
    }
}
