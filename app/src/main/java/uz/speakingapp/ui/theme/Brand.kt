package uz.speakingapp.ui.theme

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Canvas

// ── Gradientlar ─────────────────────────────────────────────────
val HeroGradient = Brush.linearGradient(listOf(Color(0xFF9333EA), Color(0xFF6D28D9)))
val PrimaryGradient = Brush.linearGradient(listOf(Color(0xFF7C3AED), Color(0xFF6D28D9)))
val CoralGradient = Brush.linearGradient(listOf(Color(0xFFFB7185), Color(0xFFF43F5E)))
val SuccessGradient = Brush.linearGradient(listOf(Color(0xFF34D399), Color(0xFF10B981)))

/** Modul turiga qarab yumshoq gradient (kartochka belgisi uchun). */
fun accentGradientFor(type: String): Brush = when (type) {
    "discussion" -> Brush.linearGradient(listOf(Color(0xFF8B5CF6), Color(0xFF6D28D9)))
    "roleplay" -> Brush.linearGradient(listOf(Color(0xFFFB7185), Color(0xFFF43F5E)))
    "storytelling" -> Brush.linearGradient(listOf(Color(0xFF38BDF8), Color(0xFF0EA5E9)))
    "interview" -> Brush.linearGradient(listOf(Color(0xFFFBBF24), Color(0xFFF59E0B)))
    "picture_narrating" -> Brush.linearGradient(listOf(Color(0xFF34D399), Color(0xFF10B981)))
    else -> PrimaryGradient
}

// ── Yuqori panel (gradient) ─────────────────────────────────────
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
            .clip(RoundedCornerShape(bottomStart = 28.dp, bottomEnd = 28.dp))
            .background(HeroGradient)
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
                Text(
                    title,
                    style = MaterialTheme.typography.titleLarge,
                    color = Color.White,
                )
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

/**
 * Yumaloq ikonka tugmasi (gradient panel ustida).
 * Matn glifi ("←") emas, haqiqiy vektor ikonka ishlatiladi — shunda belgi
 * doira markazida aniq turadi va RTL tillarda avtomatik aylanadi.
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
            .background(Color.White.copy(alpha = 0.18f))
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

// ── Yumshoq karta ───────────────────────────────────────────────
@Composable
fun SoftCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val base = modifier
        .fillMaxWidth()
        .shadow(6.dp, MaterialTheme.shapes.large, spotColor = Violet.copy(alpha = 0.12f))
        .clip(MaterialTheme.shapes.large)
        .background(SurfaceWhite)
        .border(1.dp, OutlineSoft, MaterialTheme.shapes.large)
    val clickable = if (onClick != null) base.clickable(onClick = onClick) else base
    Column(modifier = clickable.padding(16.dp), content = content)
}

// ── Gradient tugma (asosiy CTA) ─────────────────────────────────
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
            .height(54.dp)
            .clip(CircleShape)
            .background(if (enabled) gradient else Brush.linearGradient(listOf(InkMuted, InkMuted)))
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
            if (leadingIcon != null) {
                Icon(leadingIcon, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                Spacer(Modifier.size(8.dp))
            }
            Text(text, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

/** Ikkilamchi (chiziqli) tugma. */
@Composable
fun SoftButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .height(54.dp)
            .clip(CircleShape)
            .border(1.5.dp, Violet.copy(alpha = 0.4f), CircleShape)
            .clickable(onClick = onClick)
            .padding(horizontal = 24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = Violet, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
    }
}

// ── Chip / yorliq ───────────────────────────────────────────────
@Composable
fun Pill(text: String, container: Color, content: Color) {
    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(container)
            .padding(horizontal = 12.dp, vertical = 6.dp),
    ) {
        Text(text, color = content, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
    }
}

// ── Mnemonika harf belgisi ──────────────────────────────────────
@Composable
fun MnemonicBadge(letter: String, gradient: Brush = PrimaryGradient, size: Dp = 34.dp) {
    Box(
        modifier = Modifier.size(size).clip(CircleShape).background(gradient),
        contentAlignment = Alignment.Center,
    ) {
        Text(letter, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = (size.value * 0.42f).sp)
    }
}

