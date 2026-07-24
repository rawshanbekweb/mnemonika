package uz.speakingapp.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface AttemptDao {

    @Insert
    suspend fun insert(attempt: AttemptEntity): Long

    @Query("SELECT * FROM attempts ORDER BY timestamp DESC")
    fun observeAll(): Flow<List<AttemptEntity>>

    @Query("SELECT * FROM attempts WHERE moduleId = :moduleId ORDER BY timestamp DESC")
    fun observeByModule(moduleId: String): Flow<List<AttemptEntity>>

    @Query(
        """
        SELECT moduleId AS moduleId,
               COUNT(*) AS attempts,
               CAST(AVG(overallScore) AS INTEGER) AS avgScore,
               MAX(overallScore) AS bestScore
        FROM attempts
        GROUP BY moduleId
        """
    )
    fun observeModuleStats(): Flow<List<ModuleStat>>

    @Query("SELECT COUNT(*) FROM attempts")
    fun observeTotalCount(): Flow<Int>
}
