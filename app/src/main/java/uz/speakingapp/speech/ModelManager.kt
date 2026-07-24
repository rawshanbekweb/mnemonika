package uz.speakingapp.speech

import android.content.Context
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
 */
class ModelManager(private val context: Context) {

    companion object {
        const val MODEL_NAME = "vosk-model-small-en-us-0.15"
        const val MODEL_URL =
            "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
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
                onProgress(1f)
                return@withContext modelDir.absolutePath
            }
            val zipFile = File(context.cacheDir, "$MODEL_NAME.zip")
            try {
                download(MODEL_URL, zipFile) { p -> onProgress(p * 0.9f) }
                unzip(zipFile, context.filesDir)
                onProgress(1f)
            } finally {
                zipFile.delete()
            }
            if (!isModelReady()) {
                error("Model ochilmadi — fayllar to'liq emas")
            }
            modelDir.absolutePath
        }

    private fun download(urlString: String, dest: File, onProgress: (Float) -> Unit) {
        val conn = (URL(urlString).openConnection() as HttpURLConnection).apply {
            connectTimeout = 15000
            readTimeout = 30000
            instanceFollowRedirects = true
        }
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
        conn.disconnect()
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
