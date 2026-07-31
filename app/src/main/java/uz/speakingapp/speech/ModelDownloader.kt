package uz.speakingapp.speech

import android.content.Context
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Til modelini yuklab olishni **butun ilova darajasida** olib boradi.
 *
 * Nega ViewModel'da emas?
 * 125MB ni yuklash bir necha daqiqa davom etadi. Avval bu ish
 * `viewModelScope.launch` ichida edi — o'quvchi orqaga bosishi, boshqa mashqqa
 * o'tishi yoki telefonni bir zumga qulflashi bilan ViewModel tozalanib,
 * yuklanish yarim yo'lda bekor bo'lardi. Amalda model hech qachon
 * yuklanib bo'lmasdi.
 *
 * Endi yuklanish shu obyektning o'z scope'ida ketadi: ekran almashsa ham davom
 * etadi, uchala ekran (mashq, dialog, suhbat) bitta yuklanishni ko'radi va
 * ikkinchi marta bosilganda ikkinchi yuklanish boshlanmaydi.
 *
 * (Ilova butunlay yopilsa jarayon to'xtaydi — lekin yarim fayl saqlanadi va
 * keyingi safar o'sha joydan davom etadi, [ModelManager] ga qarang.)
 */
object ModelDownloader {

    private const val TAG = "ModelDownloader"

    sealed interface State {
        /** Hali boshlanmagan. */
        data object Idle : State

        /** Yuklanmoqda. [total] taxminiy bo'lishi mumkin. */
        data class Downloading(val downloaded: Long, val total: Long) : State {
            val fraction: Float
                get() = if (total > 0) (downloaded.toFloat() / total).coerceIn(0f, 1f) else 0f
        }

        /** Yuklab olindi, arxiv ochilmoqda (bu ham bir necha soniya oladi). */
        data object Unzipping : State

        data object Ready : State

        data class Failed(val message: String) : State
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _state = MutableStateFlow<State>(State.Idle)
    val state: StateFlow<State> = _state.asStateFlow()

    private var job: Job? = null

    /** Model papkasining yo'li (tayyor bo'lganda ishlatiladi). */
    fun modelPath(context: Context): String = ModelManager(context).modelPath()

    fun isModelReady(context: Context): Boolean = ModelManager(context).isModelReady()

    /**
     * Yuklab olishni boshlaydi. Allaqachon ketayotgan bo'lsa hech narsa qilmaydi —
     * shuning uchun uni xohlagancha ko'p marta chaqirish xavfsiz.
     */
    fun ensure(context: Context) {
        if (job?.isActive == true) return

        val appContext = context.applicationContext
        val manager = ModelManager(appContext)
        if (manager.isModelReady()) {
            _state.value = State.Ready
            return
        }

        // Davom ettirilayotgan bo'lsa progress darhol ko'rinsin (0% da turmasin).
        _state.value = State.Downloading(manager.partialBytes(), 0L)

        job = scope.launch {
            try {
                manager.ensureModel(
                    onUnzip = { _state.value = State.Unzipping },
                    onProgress = { downloaded, total ->
                        _state.value = State.Downloading(downloaded, total)
                    },
                )
                _state.value = State.Ready
                Log.i(TAG, "Model tayyor")
            } catch (e: Exception) {
                Log.w(TAG, "Model tayyorlanmadi", e)
                _state.value = State.Failed(e.message ?: "Model tayyorlanmadi")
            }
        }
    }

    /** Xatodan keyin qaytadan urinish (yarim fayl saqlangani uchun davom etadi). */
    fun retry(context: Context) {
        job?.cancel()
        job = null
        _state.value = State.Idle
        ensure(context)
    }
}

/**
 * "42 MB / 130 MB" ko'rinishidagi matn.
 *
 * Foizdan ko'ra ishonchliroq: foiz sekin o'zgaradi va bola ekran qotib qolgan
 * deb o'ylaydi, megabaytlar esa doim qimirlab turadi.
 */
fun ModelDownloader.State.progressLabel(): String = when (this) {
    is ModelDownloader.State.Downloading -> {
        val mb = downloaded / (1024 * 1024)
        val totalMb = total / (1024 * 1024)
        if (totalMb > 0) "$mb MB / $totalMb MB" else "$mb MB"
    }
    ModelDownloader.State.Unzipping -> "Ochilmoqda…"
    ModelDownloader.State.Ready -> "Tayyor"
    is ModelDownloader.State.Failed -> message
    ModelDownloader.State.Idle -> ""
}
