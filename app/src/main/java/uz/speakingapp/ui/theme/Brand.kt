package uz.speakingapp.ui.theme

import androidx.annotation.DrawableRes
import androidx.compose.animation.core.RepeatMode
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ── Yuzalar ─────────────────────────────────────────────────────
// Gradientlar ataylab olib tashlandi: akademik uslub tekis ranglarda ishlaydi.
// Nomlar saqlangan (ekranlar `Brush` kutadi), lekin ular endi bir tusli.
val HeroGradient: Brush = SolidColor(Navy)
val PrimaryGradient: Brush = SolidColor(Navy)
val CoralGradient: Brush = SolidColor(GoldDeep)
val SuccessGradient: Brush = SolidColor(Success)

/** Modul turiga mos urg'u rangi. */
fun accentColorFor(type: String): Color = when (type) {
    "discussion" -> ModuleDiscussion
    "roleplay" -> ModuleRoleplay
    "storytelling" -> ModuleStorytelling
    "interview" -> ModuleInterview
    "picture_narrating" -> ModulePicture
    else -> Navy
}

fun accentGradientFor(type: String): Brush = SolidColor(accentColorFor(type))

// ── Naqshlar ────────────────────────────────────────────────────
// Rasm fayli qo'shilmadi: naqsh Canvas'da chiziladi. Shunda APK hajmi
// oshmaydi, ekran zichligidan qat'i nazar aniq chiqadi va offline ishlaydi.
// Web'dagi `.hero-navy` / `.pattern-page` bilan bir xil o'lchamlar (32dp to'r).

/**
 * Ko'k yuzalar uchun: chizmachilik to'ri + burchakdagi muhr halqalari.
 *
 * [scrimAlpha] 1f dan kichik bo'lsa ko'k yuza yarim shaffof bo'ladi — ostiga
 * fotosurat qo'yish uchun (qarang: [HeroPhotoBackdrop]).
 */
fun Modifier.heroPattern(
    cell: Dp = 32.dp,
    lineAlpha: Float = 0.06f,
    sealAlpha: Float = 0.07f,
    scrimAlpha: Float = 1f,
): Modifier = this
    .background(Navy.copy(alpha = scrimAlpha))
    .drawBehind {
        val step = cell.toPx()
        val stroke = 1.dp.toPx()
        var x = step
        while (x < size.width) {
            drawLine(
                color = Color.White.copy(alpha = lineAlpha),
                start = Offset(x, 0f), end = Offset(x, size.height),
                strokeWidth = stroke,
            )
            x += step
        }
        var y = step
        while (y < size.height) {
            drawLine(
                color = Color.White.copy(alpha = lineAlpha),
                start = Offset(0f, y), end = Offset(size.width, y),
                strokeWidth = stroke,
            )
            y += step
        }
        // Muhr halqalari — o'ng yuqori burchakdan chiqib turadi.
        val center = Offset(size.width + 40.dp.toPx(), -50.dp.toPx())
        listOf(150.dp, 116.dp, 82.dp).forEach { r ->
            drawCircle(
                color = Color.White.copy(alpha = sealAlpha),
                radius = r.toPx(),
                center = center,
                style = Stroke(width = stroke),
            )
        }
    }

/**
 * Fotosuratli hero yuzasi: rasm to'liq to'ldiriladi, ustidan ko'k parda va naqsh
 * tushadi. Rasm APK ichida (`drawable-nodpi`) — internetsiz ham ko'rinadi.
 * Manba va litsenziya: `web/public/hero/CREDITS.md`.
 */
@Composable
fun HeroPhotoBackdrop(
    @DrawableRes photo: Int,
    modifier: Modifier = Modifier,
    scrimAlpha: Float = 0.9f,
    content: @Composable ColumnScope.() -> Unit,
) {
    Box(modifier.fillMaxWidth()) {
        Image(
            painter = painterResource(photo),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.matchParentSize(),
        )
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .heroPattern(scrimAlpha = scrimAlpha)
                .padding(horizontal = 16.dp, vertical = 20.dp),
            content = content,
        )
    }
}

