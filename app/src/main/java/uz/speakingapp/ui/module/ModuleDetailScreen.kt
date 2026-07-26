package uz.speakingapp.ui.module

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.speakingapp.data.db.ExerciseStat
import uz.speakingapp.data.model.DialogScenario
import uz.speakingapp.data.model.Exercise
import uz.speakingapp.data.model.SpeakingModule
import uz.speakingapp.ui.progress.ProgressViewModel
import uz.speakingapp.ui.theme.BrandTopBar
import uz.speakingapp.ui.theme.GoldContainer
import uz.speakingapp.ui.theme.GradientButton
import uz.speakingapp.ui.theme.HairLine
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.MnemonicBadge
import uz.speakingapp.ui.theme.NavyContainer
import uz.speakingapp.ui.theme.OnGoldContainer
import uz.speakingapp.ui.theme.OnNavyContainer
import uz.speakingapp.ui.theme.OverlineLabel
import uz.speakingapp.ui.theme.Pill
import uz.speakingapp.ui.theme.ScoreBadge
import uz.speakingapp.ui.theme.SoftCard
import uz.speakingapp.ui.theme.VisualThumb
import uz.speakingapp.ui.theme.accentColorFor

@Composable
fun ModuleDetailScreen(
    module: SpeakingModule?,
    onBack: () -> Unit,
    onExerciseClick: (String) -> Unit,
    onDialogClick: (String) -> Unit,
) {
    val vm: ProgressViewModel = viewModel()
    val exerciseStats by vm.exerciseStats.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {
        BrandTopBar(
            title = module?.titleUz ?: "Modul",
            subtitle = module?.descriptionUz,
            onBack = onBack,
        )
        if (module == null) {
            Text("Modul topilmadi", modifier = Modifier.padding(16.dp))
            return@Column
        }
        HairLine()
        val accent = accentColorFor(module.type)
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(module.exercises, key = { it.id }) { exercise ->
                ExerciseCard(
                    exercise = exercise,
                    accent = accent,
                    stat = exerciseStats[exercise.id],
                    onStart = { onExerciseClick(exercise.id) },
                )
            }
            items(module.dialogs, key = { it.id }) { dialog ->
                DialogCard(dialog, accent, onStart = { onDialogClick(dialog.id) })
            }
        }
    }
}

@Composable
private fun ExerciseCard(
    exercise: Exercise,
    accent: Color,
    stat: ExerciseStat?,
    onStart: () -> Unit,
) {
    SoftCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            exercise.visuals.firstOrNull()?.let { VisualThumb(it, size = 46.dp) }
            if (exercise.visuals.isNotEmpty()) Spacer(Modifier.size(12.dp))
            Column(Modifier.weight(1f)) {
                Text(exercise.title, style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.size(2.dp))
                Text(exercise.topic, style = MaterialTheme.typography.bodySmall, color = InkMuted)
                if (stat != null) {
                    Spacer(Modifier.size(4.dp))
                    Text(
                        "${stat.attempts} URINISH · ENG YAXSHI ${stat.bestScore}",
                        style = OverlineLabel,
                        color = InkMuted,
                    )
                }
            }
            Spacer(Modifier.size(10.dp))
            ScoreBadge(stat?.bestScore)
        }

        Spacer(Modifier.size(14.dp))
        // "Takrorlang" mashqida mnemonika yo'q — akronimsiz "Struktura · "
        // osilib qolmasligi uchun mashq turini ko'rsatamiz.
        if (exercise.isReadAloud) {
            Pill("Takrorlang · talaffuz", GoldContainer, OnGoldContainer)
        } else if (exercise.mnemonic.acronym.isNotBlank()) {
            Pill("Struktura · ${exercise.mnemonic.acronym}", NavyContainer, OnNavyContainer)
        }

        Spacer(Modifier.size(12.dp))
        exercise.mnemonic.steps.forEach { step ->
            Row(
                modifier = Modifier.padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                MnemonicBadge(step.letter, SolidColor(accent), size = 26.dp)
                Spacer(Modifier.size(12.dp))
                Column {
                    Text(step.en, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                    Text(step.uz, style = MaterialTheme.typography.bodySmall, color = InkMuted)
                }
            }
        }

        Spacer(Modifier.size(16.dp))
        GradientButton(
            if (stat == null) "Mashqni boshlash" else "Qayta urinish",
            onClick = onStart,
            modifier = Modifier.fillMaxWidth(),
            leadingIcon = if (stat == null) Icons.Default.PlayArrow else Icons.Default.Refresh,
        )
    }
}

@Composable
private fun DialogCard(dialog: DialogScenario, accent: Color, onStart: () -> Unit) {
    SoftCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (dialog.characterEmoji.isNotBlank()) {
                VisualThumb(dialog.characterEmoji, size = 46.dp)
                Spacer(Modifier.size(12.dp))
            }
            Column(Modifier.weight(1f)) {
                Text(dialog.title, style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.size(2.dp))
                Text(
                    "${dialog.topic} · ${dialog.characterName}",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
            }
        }

        Spacer(Modifier.size(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Pill("Struktura · ${dialog.mnemonic.acronym}", NavyContainer, OnNavyContainer)
            Pill("${dialog.turns.size} ta almashish", GoldContainer, OnGoldContainer)
        }

        Spacer(Modifier.size(12.dp))
        Text(
            "Suhbatda ${dialog.characterName} bilan navbatma-navbat gaplashasiz.",
            style = MaterialTheme.typography.bodySmall,
            color = InkMuted,
        )

        Spacer(Modifier.size(16.dp))
        GradientButton(
            "Suhbatni boshlash",
            onClick = onStart,
            modifier = Modifier.fillMaxWidth(),
            leadingIcon = Icons.Default.Forum,
        )
    }
}
