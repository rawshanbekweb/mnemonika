package uz.speakingapp.ui.theme

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ════════════════════════════════════════════════════════════════════
//  Umumiy komponentlar — bolalar uslubi
//
//  Komponent NOMLARI va IMZOLARI ataylab o'zgarmadi: ekranlar shularni
//  chaqiradi, shuning uchun butun ilova ko'rinishi shu fayl orqali
//  almashadi. Yangi imkoniyatlar (masalan mikrofon darajasi) standart
//  qiymatli parametr sifatida qo'shilgan — eski chaqiruvlar buzilmaydi.
// ════════════════════════════════════════════════════════════════════

// ── Gradientlar ─────────────────────────────────────────────────
// Akademik versiyada bular `SolidColor` edi. Endi haqiqiy gradient.
val HeroGradient: Brush = Brush.linearGradient(listOf(Sky, GrapeDeep))
val PrimaryGradient: Brush = Brush.linearGradient(listOf(Sky, SkyDeep))
val CoralGradient: Brush = Brush.linearGradient(listOf(Coral, CoralDeep))
val SuccessGradient: Brush = Brush.linearGradient(listOf(Mint, MintDeep))
val SunnyGradient: Brush = Brush.linearGradient(listOf(Sunny, SunnyDeep))

/** Modul turiga mos urg'u rangi (mascot rangi bilan bir xil). */
fun accentColorFor(type: String): Color = when (type) {
    "discussion" -> ModuleDiscussion
    "roleplay" -> ModuleRoleplay
    "storytelling" -> ModuleStorytelling
    "interview" -> ModuleInterview
    "picture_narrating" -> ModulePicture
    else -> Sky
}

fun accentGradientFor(type: String): Brush {
    val c = accentColorFor(type)
    return Brush.linearGradient(listOf(c.lighten(0.22f), c))
}

/** Rangni oqartirish — gradientning yorug' uchini olish uchun. */
private fun Color.lighten(amount: Float): Color = Color(
    red = red + (1f - red) * amount,
    green = green + (1f - green) * amount,
    blue = blue + (1f - blue) * amount,
    alpha = alpha,
)

// ── Naqshlar ────────────────────────────────────────────────────
// Rasm fayli yo'q, hammasi Canvas'da — APK hajmi oshmaydi va offline ishlaydi.

/**
 * Rangli sarlavha yuzasi: gradient + suzib yuruvchi pufakchalar.
 *
 * `scrimAlpha` akademik versiyadan qolgan (o'sha paytda ostiga fotosurat
 * qo'yilardi) — hozir foydalanuvchisi yo'q, lekin gradientni yarim shaffof
 * qilish kerak bo'lsa tayyor turadi.
 */
fun Modifier.heroPattern(
    cell: Dp = 32.dp,
    lineAlpha: Float = 0.10f,
    sealAlpha: Float = 0.12f,
    scrimAlpha: Float = 1f,
    brush: Brush = HeroGradient,
): Modifier = this
    .drawBehind {
        drawRect(brush = brush, alpha = scrimAlpha)
        // Katta yumshoq doiralar — bolalar ilovalaridagi klassik fon.
        drawCircle(
            color = Color.White.copy(alpha = sealAlpha),
            radius = size.minDimension * 0.55f,
            center = Offset(size.width * 0.92f, -size.height * 0.15f),
        )
        drawCircle(
            color = Color.White.copy(alpha = lineAlpha),
            radius = size.minDimension * 0.34f,
            center = Offset(size.width * 0.08f, size.height * 1.05f),
        )
        drawCircle(
            color = Color.White.copy(alpha = lineAlpha * 0.8f),
            radius = size.minDimension * 0.16f,
            center = Offset(size.width * 0.72f, size.height * 0.85f),
        )
    }

/** Sahifa foni: iliq krem + juda yumshoq rangli dog'lar. */
fun Modifier.pagePattern(cell: Dp = 32.dp): Modifier = this
    .background(AppBackground)
    .drawBehind {
        drawCircle(
            color = SkyContainer.copy(alpha = 0.55f),
            radius = size.width * 0.42f,
            center = Offset(size.width * 1.05f, size.height * 0.08f),
        )
        drawCircle(
            color = SunnyContainer.copy(alpha = 0.5f),
            radius = size.width * 0.30f,
            center = Offset(-size.width * 0.12f, size.height * 0.42f),
        )
    }

// ── Ajratgich ───────────────────────────────────────────────────
@Composable
fun HairLine(modifier: Modifier = Modifier) {
    Box(
        modifier
            .fillMaxWidth()
            .height(2.dp)
            .clip(CircleShape)
            .background(OutlineSoft),
    )
}