/** Ochiq sahifa foni uchun: juda past kontrastli to'r. */
fun Modifier.pagePattern(cell: Dp = 32.dp): Modifier = this
    .background(AppBackground)
    .drawBehind {
        val step = cell.toPx()
        val stroke = 1.dp.toPx()
        val color = Navy.copy(alpha = 0.045f)
        var x = step
        while (x < size.width) {
            drawLine(color, Offset(x, 0f), Offset(x, size.height), stroke)
            x += step
        }
        var y = step
        while (y < size.height) {
            drawLine(color, Offset(0f, y), Offset(size.width, y), stroke)
            y += step
        }
    }

// ── Ingichka ajratgich ──────────────────────────────────────────
@Composable
fun HairLine(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxWidth().height(1.dp).background(OutlineSoft))
}

// ── Yuqori panel ────────────────────────────────────────────────
@Composable
fun BrandTopBar(
    title: String,
    onBack: (() -> Unit)? = null,
    subtitle: String? = null,
    trailing: @Composable (() -> Unit)? = null,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .heroPattern()
            .padding(horizontal = 12.dp, vertical = 14.dp),
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
                        color = Color.White.copy(alpha = 0.75f),
                    )
                }
            }
            if (trailing != null) trailing()
        }
    }
}

/**
 * Yumaloq ikonka tugmasi. Matn glifi emas, haqiqiy vektor ikonka —
 * shunda belgi markazda aniq turadi va RTL tillarda avtomatik aylanadi.
 */
@Composable
fun CircleIconButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.14f))
            .clickable(onClick = onClick),
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

// ── Karta: soya yo'q, ingichka chegara ──────────────────────────
@Composable
fun SoftCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val base = modifier
        .fillMaxWidth()
        .clip(MaterialTheme.shapes.small)
        .background(SurfaceWhite)
        .border(1.dp, OutlineSoft, MaterialTheme.shapes.small)
    val clickable = if (onClick != null) base.clickable(onClick = onClick) else base
    Column(modifier = clickable.padding(16.dp), content = content)
}

// ── Asosiy tugma ────────────────────────────────────────────────
@Composable
fun GradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    gradient: Brush = PrimaryGradient,
    leadingIcon: ImageVector? = null,
) {
    Box(
        modifier = modifier
            .height(48.dp)
            .clip(MaterialTheme.shapes.small)
            .background(if (enabled) gradient else SolidColor(OutlineSoft))
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 20.dp),
        contentAlignment = Alignment.Center,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
            if (leadingIcon != null) {
                Icon(
                    leadingIcon,
                    contentDescription = null,
                    tint = if (enabled) Color.White else InkMuted,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.size(8.dp))
            }
            Text(
                text,
                color = if (enabled) Color.White else InkMuted,
                fontWeight = FontWeight.SemiBold,
                fontSize = 15.sp,
            )
        }
    }
}

/** Ikkilamchi (chiziqli) tugma. */
@Composable
fun SoftButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .height(48.dp)
            .clip(MaterialTheme.shapes.small)
            .border(1.dp, Navy, MaterialTheme.shapes.small)
            .clickable(onClick = onClick)
            .padding(horizontal = 20.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = Navy, fontWeight = FontWeight.Medium, fontSize = 15.sp)
    }
}

// ── Yorliq ──────────────────────────────────────────────────────
@Composable
fun Pill(text: String, container: Color, content: Color) {
    Box(
        modifier = Modifier
            .clip(MaterialTheme.shapes.extraSmall)
            .background(container)
            .padding(horizontal = 8.dp, vertical = 4.dp),
    ) {
        Text(text, color = content, style = OverlineLabel)
    }
}

// ── Mnemonika harf belgisi: kvadrat, hujjat uslubida ────────────
@Composable
fun MnemonicBadge(letter: String, gradient: Brush = PrimaryGradient, size: Dp = 30.dp) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(MaterialTheme.shapes.extraSmall)
            .background(gradient),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            letter.uppercase(),
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = (size.value * 0.44f).sp,
        )
    }
}

