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
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
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
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import uz.speakingapp.analysis.CoachTip
import uz.speakingapp.analysis.KeywordMatcher
import uz.speakingapp.analysis.ReadAloudResult
import uz.speakingapp.analysis.ReadWord
import uz.speakingapp.analysis.SpeechResult
import uz.speakingapp.analysis.TipKind
import uz.speakingapp.analysis.WordStatus
import uz.speakingapp.data.model.Exercise
import uz.speakingapp.data.model.Mnemonic
import uz.speakingapp.speech.ModelManager
import uz.speakingapp.ui.theme.BrandProgressBar
import uz.speakingapp.ui.theme.CollapsibleCard
import uz.speakingapp.ui.theme.BrandTopBar
import uz.speakingapp.ui.theme.Confetti
import uz.speakingapp.ui.theme.Danger
import uz.speakingapp.ui.theme.Mascot
import uz.speakingapp.ui.theme.MascotLook
import uz.speakingapp.ui.theme.MascotMood
import uz.speakingapp.ui.theme.MascotSays
import uz.speakingapp.ui.theme.PopIn
import uz.speakingapp.ui.theme.Sky
import uz.speakingapp.ui.theme.accentGradientFor
import uz.speakingapp.ui.theme.mascotFor
import uz.speakingapp.ui.theme.moodForScore
import uz.speakingapp.ui.theme.pagePattern
import uz.speakingapp.ui.theme.GoldContainer
import uz.speakingapp.ui.theme.GradientButton
import uz.speakingapp.ui.theme.HairLine
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.InkStrong
import uz.speakingapp.ui.theme.MicRing
import uz.speakingapp.ui.theme.MnemonicBadge
import uz.speakingapp.ui.theme.Navy
import uz.speakingapp.ui.theme.NavyContainer
import uz.speakingapp.ui.theme.OnGoldContainer
import uz.speakingapp.ui.theme.OnNavyContainer
import uz.speakingapp.ui.theme.OutlineSoft
import uz.speakingapp.ui.theme.OverlineLabel
import uz.speakingapp.ui.theme.PauseToggle
import uz.speakingapp.ui.theme.Pill
import uz.speakingapp.ui.theme.ScoreRing
import uz.speakingapp.ui.theme.SectionTitle
import uz.speakingapp.ui.theme.SoftButton
import uz.speakingapp.ui.theme.SoftCard
import uz.speakingapp.ui.theme.StatCell
import uz.speakingapp.ui.theme.Success
import uz.speakingapp.ui.theme.SuccessContainer
import uz.speakingapp.ui.theme.SurfaceMuted
import uz.speakingapp.ui.theme.VisualTile