// ── Yuqori panel ────────────────────────────────────────────────
/**
 * Sarlavha paneli. Pastki burchaklari yumaloq — panel ekranga
 * "qo'yilgan" kartadek ko'rinadi, tekis chiziq bilan kesilgandek emas.
 */
@Composable
fun BrandTopBar(
    title: String,
    onBack: (() -> Unit)? = null,
    subtitle: String? = null,
    trailing: @Composable (() -> Unit)? = null,
    brush: Brush = HeroGradient,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(androidx.compose.foundation.shape.RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp))
            .heroPattern(brush = brush)
            .padding(horizontal = 12.dp, vertical = 16.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            if (onBack != null) {
                CircleIconButton(
                    icon = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Orqaga",
                    onClick = onBack,
                )
                Spacer(Modifier.size(10.dp))
            }
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleLarge, color = Color.White)
                if (subtitle != null) {
                    Text(
                        subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.85f),
                    )
                }
            }
            if (trailing != null) trailing()
        }
    }
}

@Composable
fun CircleIconButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .size(42.dp)
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.22f))
            .bouncyClick(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = Color.White,
            modifier = Modifier.size(22.dp),
        )
    }
}

// ── Karta ───────────────────────────────────────────────────────
/** Yumaloq, yumshoq soyali oq karta. Chegara o'rniga soya — yengilroq ko'rinadi. */
@Composable
fun SoftCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = MaterialTheme.shapes.medium
    val base = modifier
        .fillMaxWidth()
        .shadow(elevation = 6.dp, shape = shape, spotColor = SkyDeep.copy(alpha = 0.35f))
        .clip(shape)
        .background(SurfaceWhite)
    val interactive = if (onClick != null) base.bouncyClick(onClick = onClick) else base
    Column(modifier = interactive.padding(16.dp), content = content)
}

// ── Tugmalar ────────────────────────────────────────────────────
@Composable
fun GradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    gradient: Brush = PrimaryGradient,
    leadingIcon: ImageVector? = null,
) {
    val shape = CircleShape // To'liq yumaloq uchli tugma — bolalar uslubining asosiy belgisi.
    Box(
        modifier = modifier
            .height(54.dp)
            .then(
                if (enabled) Modifier.shadow(8.dp, shape, spotColor = SkyDeep.copy(alpha = 0.5f))
                else Modifier,
            )
            .clip(shape)
            .background(if (enabled) gradient else SolidColor(OutlineSoft))
            .bouncyClick(enabled = enabled, onClick = onClick)
            .padding(horizontal = 24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
            if (leadingIcon != null) {
                Icon(
                    leadingIcon,
                    contentDescription = null,
                    tint = if (enabled) Color.White else InkMuted,
                    modifier = Modifier.size(20.dp),
                )
                Spacer(Modifier.size(8.dp))
            }
            Text(
                text,
                color = if (enabled) Color.White else InkMuted,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
            )
        }
    }
}

@Composable
fun SoftButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .height(54.dp)
            .clip(CircleShape)
            .background(SkyContainer)
            .border(2.dp, Sky.copy(alpha = 0.45f), CircleShape)
            .bouncyClick(onClick = onClick)
            .padding(horizontal = 24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = SkyDark, fontWeight = FontWeight.Bold, fontSize = 16.sp)
    }
}

// ── Yorliq ──────────────────────────────────────────────────────
@Composable
fun Pill(text: String, container: Color, content: Color) {
    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(container)
            .padding(horizontal = 12.dp, vertical = 6.dp),
    ) {
        Text(text, color = content, style = OverlineLabel)
    }
}

// ── Mnemonika harfi ─────────────────────────────────────────────
/** Mnemonika bosqichi harfi — yumaloq, rangli belgi. */
@Composable
fun MnemonicBadge(letter: String, gradient: Brush = PrimaryGradient, size: Dp = 36.dp) {
    Box(
        modifier = Modifier
            .size(size)
            .shadow(4.dp, CircleShape, spotColor = SkyDeep.copy(alpha = 0.4f))
            .clip(CircleShape)
            .background(gradient),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            letter.uppercase(),
            color = Color.White,
            fontWeight = FontWeight.ExtraBold,
            fontSize = (size.value * 0.46f).sp,
        )
    }
}

/** Modul tartib raqami. Modul kartasida mascot bilan yonma-yon turadi. */
@Composable
fun NumberBadge(index: Int, accent: Color, size: Dp = 44.dp) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(MaterialTheme.shapes.small)
            .background(accent.copy(alpha = 0.15f)),
        contentAlignment = Alignment.Center,
    ) {
        Text(index.toString().padStart(2, '0'), style = ModuleNumber, color = accent)
    }
}

