package uz.speakingapp.ui.progress

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import uz.speakingapp.data.ProgressRepository
import uz.speakingapp.data.db.AttemptEntity
import uz.speakingapp.data.db.ModuleStat

class ProgressViewModel(app: Application) : AndroidViewModel(app) {

    private val repo = ProgressRepository(app)

    val stats: StateFlow<List<ModuleStat>> = repo.observeModuleStats()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val recent: StateFlow<List<AttemptEntity>> = repo.observeAll()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val total: StateFlow<Int> = repo.observeTotalCount()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)
}
