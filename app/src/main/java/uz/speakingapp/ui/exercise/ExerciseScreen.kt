package uz.speakingapp.ui.exercise

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.speakingapp.analysis.SpeechResult
import uz.speakingapp.data.model.Exercise
import uz.speakingapp.ui.theme.BrandMicButton
import uz.speakingapp.ui.theme.BrandProgressBar
import uz.speakingapp.ui.theme.BrandTopBar
import uz.speakingapp.ui.theme.Coral
import uz.speakingapp.ui.theme.CoralGradient
import uz.speakingapp.ui.theme.GradientButton
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.MnemonicBadge
import uz.speakingapp.ui.theme.OnVioletContainer
import uz.speakingapp.ui.theme.Pill
import uz.speakingapp.ui.theme.PrimaryGradient
import uz.speakingapp.ui.theme.ScoreRing
import uz.speakingapp.ui.theme.SectionTitle
import uz.speakingapp.ui.theme.SoftButton
import uz.speakingapp.ui.theme.SoftCard
import uz.speakingapp.ui.theme.StatTile
import uz.speakingapp.ui.theme.Success
import uz.speakingapp.ui.theme.Violet
import uz.speakingapp.ui.theme.VioletContainer

@Composable
fun ExerciseScreen(
    exercise: Exercise?,
    moduleId: String,
    onBack: () -> Unit,
) {
    if (exercise == null) {
        Text("Mashq topilmadi", modifier = Modifier.padding(16.dp))
        return
    }

    val vm: ExerciseViewModel = viewModel()
    val state by vm.state.collectAsStateWithLifecycle()
    LaunchedEffect(exercise.id) { vm.bind(exercise, moduleId) }

    val context = LocalContext.current
    var hasMicPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) ==
                PackageManager.PERMISSION_GRANTED
        )
    }
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> hasMicPermission = granted }

    Column(modifier = Modifier.fillMaxSize()) {
        BrandTopBar(title = exercise.title, subtitle = exercise.topic, onBack = onBack)
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            if (exercise.visuals.isNotEmpty()) VisualStrip(exercise.visuals)
            PromptCard(exercise)

            state.error?.let { err ->
                Text(
                    "⚠️ $err",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }

            when (state.phase) {
                Phase.NeedModel -> ModelPrepareSection(onPrepare = { vm.prepareModel() })
                Phase.PreparingModel -> DownloadSection(progress = state.downloadProgress)
                Phase.Ready -> RecordSection(
                    hasPermission = hasMicPermission,
                    timeLimitSec = state.timeLimitSec,
                    onRequestPermission = { permissionLauncher.launch(Manifest.permission.RECORD_AUDIO) },
                    onStart = { vm.startRecording() },
                )
                Phase.Recording -> RecordingSection(
                    elapsed = state.elapsedSec,
                    limit = state.timeLimitSec,
                    transcript = state.transcript,
                    live = state.liveText,
                    onStop = { vm.stopRecording() },
                )
                Phase.Done -> state.result?.let { result ->
                    ResultSection(
                        result = result,
                        checkingGrammar = state.checkingGrammar,
                        onRetry = { vm.startRecording() },
                    )
                }
            }
            Spacer(Modifier.size(8.dp))
        }
    }
}

@Composable
private fun VisualStrip(visuals: List<String>) {
    LazyRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        items(visuals) { emoji ->
            Box(
                modifier = Modifier
                    .size(92.dp)
                    .clip(RoundedCornerShape(22.dp))
                    .background(VioletContainer),
                contentAlignment = Alignment.Center,
            ) {
                Text(emoji, fontSize = 48.sp)
            }
        }
    }
}

