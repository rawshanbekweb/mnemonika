package uz.speakingapp.ui.conversation

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Stop
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
import uz.speakingapp.analysis.ConversationResult
import uz.speakingapp.data.model.Conversation
import uz.speakingapp.ui.theme.BrandMicButton
import uz.speakingapp.ui.theme.BrandProgressBar
import uz.speakingapp.ui.theme.BrandTopBar
import uz.speakingapp.ui.theme.CollapsibleCard
import uz.speakingapp.ui.theme.Danger
import uz.speakingapp.ui.theme.GradientButton
import uz.speakingapp.ui.theme.HairLine
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.InkStrong
import uz.speakingapp.ui.theme.Mascot
import uz.speakingapp.ui.theme.MascotMood
import uz.speakingapp.ui.theme.OverlineLabel
import uz.speakingapp.ui.theme.PrimaryGradient
import uz.speakingapp.ui.theme.ScoreRing
import uz.speakingapp.ui.theme.SoftButton
import uz.speakingapp.ui.theme.StatCell
import uz.speakingapp.ui.theme.Success
import uz.speakingapp.ui.theme.SurfaceMuted
import uz.speakingapp.ui.theme.SurfaceWhite
import uz.speakingapp.ui.theme.mascotFor

/**
 * Erkin suhbat ekrani.
 *
 * `DialogScreen` dan farqi: bu yerda navbatlar soni oldindan ma'lum emas —
 * suhbat bolaning javoblariga qarab tarmoqlanadi va belgilangan vaqt tugaganda
 * yakunlanadi. Shuning uchun yuqorida navbat raqami emas, QOLGAN VAQT turadi.
 */
@Composable
fun ConversationScreen(
    conversation: Conversation?,
    moduleId: String,
    onBack: () -> Unit,
    moduleType: String = "",
) {
    if (conversation == null) {
        Text("Suhbat topilmadi", modifier = Modifier.padding(16.dp))
        return
    }
    val friend = remember(moduleType) { mascotFor(moduleType) }
    val vm: ConversationViewModel = viewModel()
    val state by vm.state.collectAsStateWithLifecycle()
    LaunchedEffect(conversation.id) { vm.bind(conversation, moduleId) }

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
            title = conversation.characterName.ifBlank { conversation.title },
            subtitle = conversation.topic,
            onBack = onBack,
            trailing = {
                if (state.phase != ConversationPhase.Done &&
                    state.phase != ConversationPhase.NeedModel
                ) {
                    val left = (conversation.targetMinutes * 60 - state.totalElapsedSec).coerceAtLeast(0)
                    Box(
                        Modifier
                            .clip(MaterialTheme.shapes.extraSmall)
                            .background(Color.White.copy(alpha = 0.14f))
                            .padding(horizontal = 10.dp, vertical = 5.dp),
                    ) {
                        Text(
                            "%d:%02d".format(left / 60, left % 60),
                            color = Color.White,
                            style = OverlineLabel,
                        )
                    }
                }
            },
        )
        HairLine()

        // Vazifa: bola suhbatdan nima kutilayotganini boshidan biladi.
        if (state.phase == ConversationPhase.NeedModel && conversation.goalUz.isNotBlank()) {
            Text(
                conversation.goalUz,
                style = MaterialTheme.typography.bodyMedium,
                color = InkMuted,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            )
        }

        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(state.messages.size) { i ->
                val msg = state.messages[i]
                Bubble(msg.text, msg.fromCharacter, conversation.characterName)
            }
            if (state.liveText.isNotBlank()) {
                item { Bubble(state.liveText, false, conversation.characterName, faded = true) }
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
                    ConversationPhase.NeedModel ->
                        GradientButton("Suhbatni boshlash", onClick = { vm.prepareModel() })

                    ConversationPhase.PreparingModel -> Column(
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

                    ConversationPhase.CharacterSpeaking -> Row(verticalAlignment = Alignment.CenterVertically) {
                        Mascot(look = friend, mood = MascotMood.Speaking, size = 56.dp)
                        Spacer(Modifier.size(10.dp))
                        Text(
                            "${conversation.characterName} gapirmoqda",
                            style = MaterialTheme.typography.bodyMedium,
                            color = InkMuted,
                        )
                    }

                    ConversationPhase.StudentTurn -> Column(
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
                            BrandMicButton(
                                false, { vm.startRecording() },
                                Icons.Default.Mic, Icons.Default.Stop, size = 68.dp,
                            )
                            Spacer(Modifier.size(10.dp))
                            // Javob topolmagan bola suhbatda qamalib qolmasin.
                            SoftButton("Bu savolni o'tkazib yuborish", onClick = { vm.skipTurn() })
                        } else {
                            GradientButton("Mikrofonga ruxsat berish", onClick = {
                                permissionLauncher.launch(android.Manifest.permission.RECORD_AUDIO)
                            })
                        }
                    }

                    ConversationPhase.Recording -> Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Mascot(
                            look = friend,
                            mood = MascotMood.Listening,
                            size = 64.dp,
                            level = state.micLevel,
                        )
                        Spacer(Modifier.size(10.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.size(8.dp).clip(CircleShape).background(Danger))
                            Spacer(Modifier.size(8.dp))
                            Text("YOZILMOQDA · ${state.elapsedSec}s", style = OverlineLabel, color = Danger)
                        }
                        Spacer(Modifier.size(14.dp))
                        BrandMicButton(
                            true, { vm.stopRecording() }, Icons.Default.Mic, Icons.Default.Stop,
                            size = 68.dp, level = state.micLevel,
                        )
                    }

                    ConversationPhase.Done -> ResultPanel(
                        result = state.result,
                        onRestart = { vm.restart() },
                        onBack = onBack,
                    )
                }
            }
        }
    }
}

