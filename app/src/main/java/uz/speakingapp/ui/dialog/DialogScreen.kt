package uz.speakingapp.ui.dialog

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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.speakingapp.data.model.DialogScenario
import uz.speakingapp.ui.theme.BrandMicButton
import uz.speakingapp.ui.theme.BrandProgressBar
import uz.speakingapp.ui.theme.BrandTopBar
import uz.speakingapp.ui.theme.Coral
import uz.speakingapp.ui.theme.GradientButton
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.InkStrong
import uz.speakingapp.ui.theme.PrimaryGradient
import uz.speakingapp.ui.theme.ScoreRing
import uz.speakingapp.ui.theme.SoftButton
import uz.speakingapp.ui.theme.SurfaceMuted
import uz.speakingapp.ui.theme.SurfaceWhite

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
        BrandTopBar(
            title = scenario.characterName,
            subtitle = "${scenario.topic} · ${scenario.mnemonic.acronym}",
            onBack = onBack,
            trailing = {
                if (state.totalTurns > 0 && state.phase != DialogPhase.Done) {
                    Box(
                        Modifier
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.18f))
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                    ) {
                        Text(
                            "${(state.turnIndex + 1).coerceAtMost(state.totalTurns)}/${state.totalTurns}",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                        )
                    }
                }
            },
        )

        // Suhbat tarixi
        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(state.messages.size) { i ->
                val msg = state.messages[i]
                MessageBubble(msg.text, msg.fromCharacter, scenario.characterEmoji)
            }
            if (state.liveText.isNotBlank()) {
                item { MessageBubble(state.liveText, false, scenario.characterEmoji, faded = true) }
            }
        }

        state.error?.let {
            Text("⚠️ $it", color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(horizontal = 16.dp))
        }

        // Pastki interaktiv panel
        Surface(
            color = SurfaceWhite,
            shadowElevation = 12.dp,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Box(Modifier.padding(20.dp), contentAlignment = Alignment.Center) {
                when (state.phase) {
                    DialogPhase.NeedModel -> GradientButton("Suhbatni boshlash 💬", onClick = { vm.prepareModel() })

                    DialogPhase.PreparingModel -> Column(
                        horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Model yuklanmoqda… ${(state.downloadProgress * 100).toInt()}%")
                        Spacer(Modifier.size(10.dp))
                        BrandProgressBar(progress = state.downloadProgress)
                    }

                    DialogPhase.CharacterSpeaking -> Text(
                        "🔊 ${scenario.characterName} gapiryapti…",
                        style = MaterialTheme.typography.titleMedium,
                        color = InkMuted,
                    )

                    DialogPhase.StudentTurn -> Column(
                        horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(state.currentHint, style = MaterialTheme.typography.bodyLarge, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                        Spacer(Modifier.size(14.dp))
                        if (hasMic) {
                            BrandMicButton(false, { vm.startRecording() }, Icons.Default.Mic, Icons.Default.Stop, size = 76.dp)
                        } else {
                            GradientButton("Mikrofonga ruxsat berish", onClick = {
                                permissionLauncher.launch(android.Manifest.permission.RECORD_AUDIO)
                            })
                        }
                    }

                    DialogPhase.Recording -> Column(
                        horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("🔴 Yozilmoqda ${state.elapsedSec}s", color = Coral, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.size(14.dp))
                        BrandMicButton(true, { vm.stopRecording() }, Icons.Default.Mic, Icons.Default.Stop, size = 76.dp)
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
            Avatar(characterEmoji.ifBlank { "🎭" }, gradient = false)
            Spacer(Modifier.size(8.dp))
        }
        Box(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 20.dp, topEnd = 20.dp,
                        bottomStart = if (fromCharacter) 4.dp else 20.dp,
                        bottomEnd = if (fromCharacter) 20.dp else 4.dp,
                    )
                )
                .then(
                    if (fromCharacter) Modifier.background(SurfaceMuted)
                    else Modifier.background(PrimaryGradient)
                )
                .padding(horizontal = 14.dp, vertical = 10.dp),
        ) {
            Text(
                text,
                color = if (fromCharacter) InkStrong else Color.White.copy(alpha = if (faded) 0.7f else 1f),
                style = MaterialTheme.typography.bodyLarge,
            )
        }
        if (!fromCharacter) {
            Spacer(Modifier.size(8.dp))
            Avatar("🧒", gradient = true)
        }
    }
}

@Composable
private fun Avatar(emoji: String, gradient: Boolean) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .clip(CircleShape)
            .then(if (gradient) Modifier.background(PrimaryGradient) else Modifier.background(SurfaceMuted)),
        contentAlignment = Alignment.Center,
    ) {
        Text(emoji, fontSize = 18.sp)
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
        ScoreRing(score, ringSize = 108.dp, stroke = 11.dp)
        Spacer(Modifier.size(6.dp))
        Text("✅ Suhbat tugadi", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.size(8.dp))
        feedback.forEach {
            Text(
                "• $it",
                style = MaterialTheme.typography.bodyMedium,
                color = InkMuted,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 2.dp),
            )
        }
        Spacer(Modifier.size(14.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            SoftButton("Qaytadan", onClick = onRestart)
            GradientButton("Tugatish", onClick = onBack)
        }
    }
}
