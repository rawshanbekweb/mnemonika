package uz.speakingapp.analysis

import uz.speakingapp.data.db.AttemptEntity
import java.util.TimeZone

/** Bitta nishon (badge). */
data class Badge(
    val id: String,
    val emoji: String,
    val title: String,
    val hint: String,
    val unlocked: Boolean,
)

/** O'yin mexanikalari holati — daraja, XP, kunlik seriya va nishonlar. */
data class GameStats(
    val totalXp: Int,
    val level: Int,
    val levelTitle: String,
    val xpInLevel: Int,
    val xpPerLevel: Int,
    val streakDays: Int,
    val bestStreak: Int,
    val practicedToday: Boolean,
    val totalAttempts: Int,
    val totalWords: Int,
    val badges: List<Badge>,
) {
    val levelProgress: Float
        get() = if (xpPerLevel == 0) 0f else xpInLevel.toFloat() / xpPerLevel

    val unlockedBadges: Int get() = badges.count { it.unlocked }
}

/**
 * Mahalliy natijalardan (Room) motivatsiya ko'rsatkichlarini hisoblaydi.
 * Hech qanday server kerak emas — hammasi offline ishlaydi.
 */
object Gamification {

    private const val XP_PER_LEVEL = 400

    private val LEVEL_TITLES = listOf(
        "Yangi boshlovchi",
        "Mashqchi",
        "Suhbatdosh",
        "Notiq",
        "Usta notiq",
        "Chempion",
    )

    fun compute(attempts: List<AttemptEntity>, moduleCount: Int): GameStats {
        // XP: har bir urinish o'z balliga teng XP beradi.
        val totalXp = attempts.sumOf { it.overallScore }
        val level = totalXp / XP_PER_LEVEL + 1
        val xpInLevel = totalXp % XP_PER_LEVEL

        val days = attempts.map { dayIndex(it.timestamp) }.toSortedSet()
        val today = dayIndex(System.currentTimeMillis())
        val streak = currentStreak(days, today)
        val best = bestStreak(days)

        val totalWords = attempts.sumOf { it.wordCount }
        val bestScore = attempts.maxOfOrNull { it.overallScore } ?: 0
        val modulesTried = attempts.map { it.moduleId }.toSet().size

        val badges = listOf(
            Badge("first", "🌟", "Birinchi qadam", "Birinchi mashqni bajar", attempts.isNotEmpty()),
            Badge("five", "🔥", "5 ta mashq", "5 ta mashq bajar", attempts.size >= 5),
            Badge("twenty", "💪", "20 ta mashq", "20 ta mashq bajar", attempts.size >= 20),
            Badge("score80", "🏆", "Zo'r natija", "80+ ball to'pla", bestScore >= 80),
            Badge("score95", "👑", "Mukammal", "95+ ball to'pla", bestScore >= 95),
            Badge("streak3", "📅", "3 kun ketma-ket", "3 kun to'xtamay mashq qil", best >= 3),
            Badge("streak7", "🗓️", "Bir hafta", "7 kun to'xtamay mashq qil", best >= 7),
            Badge(
                "explorer", "🧭", "Kashfiyotchi", "Barcha modullarni sinab ko'r",
                moduleCount > 0 && modulesTried >= moduleCount,
            ),
            Badge("talker", "💬", "500 so'z", "Jami 500 ta so'z gapir", totalWords >= 500),
        )

        return GameStats(
            totalXp = totalXp,
            level = level,
            levelTitle = LEVEL_TITLES.getOrElse(level - 1) { LEVEL_TITLES.last() },
            xpInLevel = xpInLevel,
            xpPerLevel = XP_PER_LEVEL,
            streakDays = streak,
            bestStreak = best,
            practicedToday = days.contains(today),
            totalAttempts = attempts.size,
            totalWords = totalWords,
            badges = badges,
        )
    }

    /** Mahalliy vaqt mintaqasidagi kun raqami (1970-01-01 dan boshlab). */
    private fun dayIndex(timestamp: Long): Long {
        val offset = TimeZone.getDefault().getOffset(timestamp)
        return Math.floorDiv(timestamp + offset, 86_400_000L)
    }

    /**
     * Joriy seriya: bugundan (yoki kechadan — bugun hali mashq qilmagan bo'lsa)
     * orqaga qarab uzluksiz kunlar soni.
     */
    private fun currentStreak(days: Set<Long>, today: Long): Int {
        var cursor = when {
            days.contains(today) -> today
            days.contains(today - 1) -> today - 1
            else -> return 0
        }
        var count = 0
        while (days.contains(cursor)) {
            count++
            cursor--
        }
        return count
    }

    /** Eng uzun uzluksiz kunlar seriyasi (butun tarix bo'yicha). */
    private fun bestStreak(days: Set<Long>): Int {
        if (days.isEmpty()) return 0
        var best = 1
        var run = 1
        val sorted = days.sorted()
        for (i in 1 until sorted.size) {
            run = if (sorted[i] == sorted[i - 1] + 1) run + 1 else 1
            if (run > best) best = run
        }
        return best
    }
}
