package uz.speakingapp.analysis

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/** Grammatika tekshiruvi natijasi. */
data class GrammarReport(
    val score: Int,
    val issueCount: Int,
    val issues: List<String>,
)

/**
 * LanguageTool ochiq API orqali grammatikani tekshiradi (bepul, kalit shart emas).
 * Onlayn bo'lsa ishlaydi; internet yo'q yoki xato bo'lsa null qaytaradi (baholash grammatikasiz davom etadi).
 */
object GrammarChecker {

    private const val API_URL = "https://api.languagetool.org/v2/check"

    /**
     * Shundan kam so'zda grammatika BAHOLANMAYDI.
     * Sabab: qisqa javobda bitta xato ham foizni keskin oshiradi
     * ("She go to school" — 4 so'z, 1 xato = 25%), bu esa adolatsiz past ball beradi.
     */
    private const val MIN_WORDS = 10

    /**
     * Har 100 so'zdagi xato uchun ayiriladigan ball.
     * Ilgari 8 edi — 20 so'zda 2 ta xato 20 ball berardi va bolani tushkunlikka solardi.
     * 3 bilan xuddi shu javob 70 ball oladi: xato hisobga olinadi, lekin jazolamaydi.
     */
    private const val PENALTY_PER_ERROR_PCT = 3.0

    suspend fun check(text: String, wordCount: Int): GrammarReport? =
        withContext(Dispatchers.IO) {
            if (text.isBlank() || wordCount < MIN_WORDS) return@withContext null
            try {
                val body = "text=" + URLEncoder.encode(text, "UTF-8") +
                    "&language=en-US&level=default"
                val conn = (URL(API_URL).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 10000
                    readTimeout = 15000
                    doOutput = true
                    setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
                    setRequestProperty("Accept", "application/json")
                }
                OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(body) }
                if (conn.responseCode !in 200..299) {
                    conn.disconnect()
                    return@withContext null
                }
                val response = conn.inputStream.bufferedReader().use { it.readText() }
                conn.disconnect()
                parse(response, wordCount)
            } catch (_: Exception) {
                null
            }
        }

    private fun parse(json: String, wordCount: Int): GrammarReport {
        val matches = JSONObject(json).optJSONArray("matches")
        val issues = mutableListOf<String>()
        val count = matches?.length() ?: 0
        if (matches != null) {
            for (i in 0 until minOf(count, 5)) {
                val m = matches.getJSONObject(i)
                val message = m.optString("shortMessage").ifBlank { m.optString("message") }
                val replacements = m.optJSONArray("replacements")
                val suggestion = if (replacements != null && replacements.length() > 0) {
                    replacements.getJSONObject(0).optString("value")
                } else ""
                issues.add(if (suggestion.isNotBlank()) "$message → \"$suggestion\"" else message)
            }
        }
        // Har 100 so'zga to'g'ri keladigan xato asosida ball
        val errorsPer100 = count * 100.0 / wordCount
        val score = (100 - errorsPer100 * PENALTY_PER_ERROR_PCT).toInt().coerceIn(0, 100)
        return GrammarReport(score = score, issueCount = count, issues = issues)
    }
}
