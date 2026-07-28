package uz.speakingapp.ui.theme

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.drawscope.rotate
import kotlin.math.sin
import kotlin.random.Random

// ════════════════════════════════════════════════════════════════════
//  Harakat tizimi
//
//  Bolalar ilovasida animatsiya bezak emas — u nima bo'layotganini
//  tushuntiradi (tugma bosildi, ball hisoblandi, nishon ochildi).
//
//  MUHIM CHEKLOV: yozuv paytida Vosk protsessorni qattiq band qiladi
//  (125MB model, real vaqtda dekodlash). Shuning uchun o'sha ekranda
//  faqat zarur animatsiyalar qoladi va ular arzon bo'lishi kerak —
//  graphicsLayer (GPU) orqali, layout'ni qayta hisoblamasdan.
// ════════════════════════════════════════════════════════════════════

/**
 * Bosilganda "cho'kadigan" element. Bolalar uchun bu muhim: tugma
 * bosilganini ko'rish kutish hissini kamaytiradi.
 *
 * Material'ning standart to'lqinli effekti o'chirilgan — yumshoq
 * kichrayish yorqin kartalarda tabiiyroq ko'rinadi.
 */
fun Modifier.bouncyClick(
    enabled: Boolean = true,
    pressedScale: Float = 0.96f,
    onClick: () -> Unit,
): Modifier = composed {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed && enabled) pressedScale else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "press",
    )
    this
        .graphicsLayer { scaleX = scale; scaleY = scale }
        .clickable(
            interactionSource = interaction,
            indication = null,
            enabled = enabled,
            onClick = onClick,
        )
}

/**
 * Ekranga ketma-ket chiqadigan element (pastdan suzib, kattalashib).
 *
 * [index] ro'yxatdagi o'rni — har element oldingisidan biroz keyin
 * chiqadi, shunda ro'yxat "quyilib" tushadi. Kechikish cheklangan:
 * uzun ro'yxatda oxirgi element bir soniyadan ko'p kutmasin.
 */
@Composable
fun PopIn(
    index: Int = 0,
    stepMillis: Int = 55,
    maxDelayMillis: Int = 400,
    content: @Composable () -> Unit,
) {
    var shown by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { shown = true }
    AnimatedVisibility(
        visible = shown,
        enter = fadeIn(tween(260, delayMillis = (index * stepMillis).coerceAtMost(maxDelayMillis))) +
            slideInVertically(
                animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy),
                initialOffsetY = { it / 4 },
            ) +
            scaleIn(
                animationSpec = tween(260, delayMillis = (index * stepMillis).coerceAtMost(maxDelayMillis)),
                initialScale = 0.92f,
            ),
    ) {
        content()
    }
}

/**
 * Raqamni nolga emas, joriy qiymatdan maqsadgacha sanaydi.
 * Natija ekranida ball "yig'ilib" chiqadi — kutilgan zavq shu yerda.
 */
@Composable
fun animatedNumber(target: Int, durationMillis: Int = 900): Int {
    var start by remember { mutableStateOf(false) }
    LaunchedEffect(target) { start = true }
    val value by animateIntAsState(
        targetValue = if (start) target else 0,
        animationSpec = tween(durationMillis),
        label = "number",
    )
    return value
}

/** Diqqatni tortadigan yengil chayqalish (masalan, yangi nishon). */
fun Modifier.wiggle(active: Boolean = true, degrees: Float = 3f): Modifier = composed {
    if (!active) return@composed this
    val transition = rememberInfiniteTransition(label = "wiggle")
    val t by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1800, easing = LinearEasing), RepeatMode.Restart),
        label = "wiggleT",
    )
    // Har siklda faqat qisqa vaqt chayqaladi, qolganida tinch turadi —
    // to'xtovsiz harakat charchatadi.
    val burst = if (t < 0.25f) sin(t * 4f * 4f * Math.PI.toFloat()) else 0f
    this.graphicsLayer { rotationZ = burst * degrees }
}

private data class Confetto(
    val x: Float,
    val delay: Float,
    val speed: Float,
    val drift: Float,
    val color: Color,
    val size: Float,
    val spin: Float,
)

/**
 * Bayram konfettisi — yuqori ball yoki yangi nishon uchun.
 *
 * Bir marta tushadi va tugaydi (cheksiz emas): takrorlanadigan bayram
 * qiymatini yo'qotadi va bekorga batareya yeydi. Zarrachalar `remember`
 * bilan bir marta yaratiladi, animatsiya esa bitta progress qiymatidan
 * yuritiladi — 40 ta zarra uchun bitta Canvas qayta chiziladi.
 */
@Composable
fun Confetti(
    active: Boolean,
    modifier: Modifier = Modifier,
    pieces: Int = 40,
    durationMillis: Int = 2600,
) {
    if (!active) return

    val palette = listOf(Sky, Sunny, Coral, Mint, Grape, SkyDeep)
    val confetti = remember {
        val rnd = Random(1234) // Barqaror urug': har kompozitsiyada bir xil naqsh.
        List(pieces) {
            Confetto(
                x = rnd.nextFloat(),
                delay = rnd.nextFloat() * 0.35f,
                speed = 0.75f + rnd.nextFloat() * 0.5f,
                drift = (rnd.nextFloat() - 0.5f) * 0.25f,
                color = palette[rnd.nextInt(palette.size)],
                size = 0.012f + rnd.nextFloat() * 0.014f,
                spin = (rnd.nextFloat() - 0.5f) * 900f,
            )
        }
    }

    val progress = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        progress.animateTo(1f, tween(durationMillis, easing = LinearEasing))
    }

    Box(modifier.fillMaxSize()) {
        Canvas(Modifier.fillMaxSize()) {
            val p = progress.value
            confetti.forEach { c ->
                val t = ((p - c.delay) * c.speed).coerceIn(0f, 1f)
                if (t <= 0f) return@forEach
                val cx = (c.x + c.drift * t) * size.width
                val cy = (t * 1.15f - 0.1f) * size.height
                val side = c.size * size.width
                // Oxiriga borib so'nadi — birdan yo'qolib qolmasin.
                val alpha = (1f - t).coerceIn(0f, 1f).let { if (it > 0.4f) 1f else it / 0.4f }
                rotate(degrees = c.spin * t, pivot = Offset(cx, cy)) {
                    drawRect(
                        color = c.color.copy(alpha = alpha),
                        topLeft = Offset(cx - side / 2, cy - side / 2),
                        size = Size(side, side * 1.6f),
                    )
                }
            }
        }
    }
}
