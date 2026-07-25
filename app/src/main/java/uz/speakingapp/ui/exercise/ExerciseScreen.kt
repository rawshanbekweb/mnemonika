package uz.speakingapp.ui.exercise

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.automirrored.filled.VolumeOff
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
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
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.speakingapp.analysis.KeywordMatcher
import uz.speakingapp.analysis.SpeechResult
import uz.speakingapp.data.model.Exercise
import uz.speakingapp.data.model.Mnemonic
import uz.speakingapp.speech.ModelManager
import uz.speakingapp.ui.theme.BrandMicButton
import uz.speakingapp.ui.theme.BrandProgressBar
import uz.speakingapp.ui.theme.BrandTopBar
import uz.speakingapp.ui.theme.Danger
import uz.speakingapp.ui.theme.GoldContainer
import uz.speakingapp.ui.theme.GradientButton
import uz.speakingapp.ui.theme.HairLine
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.InkStrong
import uz.speakingapp.ui.theme.MnemonicBadge
import uz.speakingapp.ui.theme.Navy
import uz.speakingapp.ui.theme.NavyContainer
import uz.speakingapp.ui.theme.OnGoldContainer
import uz.speakingapp.ui.theme.OnNavyContainer
import uz.speakingapp.ui.theme.OutlineSoft
import uz.speakingapp.ui.theme.OverlineLabel
import uz.speakingapp.ui.theme.Pill
import uz.speakingapp.ui.theme.ScoreRing
import uz.speakingapp.ui.theme.SectionTitle
import uz.speakingapp.ui.theme.SoftButton
import uz.speakingapp.ui.theme.SoftCard
import uz.speakingapp.ui.theme.StatTile
import uz.speakingapp.ui.theme.Success
import uz.speakingapp.ui.theme.SuccessContainer
import uz.speakingapp.ui.theme.SurfaceMuted
import uz.speakingapp.ui.theme.VisualTile

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
        HairLine()
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            if (exercise.visuals.isNotEmpty()) VisualStrip(exercise.visuals)
            PromptCard(
                exercise = exercise,
                speaking = state.speaking,
                onListen = { vm.speakPrompts() },
            )

            state.error?.let { err -> ErrorNote(err) }

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
                    keywords = exercise.keywords,
                    mnemonic = exercise.mnemonic,
                    micLevel = state.micLevel,
                    onStop = { vm.stopRecording() },
                )
                Phase.Done -> state.result?.let { result ->
                    ResultSection(
                        result = result,
                        keywords = exercise.keywords,
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
private fun ErrorNote(message: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(MaterialTheme.shapes.small)
            .background(SurfaceMuted)
            .border(1.dp, OutlineSoft, MaterialTheme.shapes.small)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Default.Warning, contentDescription = null, tint = Danger, modifier = Modifier.size(18.dp))
        Spacer(Modifier.size(10.dp))
        Text(message, style = MaterialTheme.typography.bodyMedium, color = InkStrong)
    }
}

@Composable
private fun VisualStrip(visuals: List<String>) {
    LazyRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        items(visuals) { token -> VisualTile(token, size = 88.dp) }
    }
}

@Composable
private fun PromptCard(exercise: Exercise, speaking: Boolean, onListen: () -> Unit) {
    SoftCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.weight(1f)) { Pill(exercise.topic, NavyContainer, OnNavyContainer) }
            if (exercise.prompts.isNotEmpty()) {
                ListenButton(speaking = speaking, onClick = onListen)
            }
        }
        Spacer(Modifier.size(12.dp))
        exercise.prompts.forEachIndexed { i, p ->
            Row(Modifier.padding(vertical = 4.dp)) {
                Text(
                    "${i + 1}.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = InkMuted,
                    modifier = Modifier.size(width = 22.dp, height = 24.dp),
                )
                Text(p, style = MaterialTheme.typography.bodyLarge)
            }
        }

        Spacer(Modifier.size(16.dp))
        SectionTitle("Struktura · ${exercise.mnemonic.acronym}")
        Spacer(Modifier.size(12.dp))
        exercise.mnemonic.steps.forEach { s ->
            Row(Modifier.padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                MnemonicBadge(s.letter, size = 26.dp)
                Spacer(Modifier.size(12.dp))
                Text(s.en, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                Spacer(Modifier.size(6.dp))
                Text("· ${s.uz}", style = MaterialTheme.typography.bodySmall, color = InkMuted)
            }
        }
    }
}