// ── Bo'lim sarlavhasi ───────────────────────────────────────────
/** Chiziq o'rniga rangli nuqta — yumshoqroq va bolalarcha. */
@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier, accent: Color = Sky) {
    Row(modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(8.dp).clip(CircleShape).background(accent))
        Spacer(Modifier.size(8.dp))
        Text(text.uppercase(), style = OverlineLabel, color = InkMuted)
    }
}

// ── Ball halqasi ────────────────────────────────────────────────
/**
 * Natija halqasi. Ball nolga emas, joriy qiymatgacha "yig'iladi" va
 * halqa shu bilan birga to'ladi — natijani kutish zavqli bo'lsin.
 */
@Composable
fun ScoreRing(
    score: Int,
    modifier: Modifier = Modifier,
    ringSize: Dp = 140.dp,
    stroke: Dp = 14.dp,
) {
    val shown = animatedNumber(score.coerceIn(0, 100))
    val sweep by animateFloatAsState(
        targetValue = score.coerceIn(0, 100) / 100f,
        animationSpec = tween(900),
        label = "sweep",
    )
    val ringBrush = when {
        score >= 80 -> SuccessGradient
        score >= 50 -> PrimaryGradient
        else -> SunnyGradient
    }
    Box(modifier = modifier.size(ringSize), contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            val s = stroke.toPx()
            val inset = s / 2
            val arcSize = Size(size.width - s, size.height - s)
            val topLeft = Offset(inset, inset)
            drawArc(
                color = SurfaceMuted,
                startAngle = -90f, sweepAngle = 360f, useCenter = false,
                topLeft = topLeft, size = arcSize,
                style = Stroke(width = s, cap = StrokeCap.Round),
            )
            drawArc(
                brush = ringBrush,
                startAngle = -90f, sweepAngle = 360f * sweep, useCenter = false,
                topLeft = topLeft, size = arcSize,
                style = Stroke(width = s, cap = StrokeCap.Round),
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("$shown", style = DisplayScore, color = InkStrong)
            Text("100 DAN", style = OverlineLabel, color = InkMuted)
        }
    }
}

// ── Mikrofon ────────────────────────────────────────────────────
/**
 * Mikrofon tugmasi.
 *
 * [level] 0f..1f — bola qanchalik baland gapirayotgani. Tugma atrofidagi
 * halqalar shunga qarab kengayadi, ya'ni bola ilova uni "eshitayotganini"
 * ko'rib turadi. Bu jim gapiradigan bolani ovozini ko'tarishga undaydi.
 */
@Composable
fun BrandMicButton(
    recording: Boolean,
    onClick: () -> Unit,
    micIcon: ImageVector,
    stopIcon: ImageVector,
    size: Dp = 88.dp,
    level: Float = 0f,
) {
    val transition = rememberInfiniteTransition(label = "mic")
    val pulse by transition.animateFloat(
        initialValue = 1f,
        targetValue = if (recording) 1.07f else 1f,
        animationSpec = infiniteRepeatable(tween(820), RepeatMode.Reverse),
        label = "pulse",
    )
    val smoothLevel by animateFloatAsState(
        targetValue = level.coerceIn(0f, 1f),
        animationSpec = tween(120),
        label = "micLevel",
    )

    Box(contentAlignment = Alignment.Center) {
        // Ovoz to'lqinlari — faqat yozuv paytida chiziladi. Bitta Canvas,
        // uchta doira: yozuv paytida Vosk protsessorni band qilgani uchun
        // bu yerda hisob-kitob minimal bo'lishi kerak.
        if (recording) {
            Canvas(Modifier.size(size * 1.75f)) {
                val base = this.size.minDimension / 2
                listOf(0.62f to 0.30f, 0.78f to 0.18f, 0.94f to 0.10f).forEach { (f, alpha) ->
                    drawCircle(
                        color = Danger.copy(alpha = alpha * (0.45f + smoothLevel)),
                        radius = base * (f + smoothLevel * 0.06f),
                    )
                }
            }
        }
        Box(
            Modifier
                .size(size)
                .graphicsLayer { if (recording) { scaleX = pulse; scaleY = pulse } }
                .shadow(10.dp, CircleShape, spotColor = (if (recording) Danger else SkyDeep).copy(alpha = 0.6f))
                .clip(CircleShape)
                .background(if (recording) CoralGradient else PrimaryGradient)
                .bouncyClick(onClick = onClick),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = if (recording) stopIcon else micIcon,
                contentDescription = if (recording) "To'xtatish" else "Gapirish",
                tint = Color.White,
                modifier = Modifier.size(size.value.times(0.40f).dp),
            )
        }
    }
}

