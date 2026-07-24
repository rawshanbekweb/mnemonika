package uz.speakingapp.ui.exercise

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.speakingapp.data.model.Exercise

@OptIn(ExperimentalMaterial3Api::class)
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
        TopAppBar(
            title = { Text(exercise.title) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Orqaga")
                }
            },
        )
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            PromptCard(exercise)

            state.error?.let { err ->
                Text(
                    "⚠️ $err",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }

            when (state.phase) {
                Phase.NeedModel -> ModelPrepareSection(
                    onPrepare = { vm.prepareModel() },
                )

                Phase.PreparingModel -> DownloadSection(progress = state.downloadProgress)

                Phase.Ready -> RecordSection(
                    hasPermission = hasMicPermission,
                    timeLimitSec = state.timeLimitSec,
                    onRequestPermission = {
                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    },
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
        }
    }
}

@Composable
private fun PromptCard(exercise: Exercise) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        ),
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(exercise.topic, style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.size(4.dp))
            exercise.prompts.forEach { p ->
                Text("• $p", style = MaterialTheme.typography.bodyLarge)
            }
            Spacer(Modifier.size(12.dp))
            Text(
                "Struktura: ${exercise.mnemonic.acronym}",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary,
            )
            exercise.mnemonic.steps.forEach { s ->
                Text("${s.letter} — ${s.en} (${s.uz})", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun ModelPrepareSection(onPrepare: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        Text(
            "Nutqni tanish uchun til modeli kerak. Birinchi marta bir marta yuklab olinadi (~40MB), keyin internetsiz ishlaydi.",
            style = MaterialTheme.typography.bodyMedium,
        )
        Spacer(Modifier.size(12.dp))
        Button(onClick = onPrepare) { Text("Modelni tayyorlash") }
    }
}

@Composable
private fun DownloadSection(progress: Float) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        Text("Model yuklanmoqda… ${(progress * 100).toInt()}%")
        Spacer(Modifier.size(8.dp))
        LinearProgressIndicator(
            progress = { progress.coerceIn(0f, 1f) },
            modifier = Modifier.fillMaxWidth(),
        )
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
        Text("Tayyor bo'lsangiz, mikrofonni bosing va gapiring (maksimal ${timeLimitSec}s).")
        Spacer(Modifier.size(16.dp))
        if (hasPermission) {
            MicButton(recording = false, onClick = onStart)
        } else {
            Button(onClick = onRequestPermission) { Text("Mikrofonga ruxsat berish") }
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
        Text(
            "🔴 Yozilmoqda  ${elapsed}s / ${limit}s",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.error,
        )
        Spacer(Modifier.size(8.dp))
        LinearProgressIndicator(
            progress = { if (limit == 0) 0f else elapsed.toFloat() / limit },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.size(16.dp))
        MicButton(recording = true, onClick = onStop)
        Spacer(Modifier.size(16.dp))
        if (transcript.isNotBlank() || live.isNotBlank()) {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp)) {
                    Text("Nutqingiz:", style = MaterialTheme.typography.labelMedium)
                    val shown = listOf(transcript, live).filter { it.isNotBlank() }.joinToString(" ")
                    Text(shown, style = MaterialTheme.typography.bodyLarge)
                }
            }
        }
    }
}

@Composable
private fun MicButton(recording: Boolean, onClick: () -> Unit) {
    Surface(
        shape = CircleShape,
        color = if (recording) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
        onClick = onClick,
        modifier = Modifier.size(88.dp),
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
            Icon(
                imageVector = if (recording) Icons.Default.Stop else Icons.Default.Mic,
                contentDescription = if (recording) "To'xtatish" else "Yozishni boshlash",
                tint = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.size(40.dp),
            )
        }
    }
}

@Composable
private fun ResultSection(
    result: uz.speakingapp.analysis.SpeechResult,
    checkingGrammar: Boolean,
    onRetry: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // Umumiy ball
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.secondaryContainer
            ),
        ) {
            Row(
                Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    "${result.overallScore}",
                    fontSize = 44.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                )
                Text(" / 100", fontSize = 20.sp)
                Spacer(Modifier.weight(1f))
                Text("Umumiy ball", style = MaterialTheme.typography.titleMedium)
            }
        }

        // Metrikalar
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                MetricRow("So'zlar soni", "${result.wordCount}")
                MetricRow("Noyob so'zlar", "${result.uniqueWordCount}")
                MetricRow("Ravonlik", "${result.wordsPerMinute} so'z/daqiqa")
                MetricRow("Davomiylik", "${result.durationSec}s")
                MetricRow(
                    "Kalit so'zlar",
                    "${result.matchedKeywords.size}/${result.totalKeywords} (${result.keywordCoverage}%)"
                )
                when {
                    result.grammarScore != null ->
                        MetricRow("Grammatika", "${result.grammarScore}/100")
                    checkingGrammar ->
                        MetricRow("Grammatika", "tekshirilmoqda…")
                }
            }
        }

        // Grammatika e'tibori
        if (result.grammarIssues.isNotEmpty()) {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("Grammatika e'tibori", style = MaterialTheme.typography.titleSmall)
                    Spacer(Modifier.size(6.dp))
                    result.grammarIssues.forEach {
                        Text("• $it", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }

        // Tavsiyalar
        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text("Tavsiyalar", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.size(6.dp))
                result.feedback.forEach { Text("• $it", style = MaterialTheme.typography.bodyMedium) }
            }
        }

        // Transkript
        if (result.transcript.isNotBlank()) {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text("Nutqingiz (matn)", style = MaterialTheme.typography.titleSmall)
                    Spacer(Modifier.size(6.dp))
                    Text(result.transcript, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }

        OutlinedButton(onClick = onRetry, modifier = Modifier.fillMaxWidth()) {
            Text("Qayta urinish")
        }
    }
}

@Composable
private fun MetricRow(label: String, value: String) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium)
        Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
    }
}
