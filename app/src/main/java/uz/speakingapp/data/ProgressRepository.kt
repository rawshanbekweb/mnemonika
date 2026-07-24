package uz.speakingapp.data

import android.content.Context
import kotlinx.coroutines.flow.Flow
import uz.speakingapp.analysis.SpeechResult
import uz.speakingapp.data.db.AppDatabase
import uz.speakingapp.data.db.AttemptEntity
import uz.speakingapp.data.db.ModuleStat

/** Mashq natijalarini (progress) saqlaydi va o'qiydi. */
class ProgressRepository(context: Context) {

    private val appContext = context.applicationContext
    private val dao = AppDatabase.get(context).attemptDao()

    suspend fun saveAttempt(
        moduleId: String,
        exerciseId: String,
        exerciseTitle: String,
        result: SpeechResult,
        timestamp: Long,
    ) {
        dao.insert(
            AttemptEntity(
                moduleId = moduleId,
                exerciseId = exerciseId,
                exerciseTitle = exerciseTitle,
                timestamp = timestamp,
                overallScore = result.overallScore,
                wordCount = result.wordCount,
                wordsPerMinute = result.wordsPerMinute,
                durationSec = result.durationSec,
                keywordCoverage = result.keywordCoverage,
                grammarScore = result.grammarScore,
            )
        )
        // Backend sozlangan bo'lsa natijani o'qituvchi paneliga ham yuboramiz (best-effort).
        AttemptUploader.upload(appContext, moduleId, exerciseId, exerciseTitle, result)
    }

    fun observeAll(): Flow<List<AttemptEntity>> = dao.observeAll()
    fun observeModuleStats(): Flow<List<ModuleStat>> = dao.observeModuleStats()
    fun observeTotalCount(): Flow<Int> = dao.observeTotalCount()
}
