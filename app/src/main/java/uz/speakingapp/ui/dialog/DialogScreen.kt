package uz.speakingapp.ui.dialog

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.speakingapp.data.model.DialogScenario
import uz.speakingapp.ui.theme.BrandMicButton
import uz.speakingapp.ui.theme.BrandProgressBar
import uz.speakingapp.ui.theme.BrandTopBar
import uz.speakingapp.ui.theme.Danger
import uz.speakingapp.ui.theme.GradientButton
import uz.speakingapp.ui.theme.HairLine
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.InkStrong
import uz.speakingapp.ui.theme.Navy
import uz.speakingapp.ui.theme.OutlineSoft
import uz.speakingapp.ui.theme.OverlineLabel
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

    // Ilova fonga o'tsa mikrofon va personaj ovozi ochiq qolmasin.
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_STOP) vm.onScreenStopped()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

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
                            .clip(MaterialTheme.shapes.extraSmall)
                            .background(Color.White.copy(alpha = 0.14f))
                            .padding(horizontal = 10.dp, vertical = 5.dp),
                    ) {
                        Text(
                            "${(state.turnIndex + 1).coerceAtMost(state.totalTurns)} / ${state.totalTurns}",
                            color = Color.White,
                            style = OverlineLabel,
                        )
                    }
                }
            },
        )
        HairLine()

        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(state.messages.size) { i ->
                val msg = state.messages[i]
                MessageBubble(msg.text, msg.fromCharacter, scenario.characterName)
            }
            if (state.liveText.isNotBlank()) {
                item { MessageBubble(state.liveText, false, scenario.characterName, faded = true) }
            }
        }

        state.error?.let {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.Warning, contentDescription = null, tint = Danger, modifier = Modifier.size(16.dp))
                Spacer(Modifier.size(8.dp))
                Text(it, style = MaterialTheme.typography.bodySmall, color = InkStrong)
            }
        }

        HairLine()
        Surface(color = SurfaceWhite, modifier = Modifier.fillMaxWidth()) {
            Box(Modifier.padding(20.dp), contentAlignment = Alignment.Center) {
                when (state.phase) {
                    DialogPhase.NeedModel ->
                        GradientButton("Suhbatni boshlash", onClick = { vm.prepareModel() })

                    DialogPhase.PreparingModel -> Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Model yuklanmoqda", style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.size(10.dp))
                        BrandProgressBar(progress = state.downloadProgress)
                        Spacer(Modifier.size(8.dp))
                        Text(
                            "${(state.downloadProgress * 100).toInt()}%",
                            style = OverlineLabel,
                            color = InkMuted,
                        )
                    }

                    DialogPhase.CharacterSpeaking -> Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.AutoMirrored.Filled.VolumeUp,
                            contentDescription = null,
                            tint = Navy,
                            modifier = Modifier.size(18.dp),
                        )
                        Spacer(Modifier.size(10.dp))
                        Text(
                            "${scenario.characterName} gapirmoqda",
                            style = MaterialTheme.typography.bodyMedium,
                            color = InkMuted,
                        )
                    }

                    DialogPhase.StudentTurn -> Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(
                            state.currentHint,
                            style = MaterialTheme.typography.bodyLarge,
                            textAlign = TextAlign.Center,
                        )
                        Spacer(Modifier.size(16.dp))
                        if (hasMic) {
                            BrandMicButton(false, { vm.startRecording() }, Icons.Default.Mic, Icons.Default.Stop, size = 68.dp)
                        } else {
                            GradientButton("Mikrofonga ruxsat berish", onClick = {
                                permissionLauncher.launch(android.Manifest.permission.RECORD_AUDIO)
                            })
                        }
                    }

                    DialogPhase.Recording -> Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(8.dp).clip(MaterialTheme.shapes.extraSmall).background(Danger))
                            Spacer(Modifier.size(8.dp))
                            Text("YOZILMOQDA · ${state.elapsedSec}s", style = OverlineLabel, color = Danger)
                        }
                        Spacer(Modifier.size(16.dp))
                        BrandMicButton(true, { vm.stopRecording() }, Icons.Default.Mic, Icons.Default.Stop, size = 68.dp)
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
    characterName: String,
    faded: Boolean = false,
) {
    Column(
        Modifier.fillMaxWidth(),
        horizontalAlignment = if (fromCharacter) Alignment.Start else Alignment.End,
    ) {
        Text(
            if (fromCharacter) characterName.uppercase() else "SIZ",
            style = OverlineLabel,
            color = InkMuted,
        )
        Spacer(Modifier.size(4.dp))
        Box(
            modifier = Modifier
                .widthIn(max = 300.dp)
                .clip(RoundedCornerShape(4.dp))
                .then(
                    if (fromCharacter) {
                        Modifier.background(SurfaceMuted).border(1.dp, OutlineSoft, RoundedCornerShape(4.dp))
                    } else {
                        Modifier.background(Navy)
                    }
                )
                .padding(horizontal = 12.dp, vertical = 10.dp),
        ) {
            Text(
                text,
                color = if (fromCharacter) InkStrong else Color.White.copy(alpha = if (faded) 0.65f else 1f),
                style = MaterialTheme.typography.bodyLarge,
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
        ScoreRing(score, ringSize = 96.dp, stroke = 7.dp)
        Spacer(Modifier.size(10.dp))
        Text("SUHBAT TUGADI", style = OverlineLabel, color = InkMuted)
        Spacer(Modifier.size(10.dp))
        feedback.forEach {
            Text(
                it,
                style = MaterialTheme.typography.bodySmall,
                color = InkMuted,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
            )
        }
        Spacer(Modifier.size(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            SoftButton("Qaytadan", onClick = onRestart, modifier = Modifier.weight(1f))
            GradientButton("Tugatish", onClick = onBack, modifier = Modifier.weight(1f))
        }
    }
}