/** Savollarni ingliz tilida eshitish (TTS). */
@Composable
private fun ListenButton(speaking: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .clip(MaterialTheme.shapes.extraSmall)
            .border(1.dp, if (speaking) Navy else OutlineSoft, MaterialTheme.shapes.extraSmall)
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            if (speaking) Icons.AutoMirrored.Filled.VolumeOff else Icons.AutoMirrored.Filled.VolumeUp,
            contentDescription = null,
            tint = Navy,
            modifier = Modifier.size(15.dp),
        )
        Spacer(Modifier.size(6.dp))
        Text(
            if (speaking) "To'xtatish" else "Eshitish",
            color = Navy,
            style = OverlineLabel,
        )
    }
}

/**
 * Kalit so'zlar yorliqlari. Aytilganlari belgilanadi —
 * yozish paytida jonli, natijada esa yakuniy holat sifatida.
 */
@Composable
private fun KeywordChips(keywords: List<String>, spoken: Set<String>) {
    keywords.chunked(3).forEach { row ->
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            row.forEach { kw ->
                val hit = kw in spoken
                Row(
                    modifier = Modifier
                        .clip(MaterialTheme.shapes.extraSmall)
                        .background(if (hit) SuccessContainer else SurfaceMuted)
                        .padding(horizontal = 8.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    if (hit) {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = null,
                            tint = Success,
                            modifier = Modifier.size(12.dp),
                        )
                        Spacer(Modifier.size(4.dp))
                    }
                    Text(
                        kw,
                        style = MaterialTheme.typography.labelMedium,
                        color = if (hit) Success else InkMuted,
                        fontWeight = if (hit) FontWeight.SemiBold else FontWeight.Normal,
                    )
                }
            }
        }
    }
}

/** Transkriptda uchragan kalit so'zlar — yakuniy baholash bilan aynan bir xil qoida. */
private fun spokenKeywords(text: String, keywords: List<String>): Set<String> =
    KeywordMatcher.matched(text, keywords).toSet()

/**
 * Mikrofon darajasi. Jim bo'lsa maslahat beradi — "tanimadi" muammosining
 * ko'p qismi bola juda sekin gapirganidan kelib chiqadi.
 */
@Composable
private fun MicLevelBar(level: Float) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        Row(horizontalArrangement = Arrangement.spacedBy(3.dp), verticalAlignment = Alignment.CenterVertically) {
            repeat(16) { i ->
                val active = level * 16 > i
                Box(
                    Modifier
                        .size(width = 4.dp, height = 16.dp)
                        .background(if (active) Navy else OutlineSoft)
                )
            }
        }
        if (level < 0.08f) {
            Spacer(Modifier.size(8.dp))
            Text("Balandroq gapiring", style = OverlineLabel, color = InkMuted)
        }
    }
}

@Composable
private fun ModelPrepareSection(onPrepare: () -> Unit) {
    SoftCard {
        SectionTitle("Til modeli")
        Spacer(Modifier.size(12.dp))
        Text(
            "Nutqni tanish uchun til modeli kerak. Bir marta yuklab olinadi " +
                "(~${ModelManager.MODEL_SIZE_MB}MB), keyin butunlay internetsiz ishlaydi. " +
                "Wi-Fi'da yuklab olish tavsiya etiladi.",
            style = MaterialTheme.typography.bodyMedium,
            color = InkMuted,
        )
        Spacer(Modifier.size(16.dp))
        GradientButton("Modelni tayyorlash", onClick = onPrepare, modifier = Modifier.fillMaxWidth())
    }
}