@Composable
private fun Bubble(
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
            if (fromCharacter) characterName.uppercase() else "SEN",
            style = OverlineLabel,
            color = InkMuted,
        )
        Spacer(Modifier.size(4.dp))
        val bubbleShape = if (fromCharacter) {
            RoundedCornerShape(topStart = 6.dp, topEnd = 20.dp, bottomEnd = 20.dp, bottomStart = 20.dp)
        } else {
            RoundedCornerShape(topStart = 20.dp, topEnd = 6.dp, bottomEnd = 20.dp, bottomStart = 20.dp)
        }
        Box(
            modifier = Modifier
                .widthIn(max = 300.dp)
                .clip(bubbleShape)
                .then(
                    if (fromCharacter) Modifier.background(SurfaceMuted)
                    else Modifier.background(PrimaryGradient)
                )
                .padding(horizontal = 14.dp, vertical = 11.dp),
        ) {
            Text(
                text,
                color = if (fromCharacter) InkStrong else Color.White.copy(alpha = if (faded) 0.65f else 1f),
                style = MaterialTheme.typography.bodyLarge,
            )
        }
    }
}

/**
 * Suhbat natijasi. Eng yuqorida "meni tushunishdi" ko'rsatkichi turadi —
 * bu suhbatdagi asosiy ko'nikma, ball emas.
 */
@Composable
private fun ResultPanel(
    result: ConversationResult?,
    onRestart: () -> Unit,
    onBack: () -> Unit,
) {
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        ScoreRing(result?.score ?: 0, ringSize = 96.dp, stroke = 7.dp)
        Spacer(Modifier.size(10.dp))
        Text("SUHBAT TUGADI", style = OverlineLabel, color = InkMuted)

        if (result != null) {
            Spacer(Modifier.size(14.dp))
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                StatCell(
                    "${result.understoodPercent}%",
                    "tushunildi",
                    accent = if (result.understoodPercent >= 60) Success else InkStrong,
                )
                StatCell("${result.turnCount}", "javob")
                StatCell("${result.wordCount}", "so'z")
                StatCell("${result.wordsPerMinute}", "so'z/daq")
            }

            Spacer(Modifier.size(14.dp))
            result.tips.forEach { tip ->
                Column(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Text(tip.title.uppercase(), style = OverlineLabel, color = InkMuted)
                    Spacer(Modifier.size(2.dp))
                    Text(tip.detail, style = MaterialTheme.typography.bodyMedium, color = InkStrong)
                }
            }

            if (result.transcript.isNotBlank()) {
                Spacer(Modifier.size(12.dp))
                CollapsibleCard("Nima aytganing") {
                    Text(
                        result.transcript,
                        style = MaterialTheme.typography.bodySmall,
                        color = InkMuted,
                    )
                }
            }
        }

        Spacer(Modifier.size(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            SoftButton("Qaytadan", onClick = onRestart, modifier = Modifier.weight(1f))
            GradientButton("Tugatish", onClick = onBack, modifier = Modifier.weight(1f))
        }
    }
}
