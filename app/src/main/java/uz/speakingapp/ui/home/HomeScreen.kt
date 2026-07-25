package uz.speakingapp.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.MilitaryTech
import androidx.compose.material.icons.filled.TrendingUp
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
import uz.speakingapp.R
import uz.speakingapp.analysis.GameStats
import uz.speakingapp.analysis.Gamification
import uz.speakingapp.data.db.ModuleStat
import uz.speakingapp.data.model.SpeakingModule
import uz.speakingapp.ui.progress.ProgressViewModel
import uz.speakingapp.ui.theme.BrandProgressBar
import uz.speakingapp.ui.theme.HairLine
import uz.speakingapp.ui.theme.HeroPhotoBackdrop
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.InkStrong
import uz.speakingapp.ui.theme.Navy
import uz.speakingapp.ui.theme.NumberBadge
import uz.speakingapp.ui.theme.OutlineSoft
import uz.speakingapp.ui.theme.OverlineLabel
import uz.speakingapp.ui.theme.SurfaceWhite
import uz.speakingapp.ui.theme.accentColorFor
import uz.speakingapp.ui.theme.heroPattern

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
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 32.dp),
    ) {
        item { Masthead(studentName, game, onProgressClick, onProfileClick) }
        item {
            Text(
                "Modullar",
                style = OverlineLabel,
                color = InkMuted,
                modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 24.dp, bottom = 10.dp),
            )
        }
        item { HairLine() }
        itemsIndexed(modules, key = { _, m -> m.id }) { index, module ->
            ModuleRow(
                index = index + 1,
                module = module,
                stat = statByModule[module.id],
                doneExercises = module.exercises.count { exerciseStats.containsKey(it.id) },
                onClick = { onModuleClick(module.id) },
            )
            HairLine()
        }
    }
}

/** Yuqori panel: nomi, kichik izoh, o'quvchi va ko'rsatkichlar. */
@Composable
private fun Masthead(
    studentName: String,
    game: GameStats,
    onProgressClick: () -> Unit,
    onProfileClick: () -> Unit,
) {
    HeroPhotoBackdrop(photo = R.drawable.hero_notebook) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(
                    "SPEAKUP",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 24.sp,
                    letterSpacing = 2.sp,
                )
                Spacer(Modifier.size(4.dp))
                Text(
                    "Ingliz tili nutq ko'nikmalari · 5–6 sinf",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.75f),
                )
            }
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.14f))
                    .clickable(onClick = onProfileClick),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    studentName.take(1).uppercase(),
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                )
            }
        }

        Spacer(Modifier.size(18.dp))
        Box(Modifier.fillMaxWidth().size(1.dp).background(Color.White.copy(alpha = 0.15f)))
        Spacer(Modifier.size(14.dp))

        Text(
            studentName,
            color = Color.White,
            style = MaterialTheme.typography.titleMedium,
        )
        Spacer(Modifier.size(12.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
            Metric(Icons.Default.LocalFireDepartment, "${game.streakDays}", "kunlik seriya")
            Metric(Icons.Default.TrendingUp, "${game.level}", "daraja")
            Metric(Icons.Default.MilitaryTech, "${game.unlockedBadges}", "nishon")
        }

        Spacer(Modifier.size(18.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(MaterialTheme.shapes.small)
                .border(1.dp, Color.White.copy(alpha = 0.35f), MaterialTheme.shapes.small)
                .clickable(onClick = onProgressClick)
                .padding(vertical = 11.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                Icons.Default.Assessment,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(17.dp),
            )
            Spacer(Modifier.size(8.dp))
            Text(
                "Natijalarim",
                color = Color.White,
                fontWeight = FontWeight.Medium,
                fontSize = 14.sp,
            )
        }
    }
}

@Composable
private fun Metric(icon: ImageVector, value: String, label: String) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                icon,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.6f),
                modifier = Modifier.size(14.dp),
            )
            Spacer(Modifier.size(5.dp))
            Text(value, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 17.sp)
        }
        Text(
            label.uppercase(),
            style = OverlineLabel,
            color = Color.White.copy(alpha = 0.55f),
        )
    }
}

@Composable
private fun ModuleRow(
    index: Int,
    module: SpeakingModule,
    stat: ModuleStat?,
    doneExercises: Int,
    onClick: () -> Unit,
) {
    val accent = accentColorFor(module.type)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceWhite)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            NumberBadge(index = index, accent = accent)
            Spacer(Modifier.size(14.dp))
            Column(Modifier.weight(1f)) {
                Text(module.titleUz, style = MaterialTheme.typography.titleMedium, color = InkStrong)
                Spacer(Modifier.size(2.dp))
                val count = module.exercises.size + module.dialogs.size
                Text(
                    "${module.titleEn} · $count ta mashq",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
            }
            Icon(
                Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = OutlineSoft,
                modifier = Modifier.size(22.dp),
            )
        }

        // Bajarilganlik ulushi — o'quvchi qayerda to'xtaganini darrov ko'radi.
        if (module.exercises.isNotEmpty()) {
            Spacer(Modifier.size(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                BrandProgressBar(
                    progress = doneExercises.toFloat() / module.exercises.size,
                    brush = SolidColor(accent),
                    modifier = Modifier.weight(1f),
                )
                Spacer(Modifier.size(12.dp))
                Text(
                    "$doneExercises/${module.exercises.size} BAJARILDI",
                    style = OverlineLabel,
                    color = InkMuted,
                )
            }
        }

        if (stat != null) {
            Spacer(Modifier.size(6.dp))
            Text(
                "${stat.attempts} urinish · eng yaxshi ${stat.bestScore} · o'rtacha ${stat.avgScore}",
                style = MaterialTheme.typography.bodySmall,
                color = InkMuted,
            )
        }
    }
}