@Composable
fun ExerciseScreen(
    exercise: Exercise?,
    moduleId: String,
    onBack: () -> Unit,
    // Modul do'stini tanlash uchun. Bo'sh bo'lsa Bulbulning o'zi chiqadi —
    // shuning uchun chaqiruvchi turni bilmasa ham ekran to'liq ishlaydi.
    moduleType: String = "",
) {
    if (exercise == null) {
        Text("Mashq topilmadi", modifier = Modifier.padding(16.dp))
        return
    }

    // Butun ekran davomida bitta personaj hamroh bo'ladi: savolni u o'qiydi,
    // gapirganda u tinglaydi, natijada u quvonadi yoki dalda beradi.
    val friend = remember(moduleType) { mascotFor(moduleType) }

    val vm: ExerciseViewModel = viewModel()
    val state by vm.state.collectAsStateWithLifecycle()
    LaunchedEffect(exercise.id) { vm.bind(exercise, moduleId) }

    // Ilova fonga o'tsa mikrofon ochiq qolmasin va taymer sanashda davom etmasin.
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_STOP) vm.onScreenStopped()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

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

    // Yuqori ball olinganda konfetti tushadi. `Box` ichida — konfetti butun
    // ekran ustidan yog'adi, lekin bosishlarni to'smaydi (Canvas'da hech qanday
    // bosish ushlagichi yo'q).
    val celebrate = state.phase == Phase.Done && (state.result?.overallScore ?: 0) >= 80

    Box(Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize().pagePattern()) {
            BrandTopBar(
                title = exercise.title,
                subtitle = exercise.topic,
                onBack = onBack,
                brush = accentGradientFor(moduleType),
            )
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                if (exercise.visuals.isNotEmpty()) VisualStrip(exercise)
                PromptCard(
                    exercise = exercise,
                    speaking = state.speaking,
                    friend = friend,
                    onListen = { vm.speakPrompts() },
                )

                state.error?.let { err -> ErrorNote(err) }

                when (state.phase) {
                    Phase.NeedModel -> ModelPrepareSection(onPrepare = { vm.prepareModel() })
                    Phase.PreparingModel -> DownloadSection(
                        progress = state.downloadProgress,
                        label = state.downloadLabel,
                        friend = friend,
                    )
                    Phase.Ready -> RecordSection(
                        hasPermission = hasMicPermission,
                        timeLimitSec = state.timeLimitSec,
                        friend = friend,
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
                        paused = state.paused,
                        friend = friend,
                        onStop = { vm.stopRecording() },
                        onTogglePause = {
                            if (state.paused) vm.resumeRecording() else vm.pauseRecording()
                        },
                    )
                    Phase.Analyzing -> AnalyzingSection(
                        transcript = state.transcript,
                        friend = friend,
                    )
                    Phase.Done -> state.result?.let { result ->
                        ResultSection(
                            result = result,
                            keywords = if (exercise.isReadAloud) emptyList() else exercise.keywords,
                            checkingGrammar = state.checkingGrammar,
                            readResult = state.readResult,
                            friend = friend,
                            onRetry = { vm.startRecording() },
                        )
                    }
                }
                Spacer(Modifier.size(8.dp))
            }
        }
        Confetti(active = celebrate)
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
private fun VisualStrip(exercise: Exercise) {
    LazyRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        itemsIndexed(exercise.visuals) { index, token ->
            VisualTile(token, imageUrl = exercise.visualImageAt(index), size = 88.dp)
        }
    }
}

