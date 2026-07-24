package uz.speakingapp.ui.dialog

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.speakingapp.data.model.DialogScenario

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DialogScreen(
    scenario: DialogScenario?,
    moduleId: String,
    isInterview: Boolean,
    onBack: () -> Unit,
) {
    if (scenario == null) {
        Text("Senariy topilmadi", modifier = Modifier.padding(16.dp))
        return
    }
    val vm: DialogViewModel = viewModel()
    val state by vm.state.collectAsStateWithLifecycle()
    LaunchedEffect(scenario.id) { vm.bind(scenario, moduleId, isInterview) }

    val context = LocalContext.current
    var hasMic by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECORD_AUDIO) ==
                android.content.pm.PackageManager.PERMISSION_GRANTED
        )
    }
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> hasMic = granted }

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text(scenario.title) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Orqaga")
                }
            },
        )

        // Personaj + mnemonika sarlavhasi
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(scenario.characterEmoji, fontSize = 30.sp)
            Spacer(Modifier.size(10.dp))
            Column(Modifier.weight(1f)) {
                Text(scenario.characterName, style = MaterialTheme.typography.titleMedium)
                Text(
                    "${scenario.topic} · ${scenario.mnemonic.acronym}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (state.totalTurns > 0 && state.phase != DialogPhase.Done) {
                Text(
                    "${(state.turnIndex + 1).coerceAtMost(state.totalTurns)}/${state.totalTurns}",
                    style = MaterialTheme.typography.labelLarge,
                )
            }
        }

        // Suhbat tarixi
        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(state.messages.size) { i ->
                val msg = state.messages[i]
                MessageBubble(
                    text = msg.text,
                    fromCharacter = msg.fromCharacter,
                    characterEmoji = scenario.characterEmoji,
                )
            }
            if (state.liveText.isNotBlank()) {
                item {
                    MessageBubble(
                        text = state.liveText,
                        fromCharacter = false,
                        characterEmoji = scenario.characterEmoji,
                        faded = true,
                    )
                }
            }
        }

        state.error?.let {
            Text(
                "⚠️ $it",
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(horizontal = 16.dp),
            )
        }

        // Pastki interaktiv panel
        Surface(tonalElevation = 3.dp, modifier = Modifier.fillMaxWidth()) {
            Box(Modifier.padding(16.dp), contentAlignment = Alignment.Center) {
                when (state.phase) {
                    DialogPhase.NeedModel -> Button(onClick = { vm.prepareModel() }) {
                        Text("Suhbatni boshlash")
                    }

                    DialogPhase.PreparingModel -> Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Model yuklanmoqda… ${(state.downloadProgress * 100).toInt()}%")
                        Spacer(Modifier.size(8.dp))
                        LinearProgressIndicator(
                            progress = { state.downloadProgress.coerceIn(0f, 1f) },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }

                    DialogPhase.CharacterSpeaking -> Text(
                        "🔊 ${scenario.characterName} gapiryapti…",
                        style = MaterialTheme.typography.titleMedium,
                    )

                    DialogPhase.StudentTurn -> Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(state.currentHint, style = MaterialTheme.typography.bodyLarge)
                        Spacer(Modifier.size(12.dp))
                        if (hasMic) {
                            MicButton(recording = false) { vm.startRecording() }
                        } else {
                            Button(onClick = {
                                permissionLauncher.launch(android.Manifest.permission.RECORD_AUDIO)
                            }) { Text("Mikrofonga ruxsat berish") }
                        }
                    }

                    DialogPhase.Recording -> Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(
                            "🔴 Yozilmoqda ${state.elapsedSec}s",
                            color = MaterialTheme.colorScheme.error,
                        )
                        Spacer(Modifier.size(12.dp))
                        MicButton(recording = true) { vm.stopRecording() }
                    }

                    DialogPhase.Done -> DonePanel(
                        score = state.result?.overallScore ?: 0,
                        feedback = state.result?.feedback ?: emptyList(),
                        onRestart = { vm.restart() },
                        onBack = onBack,
                    )
                }
            }
        }
    }
}

@Composable
private fun MessageBubble(
    text: String,
    fromCharacter: Boolean,
    characterEmoji: String,
    faded: Boolean = false,
) {
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = if (fromCharacter) Arrangement.Start else Arrangement.End,
        verticalAlignment = Alignment.Bottom,
    ) {
        if (fromCharacter) {
            Text(characterEmoji, fontSize = 22.sp)
            Spacer(Modifier.size(6.dp))
        }
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = if (fromCharacter) MaterialTheme.colorScheme.surfaceVariant
            else MaterialTheme.colorScheme.primary,
            modifier = Modifier.widthIn(max = 280.dp),
        ) {
            Text(
                text,
                modifier = Modifier.padding(12.dp),
                color = if (fromCharacter) MaterialTheme.colorScheme.onSurface
                else MaterialTheme.colorScheme.onPrimary,
                style = MaterialTheme.typography.bodyLarge,
            )
        }
        if (!fromCharacter) {
            Spacer(Modifier.size(6.dp))
            Text("🧒", fontSize = 22.sp)
        }
    }
}

@Composable
private fun MicButton(recording: Boolean, onClick: () -> Unit) {
    Surface(
        shape = CircleShape,
        color = if (recording) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
        onClick = onClick,
        modifier = Modifier.size(72.dp),
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
            Icon(
                imageVector = if (recording) Icons.Default.Stop else Icons.Default.Mic,
                contentDescription = if (recording) "To'xtatish" else "Gapirish",
                tint = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.size(34.dp),
            )
        }
    }
}

@Composable
private fun DonePanel(
    score: Int,
    feedback: List<String>,
    onRestart: () -> Unit,
    onBack: () -> Unit,
) {
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.secondaryContainer
            ),
        ) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("$score", fontSize = 34.sp, fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary)
                Text(" / 100  ✅ Suhbat tugadi", style = MaterialTheme.typography.titleMedium)
            }
        }
        Spacer(Modifier.size(8.dp))
        feedback.forEach {
            Text("• $it", style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp))
        }
        Spacer(Modifier.size(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedButton(onClick = onRestart) { Text("Qaytadan") }
            Button(onClick = onBack) { Text("Tugatish") }
        }
    }
}
