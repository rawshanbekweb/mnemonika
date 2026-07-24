package uz.speakingapp.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

/** O'quvchining bitta mashq urinishi natijasi. */
@Entity(tableName = "attempts")
data class AttemptEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val moduleId: String,
    val exerciseId: String,
    val exerciseTitle: String,
    val timestamp: Long,
    val overallScore: Int,
    val wordCount: Int,
    val wordsPerMinute: Int,
    val durationSec: Int,
    val keywordCoverage: Int,
    val grammarScore: Int? = null,
)

/** Modul bo'yicha umumlashtirilgan statistika. */
data class ModuleStat(
    val moduleId: String,
    val attempts: Int,
    val avgScore: Int,
    val bestScore: Int,
)
