package uz.speakingapp.ui.progress

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import uz.speakingapp.data.AttemptUploader
import uz.speakingapp.data.ProgressRepository
import uz.speakingapp.data.db.AttemptEntity
import uz.speakingapp.data.db.ExerciseStat
import uz.speakingapp.data.db.ModuleStat

class ProgressViewModel(app: Application) : AndroidViewModel(app) {

    private val repo = ProgressRepository(app)

    val stats: StateFlow<List<ModuleStat>> = repo.observeModuleStats()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val recent: StateFlow<List<AttemptEntity>> = repo.observeAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    /** Mashq bo'yicha eng yaxshi ball — modul ro'yxatlarida ko'rsatiladi. */
    val exerciseStats: StateFlow<Map<String, ExerciseStat>> = repo.observeExerciseStats()
        .map { list -> list.associateBy { it.exerciseId } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyMap())

    val total: StateFlow<Int> = repo.observeTotalCount()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    /**
     * Hali o'qituvchi paneliga yuborilmagan (offline qolgan) natijalar soni.
     * Backend umuman sozlanmagan bo'lsa 0 — bunda "kutmoqda" deyish noto'g'ri bo'lardi.
     */
    val pending: StateFlow<Int> = repo.observePendingCount()
        .map { if (AttemptUploader.isConfigured()) it else 0 }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)
}
