package uz.speakingapp.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.speakingapp.analysis.GameStats
import uz.speakingapp.analysis.Gamification
import uz.speakingapp.data.db.ModuleStat
import uz.speakingapp.data.model.SpeakingModule
import uz.speakingapp.ui.progress.ProgressViewModel
import uz.speakingapp.ui.theme.BrandProgressBar
import uz.speakingapp.ui.theme.HeroGradient
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.SoftCard
import uz.speakingapp.ui.theme.Success
import uz.speakingapp.ui.theme.Violet
import uz.speakingapp.ui.theme.accentGradientFor

@Composable
fun HomeScreen(
    modules: List<SpeakingModule>,
    studentName: String,
    onModuleClick: (String) -> Unit,
    onProgressClick: () -> Unit,
    onProfileClick: () -> Unit,
) {
    val vm: ProgressViewModel = viewModel()
    val attempts by vm.recent.collectAsStateWithLifecycle()
    val moduleStats by vm.stats.collectAsStateWithLifecycle()

    val game = remember(attempts, modules.size) { Gamification.compute(attempts, modules.size) }
    val statByModule = remember(moduleStats) { moduleStats.associateBy { it.moduleId } }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item { HomeHeader(studentName, game, onProgressClick, onProfileClick) }
        item {
            Text(
                "Mavzuni tanlang",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
            )
        }
        items(modules, key = { it.id }) { module ->
            ModuleCard(
                module = module,
                stat = statByModule[module.id],
                onClick = { onModuleClick(module.id) },
                modifier = Modifier.padding(horizontal = 16.dp),
            )
        }
    }
}

@Composable
private fun HomeHeader(
    studentName: String,
    game: GameStats,
    onProgressClick: () -> Unit,
    onProfileClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
            .background(HeroGradient)
            .padding(20.dp),
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(
                        "Salom, $studentName! 👋",
                        color = Color.White.copy(alpha = 0.92f),
                        fontSize = 15.sp,
                    )
                    Spacer(Modifier.size(2.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("🎙️", fontSize = 30.sp)
                        Spacer(Modifier.size(8.dp))
                        Text(
                            "SpeakUp",
                            color = Color.White,
                            style = MaterialTheme.typography.headlineMedium,
                        )
                    }
                }
                // Profil tugmasi
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.2f))
                        .clickable(onClick = onProfileClick),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        studentName.take(1).uppercase(),
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                    )
                }
            }
            Spacer(Modifier.size(4.dp))
            Text(
                "Ingliz tilida gapirishni mashq qilamiz · 5–6 sinf",
                color = Color.White.copy(alpha = 0.9f),
                style = MaterialTheme.typography.bodyMedium,
            )

            Spacer(Modifier.size(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                GlassChip("🔥", if (game.streakDays > 0) "${game.streakDays} kun" else "Seriya yo'q")
                GlassChip("⭐", "${game.level}-daraja")
                if (game.unlockedBadges > 0) {
                    GlassChip("🏅", "${game.unlockedBadges} nishon")
                }
            }

            Spacer(Modifier.size(14.dp))
            Row(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color.White)
                    .clickable(onClick = onProgressClick)
                    .padding(horizontal = 18.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("📊", fontSize = 16.sp)
                Spacer(Modifier.size(8.dp))
                Text(
                    "Mening natijalarim",
                    color = Violet,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                )
            }
        }
    }
}

/** Gradient ustidagi yarim shaffof yorliq. */
@Composable
private fun GlassChip(emoji: String, text: String) {
    Row(
        modifier = Modifier
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.2f))
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(emoji, fontSize = 13.sp)
        Spacer(Modifier.size(6.dp))
        Text(text, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
    }
}

@Composable
private fun ModuleCard(
    module: SpeakingModule,
    stat: ModuleStat?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    SoftCard(modifier = modifier, onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(accentGradientFor(module.type)),
                contentAlignment = Alignment.Center,
            ) {
                Text(module.emoji, fontSize = 28.sp)
            }
            Spacer(Modifier.size(14.dp))
            Column(Modifier.weight(1f)) {
                Text(module.titleUz, style = MaterialTheme.typography.titleMedium)
                val count = module.exercises.size + module.dialogs.size
                Text(
                    "${module.titleEn} · $count ta mashq",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
            }
            if (stat != null) {
                Text("✓", fontSize = 18.sp, color = Success, fontWeight = FontWeight.Bold)
                Spacer(Modifier.size(8.dp))
            }
            Text("›", fontSize = 28.sp, color = InkMuted, fontWeight = FontWeight.Bold)
        }
        // Modul bo'yicha o'rtacha natija — mashq qilingan bo'lsa ko'rinadi.
        if (stat != null) {
            Spacer(Modifier.size(12.dp))
            BrandProgressBar(
                progress = stat.avgScore / 100f,
                brush = accentGradientFor(module.type),
            )
            Spacer(Modifier.size(6.dp))
            Text(
                "O'rtacha ${stat.avgScore}/100 · ${stat.attempts} urinish",
                style = MaterialTheme.typography.bodySmall,
                color = InkMuted,
            )
        }
    }
}
