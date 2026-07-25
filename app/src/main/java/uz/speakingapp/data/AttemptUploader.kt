package uz.speakingapp.data

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import uz.speakingapp.BuildConfig
import uz.speakingapp.data.db.AppDatabase
import uz.speakingapp.data.db.AttemptEntity
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * O'quvchi natijasini backend'ga (Vercel /api/attempts) yuboradi — o'qituvchi paneli uchun.
 *
 * Natija avval Room'ga `synced = false` bilan yoziladi, keyin shu yerdan yuboriladi.
 * Internet bo'lmasa yozuv bazada qoladi va keyingi imkoniyatda [flushPending] uni yuboradi —
 * shuning uchun offline bajarilgan mashqlar ham yo'qolmaydi.
 */
object AttemptUploader {

    private const val TAG = "AttemptUploader"

    private val baseUrl: String get() = BuildConfig.API_BASE_URL.trimEnd('/')
    private val token: String get() = BuildConfig.ATTEMPTS_TOKEN

    /** Backend sozlangan bo'lsa true (aks holda ilova butunlay offline ishlaydi). */
    fun isConfigured(): Boolean = baseUrl.isNotBlank() && token.isNotBlank()

    /**
     * Bitta natijani yuboradi.
     * @return true — server qabul qildi (yozuvni `synced` deb belgilash mumkin).
     */
    suspend fun upload(context: Context, attempt: AttemptEntity): Boolean =
        withContext(Dispatchers.IO) {
            if (!isConfigured()) return@withContext false

            val profile = ProfileStore(context).load()
            val payload = JSONObject().apply {
                put("studentId", profile.deviceId)
                put("studentName", profile.name)
                put("classGroup", profile.classGroup)
                put("moduleId", attempt.moduleId)
                put("exerciseId", attempt.exerciseId)
                put("exerciseTitle", attempt.exerciseTitle)
                put("overallScore", attempt.overallScore)
                put("grammarScore", attempt.grammarScore ?: JSONObject.NULL)
                put("wordsPerMinute", attempt.wordsPerMinute)
                put("wordCount", attempt.wordCount)
                put("uniqueWordCount", attempt.uniqueWordCount)
                put("durationSec", attempt.durationSec)
                put("keywordCoverage", attempt.keywordCoverage)
                put("transcript", attempt.transcript)
            }

            var conn: HttpURLConnection? = null
            try {
                conn = (URL("$baseUrl/api/attempts").openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 8000
                    readTimeout = 10000
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("x-ingest-token", token)
                }
                OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(payload.toString()) }
                val code = conn.responseCode
                // 4xx — so'rov noto'g'ri (token/format): qayta urinish foyda bermaydi,
                // shuning uchun uni ham "yakunlangan" deb hisoblaymiz va navbatni tiqilib qolishdan saqlaymiz.
                when {
                    code in 200..299 -> true
                    code in 400..499 -> {
                        Log.w(TAG, "Server natijani rad etdi (HTTP $code) — qayta urinilmaydi")
                        true
                    }
                    else -> false
                }
            } catch (e: Exception) {
                Log.w(TAG, "Natija yuborilmadi (offline?)", e)
                false
            } finally {
                conn?.disconnect()
            }
        }

    /**
     * Bazadagi yuborilmagan natijalarni ketma-ket yuboradi.
     * Birinchi muvaffaqiyatsizlikda to'xtaydi (internet yo'q — keyinroq qayta uriniladi).
     * @return yuborilgan yozuvlar soni.
     */
    suspend fun flushPending(context: Context): Int = withContext(Dispatchers.IO) {
        if (!isConfigured()) return@withContext 0
        val dao = AppDatabase.get(context).attemptDao()
        var sent = 0
        for (attempt in dao.pendingUploads()) {
            if (!upload(context, attempt)) break
            dao.markSynced(attempt.id)
            sent++
        }
        if (sent > 0) Log.i(TAG, "$sent ta natija serverga yuborildi")
        sent
    }
}
