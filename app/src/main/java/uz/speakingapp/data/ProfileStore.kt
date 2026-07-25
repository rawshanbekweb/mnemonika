package uz.speakingapp.data

import android.content.Context
import java.util.UUID

/**
 * O'quvchi profili. Bolalar ilovasi bo'lgani uchun parol yo'q —
 * faqat ism va sinf, qurilmada saqlanadi. Barqaror `deviceId` esa
 * natijalarni o'qituvchi panelida bir o'quvchiga bog'lash uchun ishlatiladi.
 */
data class StudentProfile(
    val deviceId: String,
    val name: String,
    val classGroup: String,
) {
    /** Ro'yxatdan o'tish yakunlangan bo'lsa true (ism kiritilgan). */
    val isComplete: Boolean get() = name.isNotBlank()

    /** Salomlashish uchun faqat ism. */
    val firstName: String
        get() = name.trim().substringBefore(' ').ifBlank { "do'stim" }
}

class ProfileStore(context: Context) {

    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** Qurilma uchun barqaror anonim ID (birinchi murojaatda yaratiladi). */
    fun deviceId(): String {
        prefs.getString(KEY_DEVICE_ID, null)?.let { return it }
        val id = "dev_" + UUID.randomUUID().toString().take(12)
        prefs.edit().putString(KEY_DEVICE_ID, id).apply()
        return id
    }

    fun load(): StudentProfile = StudentProfile(
        deviceId = deviceId(),
        name = prefs.getString(KEY_NAME, "").orEmpty(),
        classGroup = prefs.getString(KEY_CLASS, "").orEmpty(),
    )

    fun save(name: String, classGroup: String) {
        prefs.edit()
            .putString(KEY_NAME, name.trim().take(60))
            .putString(KEY_CLASS, classGroup.trim().take(24))
            .apply()
    }

    private companion object {
        const val PREFS = "speakup_prefs"

        // Eski versiyalarda ham shu kalit ishlatilgan — ID o'zgarmasligi uchun saqlaymiz.
        const val KEY_DEVICE_ID = "device_id"
        const val KEY_NAME = "student_name"
        const val KEY_CLASS = "student_class"
    }
}
