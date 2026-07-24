package uz.speakingapp.data

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import uz.speakingapp.BuildConfig
import uz.speakingapp.data.model.ContentPack
import uz.speakingapp.data.model.SpeakingModule
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Kontentni yuklaydi. Ustuvorlik:
 *   1) Yuklab olingan kesh (filesDir/content_cache.json) — agar bo'lsa
 *   2) Ichki bundled JSON (assets/content/modules.json) — zaxira
 *
 * [sync] onlayn API'dan yangi versiyani tekshiradi va keshni yangilaydi.
 * API_BASE_URL bo'sh bo'lsa — sync o'tkazib yuboriladi (faqat bundled ishlaydi).
 */
class ContentRepository(private val context: Context) {

    private val json = Json { ignoreUnknownKeys = true }
    private val cacheFile = File(context.filesDir, "content_cache.json")

    @Volatile
    private var cache: ContentPack? = null

    fun loadModules(): List<SpeakingModule> = loadPack().modules

    fun moduleById(id: String): SpeakingModule? =
        loadModules().firstOrNull { it.id == id }

    fun currentVersion(): Int = loadPack().version

    private fun loadPack(): ContentPack {
        cache?.let { return it }
        val pack = readCachedOrBundled()
        cache = pack
        return pack
    }

    private fun readCachedOrBundled(): ContentPack {
        // Avval yuklab olingan keshni sinaymiz.
        if (cacheFile.exists()) {
            runCatching {
                return json.decodeFromString(ContentPack.serializer(), cacheFile.readText())
            }.onFailure { Log.w(TAG, "Kesh o'qilmadi, bundled'ga o'tamiz", it) }
        }
        return readBundled()
    }

    private fun readBundled(): ContentPack {
        val text = context.assets.open("content/modules.json")
            .bufferedReader()
            .use { it.readText() }
        return json.decodeFromString(ContentPack.serializer(), text)
    }

    /**
     * Onlayn kontentni tekshiradi va yangi bo'lsa keshni yangilaydi.
     * @return true — kontent yangilandi (UI qayta yuklashi mumkin).
     */
    suspend fun sync(): Boolean = withContext(Dispatchers.IO) {
        val base = BuildConfig.API_BASE_URL.trimEnd('/')
        if (base.isBlank()) return@withContext false

        val localVersion = loadPack().version
        try {
            val url = URL("$base/api/content?since=$localVersion")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8000
                readTimeout = 12000
                setRequestProperty("Accept", "application/json")
            }
            if (conn.responseCode !in 200..299) {
                conn.disconnect()
                return@withContext false
            }
            val body = conn.inputStream.bufferedReader().use { it.readText() }
            conn.disconnect()

            // Server yangilik yo'q desa {"upToDate":true} qaytaradi.
            if (body.contains("\"upToDate\"")) return@withContext false

            val pack = json.decodeFromString(ContentPack.serializer(), body)
            if (pack.version <= localVersion && cacheFile.exists()) return@withContext false

            cacheFile.writeText(body)
            cache = pack
            Log.i(TAG, "Kontent yangilandi: versiya ${pack.version}")
            true
        } catch (e: Exception) {
            Log.w(TAG, "Sync muvaffaqiyatsiz (offline?)", e)
            false
        }
    }

    private companion object {
        const val TAG = "ContentRepository"
    }
}
