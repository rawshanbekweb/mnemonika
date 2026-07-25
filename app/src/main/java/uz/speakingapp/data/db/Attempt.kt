package uz.speakingapp.data.db

import androidx.room.ColumnInfo
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
    // ── v2: offline navbat uchun qo'shildi ───────────────────────────
    // defaultValue lar MIGRATION_1_2 dagi ALTER TABLE bilan aynan bir xil bo'lishi shart —
    // aks holda Room ochilishda sxemani tekshirganda migratsiyani "noto'g'ri" deb rad etadi.
    @ColumnInfo(defaultValue = "0") val uniqueWordCount: Int = 0,
    @ColumnInfo(defaultValue = "") val transcript: String = "",
    /** false — natija hali serverga (o'qituvchi paneliga) yuborilmagan. */
    @ColumnInfo(defaultValue = "0") val synced: Boolean = false,
)

/** Modul bo'yicha umumlashtirilgan statistika. */
data class ModuleStat(
    val moduleId: String,
    val attempts: Int,
    val avgScore: Int,
    val bestScore: Int,
)
