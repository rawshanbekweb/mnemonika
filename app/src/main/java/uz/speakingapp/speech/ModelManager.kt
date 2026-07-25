package uz.speakingapp.speech

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.zip.ZipInputStream

/**
 * Vosk offline nutq modelini boshqaradi.
 * Birinchi marta modelni internetdan yuklab oladi va telefon ichiga saqlaydi,
 * keyingi safar to'g'ridan-to'g'ri offline ishlatiladi.
 *
 * Model tanlovi: `lgraph` (~125MB) ataylab kichik `small` (~40MB) o'rniga olindi.
 * Kichik model bolalar ovozi va o'zbek aksentli ingliz tilida juda ko'p xato qilardi;
 * lgraph sezilarli aniqroq va hamon to'liq offline ishlaydi.
 */
class ModelManager(private val context: Context) {

    companion object {
        private const val TAG = "ModelManager"

        const val MODEL_NAME = "vosk-model-en-us-0.22-lgraph"
        const val MODEL_URL =
            "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22-lgraph.zip"

        /** Foydalanuvchiga ko'rsatish uchun taxminiy hajm. */
        const val MODEL_SIZE_MB = 125

        /** Yuklab olish + ochish uchun kerakli bo'sh joy (zip + ochilgan fayllar). */
        private const val REQUIRED_FREE_BYTES = 320L * 1024 * 1024
    }

    private val modelDir: File get() = File(context.filesDir, MODEL_NAME)

    /** Model to'liq yuklab olingan va tayyor bo'lsa true. */
    fun isModelReady(): Boolean =
        File(modelDir, "am").isDirectory && File(modelDir, "conf").isDirectory

    fun modelPath(): String = modelDir.absolutePath

    /**
     * Modelni tayyorlaydi: agar yo'q bo'lsa yuklab olib ochadi.
     * @param onProgress 0f..1f oralig'ida taraqqiyot.
     * @return model papkasining yo'li.
     */
    suspend fun ensureModel(onProgress: (Float) -> Unit): String =
        withContext(Dispatchers.IO) {
            if (isModelReady()) {
                removeOutdatedModels()
                onProgress(1f)
                return@withContext modelDir.absolutePath
            }

            if (context.filesDir.usableSpace < REQUIRED_FREE_BYTES) {
                error("Xotirada joy yetarli emas. Kamida 320MB bo'sh joy kerak.")
            }

            // Yarim qolgan urinishdan qolgan papkani tozalaymiz.
            modelDir.deleteRecursively()

            val zipFile = File(context.cacheDir, "$MODEL_NAME.zip")
            try {
                download(MODEL_URL, zipFile) { p -> onProgress(p * 0.9f) }
                unzip(zipFile, context.filesDir)
                onProgress(1f)
            } finally {
                zipFile.delete()
            }
            if (!isModelReady()) {
                modelDir.deleteRecursively()
                error("Model ochilmadi — fayllar to'liq emas")
            }
            removeOutdatedModels()
            modelDir.absolutePath
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

    private fun download(urlString: String, dest: File, onProgress: (Float) -> Unit) {
        val conn = (URL(urlString).openConnection() as HttpURLConnection).apply {
            connectTimeout = 15000
            readTimeout = 30000
            instanceFollowRedirects = true
        }
        try {
            conn.connect()
            if (conn.responseCode !in 200..299) {
                error("Yuklab olishda xato: HTTP ${conn.responseCode}")
            }
            val total = conn.contentLengthLong.takeIf { it > 0 }
            conn.inputStream.use { input ->
                FileOutputStream(dest).use { output ->
                    val buffer = ByteArray(64 * 1024)
                    var downloaded = 0L
                    while (true) {
                        val read = input.read(buffer)
                        if (read < 0) break
                        output.write(buffer, 0, read)
                        downloaded += read
                        if (total != null) onProgress(downloaded.toFloat() / total)
                    }
                }
            }
        } finally {
            conn.disconnect()
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
