package uz.speakingapp.ui.module

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.speakingapp.data.model.DialogScenario
import uz.speakingapp.data.model.Exercise
import uz.speakingapp.data.model.SpeakingModule
import uz.speakingapp.ui.theme.BrandTopBar
import uz.speakingapp.ui.theme.CoralContainer
import uz.speakingapp.ui.theme.GradientButton
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.MnemonicBadge
import uz.speakingapp.ui.theme.OnCoralContainer
import uz.speakingapp.ui.theme.OnVioletContainer
import uz.speakingapp.ui.theme.Pill
import uz.speakingapp.ui.theme.SoftCard
import uz.speakingapp.ui.theme.VioletContainer
import uz.speakingapp.ui.theme.accentGradientFor

@Composable
fun ModuleDetailScreen(
    module: SpeakingModule?,
    onBack: () -> Unit,
    onExerciseClick: (String) -> Unit,
    onDialogClick: (String) -> Unit,
) {
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
        val accent = accentGradientFor(module.type)
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            items(module.exercises, key = { it.id }) { exercise ->
                ExerciseCard(exercise, accent, onStart = { onExerciseClick(exercise.id) })
            }
            items(module.dialogs, key = { it.id }) { dialog ->
                DialogCard(dialog, accent, onStart = { onDialogClick(dialog.id) })
            }
        }
    }
}

@Composable
private fun ExerciseCard(exercise: Exercise, accent: Brush, onStart: () -> Unit) {
    SoftCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(48.dp).clip(RoundedCornerShape(16.dp)).background(accent),
                contentAlignment = Alignment.Center,
            ) {
                Text(exercise.visuals.firstOrNull() ?: "📝", fontSize = 24.sp)
            }
            Spacer(Modifier.size(12.dp))
            Column(Modifier.weight(1f)) {
                Text(exercise.title, style = MaterialTheme.typography.titleMedium)
                Text(exercise.topic, style = MaterialTheme.typography.bodySmall, color = InkMuted)
            }
        }
        Spacer(Modifier.size(14.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Pill("Struktura: ${exercise.mnemonic.acronym}", VioletContainer, OnVioletContainer)
        }
        Spacer(Modifier.size(10.dp))
        exercise.mnemonic.steps.forEach { step ->
            Row(
                modifier = Modifier.padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                MnemonicBadge(step.letter, accent, size = 30.dp)
                Spacer(Modifier.size(10.dp))
                Column {
                    Text(step.en, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                    Text(step.uz, style = MaterialTheme.typography.bodySmall, color = InkMuted)
                }
            }
        }
        Spacer(Modifier.size(14.dp))
        GradientButton("Boshlash ✨", onClick = onStart, modifier = Modifier.fillMaxWidth())
    }
}

@Composable
private fun DialogCard(dialog: DialogScenario, accent: Brush, onStart: () -> Unit) {
    SoftCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(48.dp).clip(RoundedCornerShape(16.dp)).background(accent),
                contentAlignment = Alignment.Center,
            ) {
                Text(dialog.characterEmoji.ifBlank { "🎭" }, fontSize = 24.sp)
            }
            Spacer(Modifier.size(12.dp))
            Column(Modifier.weight(1f)) {
                Text(dialog.title, style = MaterialTheme.typography.titleMedium)
                Text(
                    "${dialog.topic} · ${dialog.characterName}",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
            }
        }
        Spacer(Modifier.size(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Pill("Struktura: ${dialog.mnemonic.acronym}", VioletContainer, OnVioletContainer)
            Pill("${dialog.turns.size} ta almashish", CoralContainer, OnCoralContainer)
        }
        Spacer(Modifier.size(14.dp))
        GradientButton("Suhbatni boshlash 💬", onClick = onStart, modifier = Modifier.fillMaxWidth())
    }
}