/** Modul tartib raqami (01, 02 …) — emoji o'rniga. */
@Composable
fun NumberBadge(index: Int, accent: Color, size: Dp = 44.dp) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(MaterialTheme.shapes.extraSmall)
            .background(accent),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            index.toString().padStart(2, '0'),
            style = ModuleNumber,
            color = Color.White,
        )
    }
}

// ── Bo'lim sarlavhasi: katta harfli yorliq + chiziq ─────────────
@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier) {
    Column(modifier.fillMaxWidth()) {
        Text(text.uppercase(), style = OverlineLabel, color = InkMuted)
        Spacer(Modifier.size(6.dp))
        HairLine()
    }
}

// ── Ball halqasi ────────────────────────────────────────────────
@Composable
fun ScoreRing(
    score: Int,
    modifier: Modifier = Modifier,
    ringSize: Dp = 120.dp,
    stroke: Dp = 8.dp,
) {
    val pct = (score.coerceIn(0, 100)) / 100f
    val ringColor = when {
        score >= 80 -> Success
        score >= 50 -> Navy
        else -> Warning
    }
    Box(modifier = modifier.size(ringSize), contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            val s = stroke.toPx()
            val inset = s / 2
            val arcSize = Size(size.width - s, size.height - s)
            val topLeft = Offset(inset, inset)
            drawArc(
                color = OutlineSoft,
                startAngle = -90f, sweepAngle = 360f, useCenter = false,
                topLeft = topLeft, size = arcSize,
                style = Stroke(width = s, cap = StrokeCap.Butt),
            )
            drawArc(
                color = ringColor,
                startAngle = -90f, sweepAngle = 360f * pct, useCenter = false,
                topLeft = topLeft, size = arcSize,
                style = Stroke(width = s, cap = StrokeCap.Butt),
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("$score", style = DisplayScore, color = InkStrong)
            Text("100 DAN", style = OverlineLabel, color = InkMuted)
        }
    }
}

// ── Mikrofon tugmasi ────────────────────────────────────────────
@Composable
fun BrandMicButton(
    recording: Boolean,
    onClick: () -> Unit,
    micIcon: ImageVector,
    stopIcon: ImageVector,
    size: Dp = 80.dp,
) {
    val transition = rememberInfiniteTransition(label = "mic")
    val pulse by transition.animateFloat(
        initialValue = 1f,
        targetValue = if (recording) 1.06f else 1f,
        animationSpec = infiniteRepeatable(tween(900), RepeatMode.Reverse),
        label = "pulse",
    )
    Surface(
        shape = CircleShape,
        onClick = onClick,
        color = Color.Transparent,
        modifier = Modifier
            .size(size)
            .graphicsLayer { if (recording) { scaleX = pulse; scaleY = pulse } },
    ) {
        Box(
            Modifier
                .fillMaxSize()
                .clip(CircleShape)
                .background(if (recording) Danger else Navy),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = if (recording) stopIcon else micIcon,
                contentDescription = if (recording) "To'xtatish" else "Gapirish",
                tint = Color.White,
                modifier = Modifier.size(size.value.times(0.36f).dp),
            )
        }
    }
}

/**
 * Mikrofon tugmasi taymer halqasi ichida. Yozish vaqti halqa bo'ylab to'ladi —
 * alohida chiziqli progressdan ko'ra diqqatni bir joyga to'playdi.
 */
