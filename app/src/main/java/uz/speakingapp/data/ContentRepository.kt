package uz.speakingapp.data

import android.content.Context
import kotlinx.serialization.json.Json
import uz.speakingapp.data.model.ContentPack
import uz.speakingapp.data.model.SpeakingModule

/**
 * Kontentni yuklaydi. Hozircha assets ichidagi bundled JSON'dan.
 * Keyingi bosqichda: avval online yangi versiyani tekshiradi, bo'lmasa bundled zaxiradan.
 */
class ContentRepository(private val context: Context) {

    private val json = Json { ignoreUnknownKeys = true }

    private var cache: ContentPack? = null

    fun loadModules(): List<SpeakingModule> {
        val pack = cache ?: readBundled().also { cache = it }
        return pack.modules
    }

    fun moduleById(id: String): SpeakingModule? =
        loadModules().firstOrNull { it.id == id }

    private fun readBundled(): ContentPack {
        val text = context.assets.open("content/modules.json")
            .bufferedReader()
            .use { it.readText() }
        return json.decodeFromString(ContentPack.serializer(), text)
    }
}
