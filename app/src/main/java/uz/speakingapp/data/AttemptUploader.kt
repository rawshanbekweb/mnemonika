package uz.speakingapp.data

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import uz.speakingapp.BuildConfig
import uz.speakingapp.analysis.SpeechResult
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

/**
 * O'quvchi natijasini backend'ga (Vercel /api/attempts) yuboradi — o'qituvchi paneli uchun.
 * Best-effort: internet yoki sozlama bo'lmasa jimgina o'tkazib yuboriladi.
 */
object AttemptUploader {

    private const val PREFS = "speakup_prefs"
    private const val KEY_DEVICE_ID = "device_id"

    /** Qurilma uchun barqaror anonim ID (SharedPreferences'da saqlanadi). */
    fun deviceId(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        prefs.getString(KEY_DEVICE_ID, null)?.let { return it }
        val id = "dev_" + UUID.randomUUID().toString().take(12)
        prefs.edit().putString(KEY_DEVICE_ID, id).apply()
        return id
    }

    suspend fun upload(
        context: Context,
        moduleId: String,
        exerciseId: String,
        exerciseTitle: String,
        result: SpeechResult,
    ) = withContext(Dispatchers.IO) {
        val base = BuildConfig.API_BASE_URL.trimEnd('/')
        val token = BuildConfig.ATTEMPTS_TOKEN
        if (base.isBlank() || token.isBlank()) return@withContext

        val payload = JSONObject().apply {
            put("studentId", deviceId(context))
            put("moduleId", moduleId)
            put("exerciseId", exerciseId)
            put("exerciseTitle", exerciseTitle)
            put("overallScore", result.overallScore)
            put("grammarScore", result.grammarScore ?: JSONObject.NULL)
            put("wordsPerMinute", result.wordsPerMinute)
            put("wordCount", result.wordCount)
            put("uniqueWordCount", result.uniqueWordCount)
            put("durationSec", result.durationSec)
            put("keywordCoverage", result.keywordCoverage)
            put("transcript", result.transcript)
        }

        try {
            val conn = (URL("$base/api/attempts").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 8000
                readTimeout = 10000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("x-ingest-token", token)
            }
            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(payload.toString()) }
            conn.responseCode // yuborishni majburlaydi
            conn.disconnect()
        } catch (e: Exception) {
            Log.w("AttemptUploader", "Natija yuborilmadi (offline?)", e)
        }
    }
}