@Composable
private fun PromptCard(exercise: Exercise) {
    SoftCard {
        Pill(exercise.topic, VioletContainer, OnVioletContainer)
        Spacer(Modifier.size(10.dp))
        exercise.prompts.forEach { p ->
            Row(Modifier.padding(vertical = 3.dp)) {
                Text("💬 ", fontSize = 15.sp)
                Text(p, style = MaterialTheme.typography.bodyLarge)
            }
        }
        Spacer(Modifier.size(14.dp))
        SectionTitle("Struktura: ${exercise.mnemonic.acronym}")
        Spacer(Modifier.size(10.dp))
        exercise.mnemonic.steps.forEach { s ->
            Row(Modifier.padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                MnemonicBadge(s.letter, PrimaryGradient, size = 28.dp)
                Spacer(Modifier.size(10.dp))
                Text("${s.en} ", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                Text("· ${s.uz}", style = MaterialTheme.typography.bodySmall, color = InkMuted)
            }
        }
    }
}

@Composable
private fun ModelPrepareSection(onPrepare: () -> Unit) {
    SoftCard {
        Text("🎧 Til modeli", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.size(6.dp))
        Text(
            "Nutqni tanish uchun til modeli kerak. Birinchi marta bir marta yuklab olinadi (~40MB), keyin internetsiz ishlaydi.",
            style = MaterialTheme.typography.bodyMedium,
            color = InkMuted,
        )
        Spacer(Modifier.size(14.dp))
        GradientButton("Modelni tayyorlash", onClick = onPrepare, modifier = Modifier.fillMaxWidth())
    }
}

@Composable
private fun DownloadSection(progress: Float) {
    SoftCard {
        Text("Model yuklanmoqda… ${(progress * 100).toInt()}%", style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.size(10.dp))
        BrandProgressBar(progress = progress)
    }
}

@Composable
private fun RecordSection(
    hasPermission: Boolean,
    timeLimitSec: Int,
    onRequestPermission: () -> Unit,
    onStart: () -> Unit,
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        Text(
            "Tayyor bo'lsangiz, mikrofonni bosing va gapiring",
            style = MaterialTheme.typography.bodyLarge,
        )
        Text("(maksimal ${timeLimitSec} soniya)", style = MaterialTheme.typography.bodySmall, color = InkMuted)
        Spacer(Modifier.size(18.dp))
        if (hasPermission) {
            BrandMicButton(recording = false, onClick = onStart, micIcon = Icons.Default.Mic, stopIcon = Icons.Default.Stop)
        } else {
            GradientButton("Mikrofonga ruxsat berish", onClick = onRequestPermission)
        }
    }
}

@Composable
private fun RecordingSection(
    elapsed: Int,
    limit: Int,
    transcript: String,
    live: String,
    onStop: () -> Unit,
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        Text("🔴 Yozilmoqda  ${elapsed}s / ${limit}s", style = MaterialTheme.typography.titleMedium, color = Coral)
        Spacer(Modifier.size(10.dp))
        BrandProgressBar(progress = if (limit == 0) 0f else elapsed.toFloat() / limit, brush = CoralGradient)
        Spacer(Modifier.size(18.dp))
        BrandMicButton(recording = true, onClick = onStop, micIcon = Icons.Default.Mic, stopIcon = Icons.Default.Stop)
        Spacer(Modifier.size(18.dp))
        val shown = listOf(transcript, live).filter { it.isNotBlank() }.joinToString(" ")
        if (shown.isNotBlank()) {
            SoftCard {
                Text("Nutqingiz:", style = MaterialTheme.typography.labelMedium, color = InkMuted)
                Spacer(Modifier.size(4.dp))
                Text(shown, style = MaterialTheme.typography.bodyLarge)
            }
        }
    }
}

@Composable
private fun ResultSection(
    result: SpeechResult,
    checkingGrammar: Boolean,
    onRetry: () -> Unit,
) {
    val message = when {
        result.overallScore >= 80 -> "Zo'r natija! 🎉"
        result.overallScore >= 50 -> "Yaxshi ish! 👍"
        else -> "Mashq qilishda davom et! 💪"
    }
    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SoftCard {
            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                ScoreRing(result.overallScore)
                Spacer(Modifier.size(10.dp))
                Text(message, style = MaterialTheme.typography.titleMedium, color = Violet)
            }
        }

        // Metrikalar — 2 ustunli plitkalar
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatTile("${result.wordCount}", "So'zlar", Modifier.weight(1f))
                StatTile("${result.uniqueWordCount}", "Noyob so'z", Modifier.weight(1f), accent = Coral)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatTile("${result.wordsPerMinute}", "So'z/daqiqa", Modifier.weight(1f))
                StatTile("${result.durationSec}s", "Davomiylik", Modifier.weight(1f), accent = Coral)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatTile(
                    "${result.matchedKeywords.size}/${result.totalKeywords}",
                    "Kalit so'zlar (${result.keywordCoverage}%)",
                    Modifier.weight(1f),
                    accent = Success,
                )
                val grammar = when {
                    result.grammarScore != null -> "${result.grammarScore}"
                    checkingGrammar -> "…"
                    else -> "—"
                }
                StatTile(grammar, "Grammatika", Modifier.weight(1f))
            }
        }

        if (result.grammarIssues.isNotEmpty()) {
            SoftCard {
                SectionTitle("Grammatika e'tibori")
                Spacer(Modifier.size(8.dp))
                result.grammarIssues.forEach {
                    Text("• $it", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(vertical = 2.dp))
                }
            }
        }

        SoftCard {
            SectionTitle("Tavsiyalar")
            Spacer(Modifier.size(8.dp))
            result.feedback.forEach {
                Text("• $it", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(vertical = 2.dp))
            }
        }

        if (result.transcript.isNotBlank()) {
            SoftCard {
                SectionTitle("Nutqingiz (matn)")
                Spacer(Modifier.size(8.dp))
                Text(result.transcript, style = MaterialTheme.typography.bodyMedium, color = InkMuted)
            }
        }

        SoftButton("🔁 Qayta urinish", onClick = onRetry, modifier = Modifier.fillMaxWidth())
    }
}
