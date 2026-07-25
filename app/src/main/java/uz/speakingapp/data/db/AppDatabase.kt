package uz.speakingapp.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(entities = [AttemptEntity::class], version = 2, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun attemptDao(): AttemptDao

    companion object {
        @Volatile
        private var instance: AppDatabase? = null

        /**
         * v1 → v2: offline navbat uchun uchta ustun qo'shildi.
         * Mavjud natijalar `synced = 1` deb belgilanadi — ular allaqachon
         * yuborilgan (yoki yuborilmagan) bo'lsa ham qayta yuborilmasin.
         */
        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                // DEFAULT qiymatlari AttemptEntity dagi @ColumnInfo(defaultValue = ...) bilan mos.
                db.execSQL("ALTER TABLE attempts ADD COLUMN uniqueWordCount INTEGER NOT NULL DEFAULT 0")
                db.execSQL("ALTER TABLE attempts ADD COLUMN transcript TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE attempts ADD COLUMN synced INTEGER NOT NULL DEFAULT 0")
                // Eski natijalar allaqachon yuborilgan (yoki yuborish imkoni yo'q) —
                // ularni qayta yubormaslik uchun "synced" deb belgilaymiz.
                db.execSQL("UPDATE attempts SET synced = 1")
            }
        }

        fun get(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "speakup.db",
                )
                    .addMigrations(MIGRATION_1_2)
                    .build()
                    .also { instance = it }
            }
    }
}
