package uz.speakingapp.ui.home

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.MilitaryTech
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
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
import uz.speakingapp.ui.theme.Bulbul
import uz.speakingapp.ui.theme.BrandProgressBar
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.InkStrong
import uz.speakingapp.ui.theme.Mascot
import uz.speakingapp.ui.theme.MascotMood
import uz.speakingapp.ui.theme.OverlineLabel
import uz.speakingapp.ui.theme.PopIn
import uz.speakingapp.ui.theme.SectionTitle
import uz.speakingapp.ui.theme.SoftCard
import uz.speakingapp.ui.theme.Sky
import uz.speakingapp.ui.theme.accentColorFor
import uz.speakingapp.ui.theme.bouncyClick
import uz.speakingapp.ui.theme.heroPattern
import uz.speakingapp.ui.theme.mascotFor
import uz.speakingapp.ui.theme.pagePattern

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
    val exerciseStats by vm.exerciseStats.collectAsStateWithLifecycle()

    val game = remember(attempts, modules.size) { Gamification.compute(attempts, modules.size) }
    val statByModule = remember(moduleStats) { moduleStats.associateBy { it.moduleId } }

    LazyColumn(
        modifier = Modifier.fillMaxSize().pagePattern(),
        contentPadding = PaddingValues(bottom = 32.dp),
    ) {
        item { Masthead(studentName, game, onProgressClick, onProfileClick) }
        item {
            SectionTitle(
                "Modullar",
                modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 24.dp, bottom = 12.dp),
            )
        }
        itemsIndexed(modules, key = { _, m -> m.id }) { index, module ->
            PopIn(index = index) {
                ModuleCard(
                    index = index + 1,
                    module = module,
                    stat = statByModule[module.id],
                    doneExercises = module.exercises.count { exerciseStats.containsKey(it.id) },
                    onClick = { onModuleClick(module.id) },
                )
            }
        }
    }
}

/**
 * Bosh sarlavha: Bulbul o'quvchini ism bilan kutib oladi.
 *
 * Avval bu yerda daftar fotosurati bor edi (akademik uslub). Endi rangli
 * gradient va personaj — bola ilovani ochganda birinchi ko'radigan narsa
 * jonli bo'lishi kerak.
 */
@Composable
private fun Masthead(
    studentName: String,
    game: GameStats,
    onProgressClick: () -> Unit,
    onProfileClick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
            .heroPattern()
            .padding(horizontal = 20.dp, vertical = 22.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(
                    "SPEAKUP",
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 24.sp,
                    letterSpacing = 2.sp,
                )
                Text(
                    "Ingliz tili nutqi · 5–6 sinf",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.85f),
                )
            }
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.25f))
                    .bouncyClick(onClick = onProfileClick),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    studentName.take(1).uppercase(),
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp,
                )
            }
        }

        Spacer(Modifier.size(16.dp))

        // Bulbul + salomlashish. Gap pufagi shaffof oq — gradient ustida
        // yaxshi o'qiladi va karta qo'yilgandek og'irlik qilmaydi.
        Row(verticalAlignment = Alignment.CenterVertically) {
            Mascot(look = Bulbul, mood = MascotMood.Happy, size = 84.dp)
            Spacer(Modifier.size(10.dp))
            Column(
                Modifier
                    .weight(1f)
                    .clip(MaterialTheme.shapes.large)
                    .background(Color.White.copy(alpha = 0.20f))
                    .padding(horizontal = 14.dp, vertical = 12.dp),
            ) {
                Text(
                    "Salom, $studentName!",
                    color = Color.White,
                    style = MaterialTheme.typography.titleMedium,
                )
                Spacer(Modifier.size(2.dp))
                Text(
                    Bulbul.greeting,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.9f),
                )
            }
        }

        Spacer(Modifier.size(18.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            MetricChip(Icons.Default.LocalFireDepartment, "${game.streakDays}", "seriya", Modifier.weight(1f))
            MetricChip(Icons.Default.Star, "${game.level}", "daraja", Modifier.weight(1f))
            MetricChip(Icons.Default.MilitaryTech, "${game.unlockedBadges}", "nishon", Modifier.weight(1f))
        }

        Spacer(Modifier.size(14.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.25f))
                .bouncyClick(onClick = onProgressClick)
                .padding(vertical = 13.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                Icons.Default.Assessment,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(19.dp),
            )
            Spacer(Modifier.size(8.dp))
            Text("Natijalarim", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }
    }
}

/** Ko'rsatkich yorlig'i — gradient ustida yumaloq oq quticha. */
@Composable
private fun MetricChip(icon: ImageVector, value: String, label: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(MaterialTheme.shapes.small)
            .background(Color.White.copy(alpha = 0.20f))
            .padding(vertical = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                icon,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.9f),
                modifier = Modifier.size(16.dp),
            )
            Spacer(Modifier.size(5.dp))
            Text(value, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
        }
        Text(label.uppercase(), style = OverlineLabel, color = Color.White.copy(alpha = 0.75f))
    }
}

/**
 * Modul kartasi. Chap tomonda o'sha modulning do'sti turadi — bola
 * modulni nomidan oldin personaj va rangidan tanib oladi.
 */
@Composable
private fun ModuleCard(
    index: Int,
    module: SpeakingModule,
    stat: ModuleStat?,
    doneExercises: Int,
    onClick: () -> Unit,
) {
    val accent = accentColorFor(module.type)
    val friend = remember(module.type) { mascotFor(module.type) }

    SoftCard(
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
        onClick = onClick,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(accent.copy(alpha = 0.14f)),
                contentAlignment = Alignment.Center,
            ) {
                Mascot(look = friend, mood = MascotMood.Idle, size = 54.dp)
            }
            Spacer(Modifier.size(14.dp))
            Column(Modifier.weight(1f)) {
                Text(module.titleUz, style = MaterialTheme.typography.titleMedium, color = InkStrong)
                Spacer(Modifier.size(2.dp))
                val count = module.exercises.size + module.dialogs.size
                Text(
                    "${friend.name} bilan · $count ta mashq",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
            }
            Icon(
                Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = accent,
                modifier = Modifier.size(24.dp),
            )
        }

        // Bajarilganlik ulushi — o'quvchi qayerda to'xtaganini darrov ko'radi.
        if (module.exercises.isNotEmpty()) {
            Spacer(Modifier.size(14.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                BrandProgressBar(
                    progress = doneExercises.toFloat() / module.exercises.size,
                    brush = SolidColor(accent),
                    modifier = Modifier.weight(1f),
                )
                Spacer(Modifier.size(12.dp))
                Text(
                    "$doneExercises/${module.exercises.size}",
                    style = OverlineLabel,
                    color = accent,
                )
            }
        }

        if (stat != null) {
            Spacer(Modifier.size(8.dp))
            Text(
                "Eng yaxshi ${stat.bestScore} ball · ${stat.attempts} urinish",
                style = MaterialTheme.typography.bodySmall,
                color = InkMuted,
            )
        }
    }
}