@Composable
private fun PromptCard(
    exercise: Exercise,
    speaking: Boolean,
    friend: MascotLook,
    onListen: () -> Unit,
) {
    SoftCard {
        // Savolni personaj o'qib berayotgandek ko'rinadi: audio yoki TTS
        // ijro etilayotganda tumshug'i qimirlaydi.
        Row(verticalAlignment = Alignment.CenterVertically) {
            Mascot(
                look = friend,
                mood = if (speaking) MascotMood.Speaking else MascotMood.Idle,
                size = 52.dp,
            )
            Spacer(Modifier.size(10.dp))
            Box(Modifier.weight(1f)) { Pill(exercise.topic, NavyContainer, OnNavyContainer) }
            if (exercise.isReadAloud || exercise.prompts.isNotEmpty()) {
                ListenButton(speaking = speaking, onClick = onListen)
            }
        }

        // "Takrorlang" mashqi: savollar va mnemonika o'rniga o'qiladigan matn.
        if (exercise.isReadAloud) {
            Spacer(Modifier.size(14.dp))
            SectionTitle("Shu jumlani o'qing")
            Spacer(Modifier.size(12.dp))
            Text(
                exercise.targetText,
                style = MaterialTheme.typography.headlineSmall,
                color = InkStrong,
            )
            Spacer(Modifier.size(14.dp))
            Text(
                "Avval namunani eshiting, keyin mikrofonni bosib aynan shu jumlani o'qing. " +
                    "Har bir so'z alohida tekshiriladi.",
                style = MaterialTheme.typography.bodyMedium,
                color = InkMuted,
            )
            return@SoftCard
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
                        .size(width = 5.dp, height = if (active) 20.dp else 12.dp)
                        .clip(MaterialTheme.shapes.extraSmall)
                        .background(if (active) Sky else OutlineSoft)
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
private fun DownloadSection(progress: Float, label: String, friend: MascotLook) {
    SoftCard {
        // Yuklanish uzoq davom etadi (125MB) — personaj kutayotganini
        // ko'rsatib turadi, bola ilova qotib qolgan deb o'ylamaydi.
        Row(verticalAlignment = Alignment.CenterVertically) {
            Mascot(look = friend, mood = MascotMood.Thinking, size = 48.dp)
            Spacer(Modifier.size(10.dp))
            Text("Model yuklanmoqda…", style = MaterialTheme.typography.titleSmall)
        }
        Spacer(Modifier.size(12.dp))
        BrandProgressBar(progress = progress)
        Spacer(Modifier.size(8.dp))
        // Foizning yonida megabaytlar ham turadi: sekin internetda foiz
        // daqiqalab o'zgarmaydi va ekran qotib qolganday ko'rinadi.
        Text(
            listOf("${(progress * 100).toInt()}%", label).filter { it.isNotBlank() }.joinToString(" · "),
            style = OverlineLabel,
            color = InkMuted,
        )
        Spacer(Modifier.size(8.dp))
        Text(
            "Ilovani yopmang. Boshqa ekranga o'tsangiz yuklanish davom etadi, " +
                "uzilib qolsa esa o'sha joyidan boshlanadi.",
            style = MaterialTheme.typography.bodySmall,
            color = InkMuted,
        )
    }
}

@Composable
private fun RecordSection(
    hasPermission: Boolean,
    timeLimitSec: Int,
    friend: MascotLook,
    onRequestPermission: () -> Unit,
    onStart: () -> Unit,
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        MascotSays(
            look = friend,
            text = if (hasPermission) friend.greeting else "Gapirganingni eshitishim uchun mikrofonga ruxsat kerak.",
            mood = MascotMood.Idle,
            bubbleColor = SurfaceMuted,
        )
        Spacer(Modifier.size(18.dp))
        if (hasPermission) {
            Text("Mikrofonni bos va gapir", style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.size(4.dp))
            Text("Eng ko'pi $timeLimitSec soniya", style = OverlineLabel, color = InkMuted)
            Spacer(Modifier.size(18.dp))
            MicRing(
                recording = false,
                elapsed = 0,
                limit = timeLimitSec,
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
    paused: Boolean,
    friend: MascotLook,
    onStop: () -> Unit,
    onTogglePause: () -> Unit,
) {
    val shown = listOf(transcript, live).filter { it.isNotBlank() }.joinToString(" ")
    val spoken = remember(shown, keywords) { spokenKeywords(shown, keywords) }

    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        // Personaj ovoz balandligiga qarab jonlanadi — bola ilova uni
        // eshitayotganini ko'rib turadi. Jim gapiradigan bolani ovozini
        // ko'tarishga undaydigan eng kuchli signal shu.
        Mascot(
            look = friend,
            mood = if (paused) MascotMood.Idle else MascotMood.Listening,
            size = 84.dp,
            level = micLevel,
        )
        Spacer(Modifier.size(10.dp))
        MicRing(
            recording = true,
            elapsed = elapsed,
            limit = limit,
            onClick = onStop,
            micIcon = Icons.Default.Mic,
            stopIcon = Icons.Default.Stop,
            level = micLevel,
        )
        Spacer(Modifier.size(14.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(8.dp)
                    .clip(MaterialTheme.shapes.extraSmall)
                    .background(if (paused) InkMuted else Danger)
            )
            Spacer(Modifier.size(8.dp))
            Text(
                if (paused) {
                    "PAUZADA · ${(limit - elapsed).coerceAtLeast(0)}s QOLDI"
                } else {
                    "YOZILMOQDA · ${(limit - elapsed).coerceAtLeast(0)}s QOLDI"
                },
                style = OverlineLabel,
                color = if (paused) InkMuted else Danger,
            )
        }
        Spacer(Modifier.size(14.dp))
        // Pauza — o'ylab olish, savolni qayta o'qish yoki yo'talib olish uchun.
        // Yozuv tugamaydi: aytilgan matn saqlanadi, taymer to'xtaydi.
        PauseToggle(paused = paused, onClick = onTogglePause)
        Spacer(Modifier.size(14.dp))
        if (paused) {
            Text(
                "Yozuv to'xtatib turildi. Davom etganingda shu joyidan yoziladi.",
                style = MaterialTheme.typography.bodySmall,
                color = InkMuted,
            )
        } else {
            MicLevelBar(micLevel)
        }
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

/**
 * To'xtatish bosilgandan keyingi qisqa oraliq: mikrofon o'chdi, tanigich
 * oxirgi bo'lakni dekodlamoqda. Bu ekran ATAYIN bor — sekin telefonda bu
 * bir necha soniya davom etadi va oldin bola "yozilmoqda" ni ko'rib turib,
 * tugma ishlamadi deb yana bosardi.
 */
@Composable
private fun AnalyzingSection(transcript: String, friend: MascotLook) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        MascotSays(
            look = friend,
            text = "Eshitganlarimni tekshiryapman…",
            mood = MascotMood.Thinking,
            mascotSize = 76.dp,
            bubbleColor = SurfaceMuted,
        )
        Spacer(Modifier.size(18.dp))
        // Aniqlanmagan (indeterminate) chiziq: qancha qolganini bilmaymiz,
        // faqat ish ketayotganini ko'rsatamiz.
        LinearProgressIndicator(
            modifier = Modifier.fillMaxWidth().height(10.dp).clip(MaterialTheme.shapes.extraSmall),
            color = Navy,
            trackColor = SurfaceMuted,
        )
        if (transcript.isNotBlank()) {
            Spacer(Modifier.size(18.dp))
            SoftCard {
                SectionTitle("Nutqingiz")
                Spacer(Modifier.size(10.dp))
                Text(transcript, style = MaterialTheme.typography.bodyLarge)
            }
        }
    }
}

@Composable
private fun ResultSection(
    result: SpeechResult,
    keywords: List<String>,
    checkingGrammar: Boolean,
    readResult: ReadAloudResult?,
    friend: MascotLook,
    onRetry: () -> Unit,
) {
    // Personaj bolaning tilida gapiradi — quruq "A'lo natija" emas.
    val message = when {
        result.overallScore >= 80 -> "Zo'r! Juda yaxshi gapirding!"
        result.overallScore >= 50 -> "Yaxshi bo'ldi! Yana bir oz mashq qilamiz."
        else -> "Boshlanish yaxshi — qani, yana bir marta!"
    }
    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // Ball va ko'rsatkichlar — bitta blokda.
        SoftCard {
            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                ScoreRing(result.overallScore)
                Spacer(Modifier.size(14.dp))
                MascotSays(
                    look = friend,
                    text = message,
                    mood = moodForScore(result.overallScore),
                    mascotSize = 76.dp,
                    bubbleColor = SurfaceMuted,
                )
            }
            Spacer(Modifier.size(18.dp))
            HairLine()
            Spacer(Modifier.size(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatCell("${result.wordCount}", "So'zlar", Modifier.weight(1f))
                StatCell("${result.uniqueWordCount}", "Noyob so'z", Modifier.weight(1f))
                StatCell("${result.wordsPerMinute}", "So'z/daqiqa", Modifier.weight(1f))
            }
            Spacer(Modifier.size(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatCell("${result.durationSec}s", "Davomiylik", Modifier.weight(1f))
                StatCell(
                    "${result.matchedKeywords.size}/${result.totalKeywords}",
                    if (readResult != null) "To'g'ri so'z" else "Kalit so'zlar",
                    Modifier.weight(1f),
                    accent = Success,
                )
                if (readResult != null) {
                    StatCell("${readResult.extraCount}", "Ortiqcha so'z", Modifier.weight(1f))
                } else {
                    val grammar = when {
                        result.grammarScore != null -> "${result.grammarScore}"
                        checkingGrammar -> "…"
                        else -> "—"
                    }
                    StatCell(grammar, "Grammatika", Modifier.weight(1f))
                }
            }
        }

        // "Takrorlang": har bir kutilgan so'z alohida belgilanadi.
        if (readResult != null && readResult.words.isNotEmpty()) {
            SoftCard {
                SectionTitle(
                    "So'zma-so'z · ${readResult.correctCount}/${readResult.targetCount} to'g'ri"
                )
                Spacer(Modifier.size(12.dp))
                ReadWords(readResult.words)
                Spacer(Modifier.size(14.dp))
                Text(
                    "Qizil belgilangan so'zlar eshitilmadi yoki boshqacha aytildi.",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
            }
        }

        if (keywords.isNotEmpty()) {
            SoftCard {
                SectionTitle("Kalit so'zlar · ${result.matchedKeywords.size}/${keywords.size}")
                Spacer(Modifier.size(10.dp))
                KeywordChips(keywords, result.matchedKeywords.toSet())
            }
        }

        // Tavsiyalar va grammatika bitta kartada — natija ustuni qisqaradi.
        SoftCard {
            SectionTitle("Tavsiyalar")
            Spacer(Modifier.size(10.dp))
            // Suhbat moduli tips'siz SpeechResult yasaydi — u yerda eski ko'rinish.
            if (result.tips.isEmpty()) {
                result.feedback.forEach { BulletLine(it) }
            } else {
                result.tips.forEach { TipLine(it) }
            }

            if (result.grammarIssues.isNotEmpty()) {
                Spacer(Modifier.size(18.dp))
                SectionTitle("Grammatika e'tibori")
                Spacer(Modifier.size(10.dp))
                result.grammarIssues.forEach { BulletLine(it) }
            }
        }

        if (result.transcript.isNotBlank()) {
            CollapsibleCard("Nutqingiz (matn)") {
                Text(result.transcript, style = MaterialTheme.typography.bodyMedium, color = InkMuted)
            }
        }

        SoftButton("Qayta urinish", onClick = onRetry, modifier = Modifier.fillMaxWidth())
    }
}

/**
 * "Takrorlang" natijasi: kutilgan matn, har bir so'z alohida bo'yalgan.
 * Bitta AnnotatedString ishlatiladi — shunda satrga sig'magan so'zlar
 * o'z-o'zidan keyingi qatorga o'tadi.
 */
@Composable
private fun ReadWords(words: List<ReadWord>) {
    val text = buildAnnotatedString {
        words.forEachIndexed { i, w ->
            val correct = w.status == WordStatus.CORRECT
            withStyle(
                SpanStyle(
                    color = if (correct) Success else Danger,
                    fontWeight = if (correct) FontWeight.Normal else FontWeight.Bold,
                    textDecoration = if (correct) null else TextDecoration.Underline,
                )
            ) { append(w.word) }
            if (i < words.size - 1) append(" ")
        }
    }
    Text(text, style = MaterialTheme.typography.titleMedium)
}

/**
 * Sarlavhali maslahat. Rangli kvadratcha turini bildiradi: yashil — maqtov,
 * oltin — struktura (eng muhim tuzatish), ko'k — qolgani.
 */
@Composable
private fun TipLine(tip: CoachTip) {
    val mark = when (tip.kind) {
        TipKind.PRAISE -> Success
        TipKind.STRUCTURE -> OnGoldContainer
        else -> Navy
    }
    Row(Modifier.padding(vertical = 6.dp)) {
        Box(
            Modifier
                .padding(top = 6.dp, end = 10.dp)
                .size(8.dp)
                .background(mark)
        )
        Column {
            Text(tip.title, style = MaterialTheme.typography.titleSmall, color = InkStrong)
            Text(tip.detail, style = MaterialTheme.typography.bodyMedium, color = InkMuted)
        }
    }
}

@Composable
private fun BulletLine(text: String) {
    Row(Modifier.padding(vertical = 3.dp)) {
        Text("—", color = InkMuted, fontSize = 14.sp, modifier = Modifier.size(width = 18.dp, height = 20.dp))
        Text(text, style = MaterialTheme.typography.bodyMedium)
    }
}