// ── Bo'lim sarlavhasi ───────────────────────────────────────────
@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier) {
    Row(modifier = modifier, verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier.size(width = 4.dp, height = 18.dp).clip(CircleShape).background(CoralGradient),
        )
        Spacer(Modifier.size(8.dp))
        Text(text, style = MaterialTheme.typography.titleMedium)
    }
}

// ── Ball halqasi (score ring) ───────────────────────────────────
@Composable
fun ScoreRing(
    score: Int,
    modifier: Modifier = Modifier,
    ringSize: Dp = 128.dp,
    stroke: Dp = 12.dp,
) {
    val pct = (score.coerceIn(0, 100)) / 100f
    val ringBrush = when {
        score >= 80 -> SuccessGradient
        score >= 50 -> PrimaryGradient
        else -> CoralGradient
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
                style = Stroke(width = s, cap = StrokeCap.Round),
            )
            drawArc(
                brush = ringBrush,
                startAngle = -90f, sweepAngle = 360f * pct, useCenter = false,
                topLeft = topLeft, size = arcSize,
                style = Stroke(width = s, cap = StrokeCap.Round),
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("$score", style = DisplayScore, color = InkStrong)
            Text("/ 100", style = MaterialTheme.typography.labelMedium, color = InkMuted)
        }
    }
}

// ── Mikrofon tugmasi (yozishda pulsatsiya) ──────────────────────
@Composable
fun BrandMicButton(
    recording: Boolean,
    onClick: () -> Unit,
    micIcon: ImageVector,
    stopIcon: ImageVector,
    size: Dp = 88.dp,
) {
    val transition = rememberInfiniteTransition(label = "mic")
    val scale by transition.animateFloat(
        initialValue = 1f,
        targetValue = if (recording) 1.12f else 1f,
        animationSpec = infiniteRepeatable(tween(700), RepeatMode.Reverse),
        label = "pulse",
    )
    Box(contentAlignment = Alignment.Center) {
        if (recording) {
            Box(
                Modifier
                    .size(size)
                    .graphicsLayer { scaleX = scale + 0.18f; scaleY = scale + 0.18f; alpha = 0.25f }
                    .clip(CircleShape)
                    .background(CoralGradient),
            )
        }
        Surface(
            shape = CircleShape,
            onClick = onClick,
            color = Color.Transparent,
            modifier = Modifier
                .size(size)
                .graphicsLayer { if (recording) { scaleX = scale; scaleY = scale } },
        ) {
            Box(
                Modifier.fillMaxSize().clip(CircleShape).background(if (recording) CoralGradient else PrimaryGradient),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = if (recording) stopIcon else micIcon,
                    contentDescription = if (recording) "To'xtatish" else "Gapirish",
                    tint = Color.White,
                    modifier = Modifier.size(size.value.times(0.42f).dp),
                )
            }
        }
    }
}

/** Kichik statistik plitka. */
@Composable
fun StatTile(value: String, label: String, modifier: Modifier = Modifier, accent: Color = Violet) {
    Column(
        modifier = modifier
            .clip(MaterialTheme.shapes.medium)
            .background(SurfaceWhite)
            .border(1.dp, OutlineSoft, MaterialTheme.shapes.medium)
            .padding(14.dp),
    ) {
        Text(value, style = MaterialTheme.typography.titleLarge, color = accent)
        Spacer(Modifier.size(2.dp))
        Text(label, style = MaterialTheme.typography.bodySmall, color = InkMuted)
    }
}

/** Ichki foizli chiziq (progress bar) — brend uslubida. */
@Composable
fun BrandProgressBar(progress: Float, modifier: Modifier = Modifier, brush: Brush = PrimaryGradient) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(10.dp)
            .clip(CircleShape)
            .background(SurfaceMuted),
    ) {
        Box(
            Modifier
                .fillMaxWidth(progress.coerceIn(0f, 1f))
                .height(10.dp)
                .clip(CircleShape)
                .background(brush),
        )
    }
}