/** Mikrofon tugmasi taymer halqasi ichida. */
@Composable
fun MicRing(
    recording: Boolean,
    elapsed: Int,
    limit: Int,
    onClick: () -> Unit,
    micIcon: ImageVector,
    stopIcon: ImageVector,
    ringSize: Dp = 150.dp,
    stroke: Dp = 7.dp,
    level: Float = 0f,
) {
    val pct = if (limit <= 0) 0f else (elapsed.toFloat() / limit).coerceIn(0f, 1f)
    Box(modifier = Modifier.size(ringSize), contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            val s = stroke.toPx()
            val inset = s / 2
            val arcSize = Size(size.width - s, size.height - s)
            val topLeft = Offset(inset, inset)
            drawArc(
                color = SurfaceMuted,
                startAngle = -90f, sweepAngle = 360f, useCenter = false,
                topLeft = topLeft, size = arcSize,
                style = Stroke(width = s, cap = StrokeCap.Round),
            )
            if (recording) {
                drawArc(
                    color = Danger,
                    startAngle = -90f, sweepAngle = 360f * pct, useCenter = false,
                    topLeft = topLeft, size = arcSize,
                    style = Stroke(width = s, cap = StrokeCap.Round),
                )
            }
        }
        BrandMicButton(
            recording = recording,
            onClick = onClick,
            micIcon = micIcon,
            stopIcon = stopIcon,
            size = ringSize - 44.dp,
            level = level,
        )
    }
}

// ── Ball belgisi ────────────────────────────────────────────────
/** Mashqning eng yaxshi bali. Null bo'lsa — hali bajarilmagan. */
@Composable
fun ScoreBadge(score: Int?, modifier: Modifier = Modifier, size: Dp = 42.dp) {
    if (score == null) {
        Box(
            modifier = modifier
                .size(size)
                .clip(CircleShape)
                .background(SurfaceMuted),
            contentAlignment = Alignment.Center,
        ) {
            Text("?", color = InkMuted, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
        }
        return
    }
    val container = when {
        score >= 80 -> MintContainer
        score >= 50 -> SkyContainer
        else -> SunnyContainer
    }
    val content = when {
        score >= 80 -> OnMintContainer
        score >= 50 -> OnSkyContainer
        else -> OnSunnyContainer
    }
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(container),
        contentAlignment = Alignment.Center,
    ) {
        Text("$score", color = content, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
    }
}

// ── Ko'rsatkichlar ──────────────────────────────────────────────
@Composable
fun StatTile(value: String, label: String, modifier: Modifier = Modifier, accent: Color = Sky) {
    Column(
        modifier = modifier
            .clip(MaterialTheme.shapes.small)
            .background(accent.copy(alpha = 0.12f))
            .padding(14.dp),
    ) {
        Text(value, style = MaterialTheme.typography.headlineSmall, color = accent)
        Spacer(Modifier.size(4.dp))
        Text(label.uppercase(), style = OverlineLabel, color = InkMuted)
    }
}

@Composable
fun StatCell(value: String, label: String, modifier: Modifier = Modifier, accent: Color = InkStrong) {
    Column(modifier) {
        Text(value, style = MaterialTheme.typography.titleLarge, color = accent)
        Spacer(Modifier.size(3.dp))
        Text(label.uppercase(), style = OverlineLabel, color = InkMuted)
    }
}

// ── Yig'iladigan karta ──────────────────────────────────────────
@Composable
fun CollapsibleCard(title: String, content: @Composable ColumnScope.() -> Unit) {
    var open by remember { mutableStateOf(false) }
    SoftCard {
        Row(
            modifier = Modifier.fillMaxWidth().clickable { open = !open },
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = Sky,
                modifier = Modifier.size(20.dp).rotate(if (open) 90f else 0f),
            )
            Spacer(Modifier.size(8.dp))
            Text(title.uppercase(), style = OverlineLabel, color = InkMuted)
        }
        if (open) {
            Spacer(Modifier.size(12.dp))
            content()
        }
    }
}

// ── Progress ────────────────────────────────────────────────────
/** Qalinroq va yumaloq progress — bolalarga ko'rinarli bo'lsin. */
@Composable
fun BrandProgressBar(progress: Float, modifier: Modifier = Modifier, brush: Brush = PrimaryGradient) {
    val animated by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(700),
        label = "progress",
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(12.dp)
            .clip(CircleShape)
            .background(SurfaceMuted),
    ) {
        Box(
            Modifier
                .fillMaxWidth(animated)
                .height(12.dp)
                .clip(CircleShape)
                .background(brush),
        )
    }
}
