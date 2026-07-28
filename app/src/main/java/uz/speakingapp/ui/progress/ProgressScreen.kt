package uz.speakingapp.ui.progress

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.RecordVoiceOver
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.speakingapp.analysis.Badge
import uz.speakingapp.analysis.GameStats
import uz.speakingapp.analysis.Gamification
import uz.speakingapp.data.db.AttemptEntity
import uz.speakingapp.data.model.SpeakingModule
import uz.speakingapp.ui.theme.BrandProgressBar
import uz.speakingapp.ui.theme.BrandTopBar
import uz.speakingapp.ui.theme.Bulbul
import uz.speakingapp.ui.theme.Gold
import uz.speakingapp.ui.theme.HairLine
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.Mascot
import uz.speakingapp.ui.theme.MascotMood
import uz.speakingapp.ui.theme.SunnyContainer
import uz.speakingapp.ui.theme.SunnyDeep
import uz.speakingapp.ui.theme.pagePattern
import uz.speakingapp.ui.theme.wiggle
import uz.speakingapp.ui.theme.InkStrong
import uz.speakingapp.ui.theme.Navy
import uz.speakingapp.ui.theme.OutlineSoft
import uz.speakingapp.ui.theme.OverlineLabel
import uz.speakingapp.ui.theme.ScoreRing
import uz.speakingapp.ui.theme.SectionTitle
import uz.speakingapp.ui.theme.SoftCard
import uz.speakingapp.ui.theme.SurfaceMuted
import uz.speakingapp.ui.theme.accentColorFor

/** Nishon belgilari — emoji o'rniga vektor ikonka. */
private fun badgeIcon(id: String): ImageVector = when (id) {
    "first" -> Icons.Default.Flag
    "five" -> Icons.Default.LocalFireDepartment
    "twenty" -> Icons.Default.FitnessCenter
    "score80" -> Icons.Default.EmojiEvents
    "score95" -> Icons.Default.WorkspacePremium
    "streak3" -> Icons.Default.CalendarToday
    "streak7" -> Icons.Default.CalendarMonth
    "explorer" -> Icons.Default.Explore
    else -> Icons.Default.RecordVoiceOver
}

@Composable
fun ProgressScreen(
    modules: List<SpeakingModule>,
    onBack: () -> Unit,
) {
    val vm: ProgressViewModel = viewModel()
    val stats by vm.stats.collectAsStateWithLifecycle()
    val recent by vm.recent.collectAsStateWithLifecycle()
    val total by vm.total.collectAsStateWithLifecycle()
    val pending by vm.pending.collectAsStateWithLifecycle()

    val game = remember(recent, modules.size) { Gamification.compute(recent, modules.size) }
    val titleByModule = modules.associate { it.id to it.titleUz }
    val typeByModule = modules.associate { it.id to it.type }

    Column(modifier = Modifier.fillMaxSize().pagePattern()) {
        BrandTopBar(title = "Natijalarim", onBack = onBack)

        if (total == 0) {
            // Bo'sh ekran ham bo'm-bo'sh ko'rinmasin: Bulbul kutib turadi.
            Column(
                modifier = Modifier.fillMaxSize().padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Spacer(Modifier.size(40.dp))
                Mascot(look = Bulbul, mood = MascotMood.Idle, size = 120.dp)
                Spacer(Modifier.size(16.dp))
                Text("Hali natijalar yo'q", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.size(8.dp))
                Text(
                    "Birinchi mashqni bajar — natijang shu yerda paydo bo'ladi.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = InkMuted,
                    textAlign = TextAlign.Center,
                )
            }
            return@Column
        }

        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item { LevelCard(game) }
            item { StreakCard(game) }
            item { OverallCard(recent, total, game, pending) }

            item { SectionTitle("Nishonlar · ${game.unlockedBadges}/${game.badges.size}") }
            item { BadgesCard(game.badges) }

            item { SectionTitle("Modullar bo'yicha") }
            items(stats, key = { it.moduleId }) { stat ->
                SoftCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            titleByModule[stat.moduleId] ?: stat.moduleId,
                            style = MaterialTheme.typography.titleSmall,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            "${stat.avgScore}/100",
                            style = MaterialTheme.typography.titleMedium,
                            color = Navy,
                        )
                    }
                    Spacer(Modifier.size(10.dp))
                    BrandProgressBar(
                        progress = stat.avgScore / 100f,
                        brush = SolidColor(accentColorFor(typeByModule[stat.moduleId] ?: "")),
                    )
                    Spacer(Modifier.size(8.dp))
                    Text(
                        "Eng yaxshi ${stat.bestScore} · ${stat.attempts} urinish",
                        style = MaterialTheme.typography.bodySmall,
                        color = InkMuted,
                    )
                }
            }

            item { SectionTitle("So'nggi urinishlar") }
            items(recent.take(20), key = { it.id }) { attempt ->
                RecentRow(attempt)
            }
        }
    }
}