@Composable
private fun DownloadSection(progress: Float) {
    SoftCard {
        Text("Model yuklanmoqda", style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.size(10.dp))
        BrandProgressBar(progress = progress)
        Spacer(Modifier.size(8.dp))
        Text("${(progress * 100).toInt()}%", style = OverlineLabel, color = InkMuted)
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
            "Tayyor bo'lsangiz mikrofonni bosing va gapiring",
            style = MaterialTheme.typography.bodyLarge,
        )
        Spacer(Modifier.size(4.dp))
        Text("Maksimal $timeLimitSec soniya", style = OverlineLabel, color = InkMuted)
        Spacer(Modifier.size(20.dp))
        if (hasPermission) {
            BrandMicButton(
                recording = false,
                onClick = onStart,
                micIcon = Icons.Default.Mic,
                stopIcon = Icons.Default.Stop,
            )
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
    keywords: List<String>,
    mnemonic: Mnemonic,
    micLevel: Float,
    onStop: () -> Unit,
) {
    val shown = listOf(transcript, live).filter { it.isNotBlank() }.joinToString(" ")
    val spoken = remember(shown, keywords) { spokenKeywords(shown, keywords) }

    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(8.dp).clip(MaterialTheme.shapes.extraSmall).background(Danger))
            Spacer(Modifier.size(8.dp))
            Text(
                "YOZILMOQDA · ${elapsed}s / ${limit}s",
                style = OverlineLabel,
                color = Danger,
            )
        }
        Spacer(Modifier.size(10.dp))
        BrandProgressBar(
            progress = if (limit == 0) 0f else elapsed.toFloat() / limit,
            brush = SolidColor(Danger),
        )
        Spacer(Modifier.size(20.dp))
        BrandMicButton(
            recording = true,
            onClick = onStop,
            micIcon = Icons.Default.Mic,
            stopIcon = Icons.Default.Stop,
        )
        Spacer(Modifier.size(14.dp))
        MicLevelBar(micLevel)
        Spacer(Modifier.size(20.dp))

        if (mnemonic.steps.isNotEmpty()) {
            SoftCard {
                SectionTitle("Strukturaga amal qiling · ${mnemonic.acronym}")
                Spacer(Modifier.size(10.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(mnemonic.steps) { step ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            MnemonicBadge(step.letter, size = 22.dp)
                            Spacer(Modifier.size(6.dp))
                            Text(step.en, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
            Spacer(Modifier.size(12.dp))
        }

        if (keywords.isNotEmpty()) {
            SoftCard {
                SectionTitle("Kalit so'zlar · ${spoken.size}/${keywords.size}")
                Spacer(Modifier.size(10.dp))
                KeywordChips(keywords, spoken)
            }
            Spacer(Modifier.size(12.dp))
        }

        if (shown.isNotBlank()) {
            SoftCard {
                SectionTitle("Nutqingiz")
                Spacer(Modifier.size(10.dp))
                Text(shown, style = MaterialTheme.typography.bodyLarge)
            }
        }
    }
}

@Composable
private fun ResultSection(
    result: SpeechResult,
    keywords: List<String>,
    checkingGrammar: Boolean,
    onRetry: () -> Unit,
) {
    val message = when {
        result.overallScore >= 80 -> "A'lo natija"
        result.overallScore >= 50 -> "Yaxshi natija"
        else -> "Mashq qilishda davom eting"
    }
    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        SoftCard {
            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                ScoreRing(result.overallScore)
                Spacer(Modifier.size(12.dp))
                Text(message, style = MaterialTheme.typography.titleMedium, color = Navy)
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatTile("${result.wordCount}", "So'zlar", Modifier.weight(1f))
                StatTile("${result.uniqueWordCount}", "Noyob so'z", Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatTile("${result.wordsPerMinute}", "So'z/daqiqa", Modifier.weight(1f))
                StatTile("${result.durationSec}s", "Davomiylik", Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatTile(
                    "${result.matchedKeywords.size}/${result.totalKeywords}",
                    "Kalit so'zlar",
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

        if (keywords.isNotEmpty()) {
            SoftCard {
                SectionTitle("Kalit so'zlar · ${result.matchedKeywords.size}/${keywords.size}")
                Spacer(Modifier.size(10.dp))
                KeywordChips(keywords, result.matchedKeywords.toSet())
            }
        }

        if (result.grammarIssues.isNotEmpty()) {
            SoftCard {
                SectionTitle("Grammatika e'tibori")
                Spacer(Modifier.size(10.dp))
                result.grammarIssues.forEach {
                    BulletLine(it)
                }
            }
        }

        SoftCard {
            SectionTitle("Tavsiyalar")
            Spacer(Modifier.size(10.dp))
            result.feedback.forEach { BulletLine(it) }
        }

        if (result.transcript.isNotBlank()) {
            SoftCard {
                SectionTitle("Nutqingiz (matn)")
                Spacer(Modifier.size(10.dp))
                Text(result.transcript, style = MaterialTheme.typography.bodyMedium, color = InkMuted)
            }
        }

        SoftButton("Qayta urinish", onClick = onRetry, modifier = Modifier.fillMaxWidth())
    }
}

@Composable
private fun BulletLine(text: String) {
    Row(Modifier.padding(vertical = 3.dp)) {
        Text("—", color = InkMuted, fontSize = 14.sp, modifier = Modifier.size(width = 18.dp, height = 20.dp))
        Text(text, style = MaterialTheme.typography.bodyMedium)
    }
}