@Composable
fun MicRing(
    recording: Boolean,
    elapsed: Int,
    limit: Int,
    onClick: () -> Unit,
    micIcon: ImageVector,
    stopIcon: ImageVector,
    ringSize: Dp = 132.dp,
    stroke: Dp = 5.dp,
) {
    val pct = if (limit <= 0) 0f else (elapsed.toFloat() / limit).coerceIn(0f, 1f)
    Box(modifier = Modifier.size(ringSize), contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            val s = stroke.toPx()
            val inset = s / 2
            val arcSize = Size(size.width - s, size.height - s)
            val topLeft = Offset(inset, inset)
            drawArc(
                color = OutlineSoft,
                startAngle = -90f, sweepAngle = 360f, useCenter = false,
                topLeft = topLeft, size = arcSize,
                style = Stroke(width = s, cap = StrokeCap.Butt),
            )
            if (recording) {
                drawArc(
                    color = Danger,
                    startAngle = -90f, sweepAngle = 360f * pct, useCenter = false,
                    topLeft = topLeft, size = arcSize,
                    style = Stroke(width = s, cap = StrokeCap.Butt),
                )
            }
        }
        BrandMicButton(
            recording = recording,
            onClick = onClick,
            micIcon = micIcon,
            stopIcon = stopIcon,
            size = ringSize - 32.dp,
        )
    }
}

/**
 * Mashqning eng yaxshi bali. [score] null bo'lsa — hali bajarilmagan,
 * bo'sh ramka ko'rsatiladi.
 */
@Composable
fun ScoreBadge(score: Int?, modifier: Modifier = Modifier, size: Dp = 38.dp) {
    if (score == null) {
        Box(
            modifier = modifier
                .size(size)
                .clip(MaterialTheme.shapes.extraSmall)
                .border(1.dp, OutlineSoft, MaterialTheme.shapes.extraSmall),
            contentAlignment = Alignment.Center,
        ) {
            Text("—", color = OutlineSoft, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }
        return
    }
    val container = when {
        score >= 80 -> SuccessContainer
        score >= 50 -> NavyContainer
        else -> GoldContainer
    }
    val content = when {
        score >= 80 -> Success
        score >= 50 -> Navy
        else -> OnGoldContainer
    }
    Box(
        modifier = modifier
            .size(size)
            .clip(MaterialTheme.shapes.extraSmall)
            .background(container),
        contentAlignment = Alignment.Center,
    ) {
        Text("$score", color = content, fontWeight = FontWeight.Bold, fontSize = 15.sp)
    }
}

/** Statistik plitka: raqam ustunlik qiladi, yorliq kichik va katta harfda. */
@Composable
fun StatTile(value: String, label: String, modifier: Modifier = Modifier, accent: Color = InkStrong) {
    Column(
        modifier = modifier
            .clip(MaterialTheme.shapes.small)
            .background(SurfaceWhite)
            .border(1.dp, OutlineSoft, MaterialTheme.shapes.small)
            .padding(14.dp),
    ) {
        Text(value, style = MaterialTheme.typography.headlineSmall, color = accent)
        Spacer(Modifier.size(4.dp))
        Text(label.uppercase(), style = OverlineLabel, color = InkMuted)
    }
}

/** Ramkasiz ko'rsatkich — karta ichida guruh bo'lib turadi ([StatTile] ning yengil varianti). */
@Composable
fun StatCell(value: String, label: String, modifier: Modifier = Modifier, accent: Color = InkStrong) {
    Column(modifier) {
        Text(value, style = MaterialTheme.typography.titleLarge, color = accent)
        Spacer(Modifier.size(3.dp))
        Text(label.uppercase(), style = OverlineLabel, color = InkMuted)
    }
}

/** Yig'iladigan karta — transkript kabi ikkilamchi ma'lumot uchun. */
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
                tint = InkMuted,
                modifier = Modifier.size(18.dp).rotate(if (open) 90f else 0f),
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

/** Progress chizig'i — past va tekis. */
@Composable
fun BrandProgressBar(progress: Float, modifier: Modifier = Modifier, brush: Brush = PrimaryGradient) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(6.dp)
            .clip(MaterialTheme.shapes.extraSmall)
            .background(SurfaceMuted),
    ) {
        Box(
            Modifier
                .fillMaxWidth(progress.coerceIn(0f, 1f))
                .height(6.dp)
                .clip(MaterialTheme.shapes.extraSmall)
                .background(brush),
        )
    }
}