@Composable
private fun LevelCard(game: GameStats) {
    SoftCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Bulbul darajaga qarab quvonadi — daraja shunchaki raqam emas.
            Mascot(
                look = Bulbul,
                mood = if (game.level > 1) MascotMood.Happy else MascotMood.Idle,
                size = 56.dp,
            )
            Spacer(Modifier.size(12.dp))
            Column(Modifier.weight(1f)) {
                Text("DARAJA ${game.level}", style = OverlineLabel, color = InkMuted)
                Spacer(Modifier.size(4.dp))
                Text(game.levelTitle, style = MaterialTheme.typography.titleMedium)
            }
            Text("${game.totalXp} XP", style = MaterialTheme.typography.titleMedium, color = Navy)
        }
        Spacer(Modifier.size(14.dp))
        BrandProgressBar(progress = game.levelProgress)
        Spacer(Modifier.size(8.dp))
        Text(
            "Keyingi darajagacha ${game.xpPerLevel - game.xpInLevel} XP",
            style = MaterialTheme.typography.bodySmall,
            color = InkMuted,
        )
    }
}

@Composable
private fun StreakCard(game: GameStats) {
    SoftCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Default.LocalFireDepartment,
                contentDescription = null,
                tint = if (game.streakDays > 0) Gold else OutlineSoft,
                modifier = Modifier.size(28.dp),
            )
            Spacer(Modifier.size(14.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    if (game.streakDays > 0) "${game.streakDays} kunlik seriya" else "Seriya boshlanmagan",
                    style = MaterialTheme.typography.titleSmall,
                )
                Spacer(Modifier.size(2.dp))
                Text(
                    when {
                        game.practicedToday -> "Bugungi mashq bajarildi"
                        game.streakDays > 0 -> "Bugun ham mashq qilsangiz seriya davom etadi"
                        else -> "Bugun bitta mashq bajaring va seriyani boshlang"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
            }
        }
        if (game.bestStreak > 0) {
            Spacer(Modifier.size(10.dp))
            HairLine()
            Spacer(Modifier.size(10.dp))
            Text(
                "Eng uzun seriya · ${game.bestStreak} kun",
                style = OverlineLabel,
                color = InkMuted,
            )
        }
    }
}

@Composable
private fun OverallCard(
    recent: List<AttemptEntity>,
    total: Int,
    game: GameStats,
    pending: Int,
) {
    val overallAvg = if (recent.isNotEmpty()) recent.map { it.overallScore }.average().toInt() else 0
    SoftCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            ScoreRing(overallAvg, ringSize = 96.dp, stroke = 7.dp)
            Spacer(Modifier.size(20.dp))
            Column {
                Text("Umumiy o'rtacha", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.size(6.dp))
                Text("$total ta urinish", style = MaterialTheme.typography.bodySmall, color = InkMuted)
                Text("${game.totalWords} ta so'z", style = MaterialTheme.typography.bodySmall, color = InkMuted)
                if (pending > 0) {
                    Spacer(Modifier.size(6.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.CloudUpload,
                            contentDescription = null,
                            tint = InkMuted,
                            modifier = Modifier.size(13.dp),
                        )
                        Spacer(Modifier.size(5.dp))
                        Text(
                            "$pending ta yuborilmagan",
                            style = MaterialTheme.typography.bodySmall,
                            color = InkMuted,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun BadgesCard(badges: List<Badge>) {
    SoftCard {
        badges.chunked(3).forEachIndexed { rowIndex, row ->
            if (rowIndex > 0) Spacer(Modifier.size(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                row.forEach { badge -> BadgeTile(badge, Modifier.weight(1f)) }
                repeat(3 - row.size) { Spacer(Modifier.weight(1f)) }
            }
        }
    }
}

@Composable
private fun BadgeTile(badge: Badge, modifier: Modifier = Modifier) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        // Ochilgan nishon goho chayqalib diqqatni tortadi; ochilmagani tinch turadi.
        Box(
            modifier = Modifier
                .size(56.dp)
                .wiggle(active = badge.unlocked)
                .clip(CircleShape)
                .background(if (badge.unlocked) SunnyContainer else SurfaceMuted),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                badgeIcon(badge.id),
                contentDescription = null,
                tint = if (badge.unlocked) SunnyDeep else OutlineSoft,
                modifier = Modifier.size(28.dp),
            )
        }
        Spacer(Modifier.size(8.dp))
        Text(
            badge.title,
            style = MaterialTheme.typography.labelMedium,
            color = if (badge.unlocked) InkStrong else InkMuted,
            textAlign = TextAlign.Center,
        )
        if (!badge.unlocked) {
            Spacer(Modifier.size(2.dp))
            Text(
                badge.hint,
                style = MaterialTheme.typography.labelSmall,
                color = InkMuted,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun RecentRow(attempt: AttemptEntity) {
    SoftCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(attempt.exerciseTitle, style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.size(2.dp))
                Text(
                    "${attempt.wordCount} so'z · ${attempt.wordsPerMinute} so'z/daq · ${attempt.durationSec}s",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
            }
            Text(
                "${attempt.overallScore}",
                style = MaterialTheme.typography.headlineSmall,
                color = Navy,
            )
        }
    }
}
