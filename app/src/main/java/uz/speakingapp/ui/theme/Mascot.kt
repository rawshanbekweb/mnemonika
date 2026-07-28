package uz.speakingapp.ui.theme

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.math.abs
import kotlin.math.sin

// ════════════════════════════════════════════════════════════════════
//  SpeakUp do'stlari — personajlar tizimi
//
//  Asosiy qahramon **Bulbul** — sayrashi bilan mashhur qush; o'zbek tilida
//  "bulbul kabi sayra" chiroyli gapirish demakdir, ya'ni ilovaning maqsadiga
//  aynan mos tushadi. Har modulning o'z do'sti bor: bir xil tana, boshqa rang
//  va bitta aksessuar. Mascot tizimlari shunday quriladi — bola hammasini bir
//  oilaga mansub deb ko'radi, kod esa bitta chizish funksiyasidan iborat
//  bo'ladi (5 ta alohida personaj chizishning o'rniga).
//
//  NEGA CANVAS, RASM EMAS: (1) APK hajmi oshmaydi — 6 personaj × bir necha
//  holat PNG bo'lganda megabaytlarga chiqardi; (2) har qanday ekran zichligida
//  aniq chiqadi; (3) offline ishlaydi; (4) kayfiyat va mikrofon darajasi
//  jonli parametr — rasm bilan buni qilib bo'lmaydi.
//
//  Barcha o'lchamlar 0f..1f ulushlarida — mascot istalgan o'lchamda chiziladi.
// ════════════════════════════════════════════════════════════════════

/** Personaj kayfiyati — ekrandagi holatga qarab tanlanadi. */
enum class MascotMood {
    /** Kutmoqda: sekin nafas oladi, goho ko'z qisadi. */
    Idle,

    /** Bolani tinglayapti: oldinga engashadi, kokili ovoz balandligiga qarab ko'tariladi. */
    Listening,

    /** Gapiryapti (TTS/audio klip): tumshug'i ochilib-yopiladi. */
    Speaking,

    /** O'ylayapti (tahlil ketyapti): bir ko'zi qisiq, tepasida nuqtalar aylanadi. */
    Thinking,

    /** Xursand: ko'zlari yoy bo'lib kuladi. */
    Happy,

    /** Bayram: sakraydi va qanot qoqadi. */
    Cheer,

    /** Dalda beradi (past ball): kokili tushgan, lekin baribir jilmayadi. */
    Encourage,
}

/** Personaj ustidagi bitta ajratuvchi belgi. */
enum class MascotGear { None, Glasses, Cap, Brush, Mask, Mic }

/**
 * Bitta personajning ko'rinishi.
 *
 * [greeting] — bolaga aytadigan qisqa gapi. Ko'p matn yozilmagan: 5–6 sinf
 * o'quvchisi uzun matnni o'qimaydi, bir jumla yetadi.
 */
data class MascotLook(
    val name: String,
    val body: Color,
    val bodyDeep: Color,
    val gear: MascotGear,
    val greeting: String,
)

/** Asosiy yo'lboshchi — bosh ekranda va profilda shu chiqadi. */
val Bulbul = MascotLook(
    name = "Bulbul",
    body = Sky,
    bodyDeep = SkyDeep,
    gear = MascotGear.None,
    greeting = "Bugun ham chiroyli gapiramizmi?",
)

/**
 * Modul turiga mos do'st. Noma'lum tur kelsa (admin yangi modul qo'shsa)
 * Bulbulning o'ziga qaytadi — kontent o'zgarsa ham ekran bo'sh qolmaydi.
 */
fun mascotFor(type: String): MascotLook = when (type) {
    "discussion" -> MascotLook(
        "Fikr", Sky, SkyDeep, MascotGear.Glasses,
        "Fikringni ayt — sababini ham tushuntir!",
    )
    "storytelling" -> MascotLook(
        "Ertak", Sunny, SunnyDeep, MascotGear.Cap,
        "Qani, hikoyangni boshladik!",
    )
    "picture_narrating" -> MascotLook(
        "Chizgi", Mint, MintDeep, MascotGear.Brush,
        "Rasmda nima ko'ryapsan? Hammasini ayt!",
    )
    "roleplay" -> MascotLook(
        "Niqob", Grape, GrapeDeep, MascotGear.Mask,
        "Bugun kim bo'lamiz? Rolga kirdik!",
    )
    "interview" -> MascotLook(
        "Savol", Coral, CoralDeep, MascotGear.Mic,
        "Savollarga to'liq javob ber!",
    )
    else -> Bulbul
}

/** Ballga qarab natija ekranidagi kayfiyat. */
fun moodForScore(score: Int): MascotMood = when {
    score >= 80 -> MascotMood.Cheer
    score >= 50 -> MascotMood.Happy
    else -> MascotMood.Encourage
}

/**
 * Personajni chizadi va jonlantiradi.
 *
 * @param level 0f..1f mikrofon darajasi — faqat [MascotMood.Listening] da
 *   ishlatiladi: kokil va tana shunga qarab "nafas oladi". Bola baland
 *   gapirsa personaj sezib turadi — bu bolani gapirishga undaydi.
 */
@Composable
fun Mascot(
    look: MascotLook,
    mood: MascotMood,
    modifier: Modifier = Modifier,
    size: Dp = 96.dp,
    level: Float = 0f,
) {
    val transition = rememberInfiniteTransition(label = "mascot")

    // Nafas olish — barcha holatlarda ishlaydi, personaj "tirik" ko'rinadi.
    val breathe by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(2200, easing = LinearEasing), RepeatMode.Restart),
        label = "breathe",
    )

    // Ko'z qisish: siklning oxirgi ~6% ida ko'z yumiladi. Alohida animatsiya
    // o'rniga bitta chiziqli hisoblagichdan foydalanamiz — arzon va tabiiy.
    val blinkPhase by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(3600, easing = LinearEasing), RepeatMode.Restart),
        label = "blink",
    )

    // Bayram sakrashi va qanot qoqishi.
    val bounce by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(620, easing = LinearEasing), RepeatMode.Restart),
        label = "bounce",
    )

    // Mikrofon darajasi to'g'ridan-to'g'ri berilsa personaj titraydi (RMS
    // juda tez o'zgaradi), shuning uchun yumshatib olamiz.
    val smoothLevel by animateFloatAsState(
        targetValue = level.coerceIn(0f, 1f),
        animationSpec = tween(140),
        label = "level",
    )

    Canvas(modifier.size(size)) {
        drawMascot(
            look = look,
            mood = mood,
            breathe = breathe,
            blinkPhase = blinkPhase,
            bounce = bounce,
            level = smoothLevel,
        )
    }
}

/**
 * Personaj + gap pufagi. Bosh ekran, modul va natija ekranlarida ishlatiladi:
 * shunchaki matn o'rniga personaj gapirsa bola o'qishga ko'proq moyil bo'ladi.
 */
@Composable
fun MascotSays(
    look: MascotLook,
    text: String,
    modifier: Modifier = Modifier,
    mood: MascotMood = MascotMood.Idle,
    mascotSize: Dp = 72.dp,
    bubbleColor: Color = SurfaceWhite,
    textColor: Color = InkStrong,
) {
    Row(modifier, verticalAlignment = Alignment.CenterVertically) {
        Mascot(look = look, mood = mood, size = mascotSize)
        Spacer(Modifier.width(10.dp))
        Box(
            Modifier
                .clip(MaterialTheme.shapes.large)
                .background(bubbleColor)
                .padding(horizontal = 14.dp, vertical = 10.dp),
        ) {
            Text(
                text,
                style = MaterialTheme.typography.bodyMedium,
                color = textColor,
            )
        }
    }
}

/** Modul do'stlari qatori — bosh ekranda "jamoa" ni ko'rsatish uchun. */
@Composable
fun MascotRow(types: List<String>, modifier: Modifier = Modifier, itemSize: Dp = 44.dp) {
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
        types.forEach { type ->
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Mascot(look = mascotFor(type), mood = MascotMood.Idle, size = itemSize)
            }
        }
    }
}

// ── Chizish ─────────────────────────────────────────────────────────
// Hamma koordinata 0f..1f ulushida: `x(0.5f)` — markaz. Shu tufayli
// personaj 40dp da ham, 160dp da ham bir xil proporsiyada chiqadi.

private fun DrawScope.drawMascot(
    look: MascotLook,
    mood: MascotMood,
    breathe: Float,
    blinkPhase: Float,
    bounce: Float,
    level: Float,
) {
    val w = size.width
    val h = size.height
    fun x(f: Float) = w * f
    fun y(f: Float) = h * f
    fun r(f: Float) = w * f

    // sin(2π·t) — 0 dan boshlanib qaytadigan silliq to'lqin.
    val wave = sin(breathe * 2f * Math.PI.toFloat())
    val bounceWave = abs(sin(bounce * Math.PI.toFloat()))

    val cheering = mood == MascotMood.Cheer
    val listening = mood == MascotMood.Listening

    // Bayramda sakraydi; tinglayotganda ovoz balandligidan "shishadi".
    val hop = if (cheering) -bounceWave * 0.05f else 0f
    val puff = 1f + wave * 0.018f + if (listening) level * 0.06f else 0f

    // Butun personajni bitta markazdan kattalashtiramiz — qismlarni alohida
    // hisoblashdan ko'ra shunday qilgan tabiiyroq chiqadi.
    scale(scaleX = puff, scaleY = puff, pivot = Offset(x(0.5f), y(0.95f))) {
        translateY(y(hop)) {
            drawBody(look, mood, this, ::x, ::y, ::r, wave, bounceWave, cheering)
            drawFace(look, mood, this, ::x, ::y, ::r, blinkPhase, wave, level, listening)
            drawGear(look, this, ::x, ::y, ::r)
        }
    }
}

/** Kichik yordamchi: DrawScope'ni vertikal siljitadi. */
private inline fun DrawScope.translateY(dy: Float, block: DrawScope.() -> Unit) {
    drawContext.transform.translate(0f, dy)
    block()
    drawContext.transform.translate(0f, -dy)
}

private fun drawBody(
    look: MascotLook,
    mood: MascotMood,
    scope: DrawScope,
    x: (Float) -> Float,
    y: (Float) -> Float,
    r: (Float) -> Float,
    wave: Float,
    bounceWave: Float,
    cheering: Boolean,
) = with(scope) {
    // Oyoqlar — tana ostidan chiqib turadi, shuning uchun avval chiziladi.
    listOf(0.40f, 0.60f).forEach { fx ->
        drawLine(
            color = Sunny,
            start = Offset(x(fx), y(0.86f)),
            end = Offset(x(fx), y(0.985f)),
            strokeWidth = r(0.05f),
            cap = StrokeCap.Round,
        )
    }

    // Dumaloq tana.
    drawOval(
        color = look.body,
        topLeft = Offset(x(0.24f), y(0.51f)),
        size = Size(r(0.52f), r(0.42f)),
    )
    // Bosh — tana bilan qo'shilib ketadi (bir xil rang, chegara ko'rinmaydi).
    drawCircle(color = look.body, radius = r(0.27f), center = Offset(x(0.5f), y(0.40f)))

    // Qorin — ochroq dog', hajm hissi beradi.
    drawOval(
        color = Color.White.copy(alpha = 0.55f),
        topLeft = Offset(x(0.35f), y(0.60f)),
        size = Size(r(0.30f), r(0.28f)),
    )

    // Qanotlar. Bayramda yuqoriga ko'tariladi — shodlik shu bilan ko'rinadi.
    val wingLift = if (cheering) bounceWave * 26f else wave * 4f
    listOf(-1f to 0.22f, 1f to 0.78f).forEach { (dir, fx) ->
        rotate(degrees = dir * wingLift, pivot = Offset(x(fx), y(0.62f))) {
            drawOval(
                color = look.bodyDeep,
                topLeft = Offset(x(fx) - r(0.075f), y(0.60f)),
                size = Size(r(0.15f), r(0.26f)),
            )
        }
    }

    // Kokil: uchta patcha. Tinglayotganda ovozga qarab ko'tariladi
    // (drawFace ichida emas, shu yerda — bosh bilan birga turadi).
    val crestLift = when (mood) {
        MascotMood.Encourage -> -0.012f
        else -> 0f
    }
    listOf(0.42f to 0.85f, 0.5f to 1f, 0.58f to 0.85f).forEach { (fx, scaleF) ->
        val top = y(0.14f + crestLift) - r(0.10f * scaleF)
        drawOval(
            color = look.bodyDeep,
            topLeft = Offset(x(fx) - r(0.035f), top),
            size = Size(r(0.07f), r(0.13f * scaleF)),
        )
    }
}

private fun drawFace(
    look: MascotLook,
    mood: MascotMood,
    scope: DrawScope,
    x: (Float) -> Float,
    y: (Float) -> Float,
    r: (Float) -> Float,
    blinkPhase: Float,
    wave: Float,
    level: Float,
    listening: Boolean,
) = with(scope) {
    val eyeY = y(0.36f)
    val eyeR = r(0.075f)
    val smiling = mood == MascotMood.Happy || mood == MascotMood.Cheer
    // Ko'z qisish faqat tinch holatlarda — kulayotganda ko'z allaqachon yoy.
    val blinking = !smiling && blinkPhase > 0.94f

    listOf(0.385f, 0.615f).forEachIndexed { i, fx ->
        val cx = x(fx)
        when {
            smiling -> {
                // Kulgan ko'z: yuqoriga qaragan yoy.
                drawArc(
                    color = InkStrong,
                    startAngle = 200f,
                    sweepAngle = 140f,
                    useCenter = false,
                    topLeft = Offset(cx - eyeR, eyeY - eyeR * 0.8f),
                    size = Size(eyeR * 2, eyeR * 1.6f),
                    style = Stroke(width = r(0.028f), cap = StrokeCap.Round),
                )
            }
            blinking -> {
                drawLine(
                    color = InkStrong,
                    start = Offset(cx - eyeR * 0.8f, eyeY),
                    end = Offset(cx + eyeR * 0.8f, eyeY),
                    strokeWidth = r(0.026f),
                    cap = StrokeCap.Round,
                )
            }
            else -> {
                // O'ylayotganda chap ko'z qisiladi — "hmm" ifodasi.
                val squint = mood == MascotMood.Thinking && i == 0
                val rx = if (squint) eyeR * 0.9f else eyeR
                val ry = if (squint) eyeR * 0.45f else eyeR
                drawOval(
                    color = Color.White,
                    topLeft = Offset(cx - rx, eyeY - ry),
                    size = Size(rx * 2, ry * 2),
                )
                // Qorachiq: tinglayotganda ovozga qarab biroz pastga qaraydi.
                val pupilDy = if (listening) level * eyeR * 0.25f else 0f
                drawCircle(
                    color = InkStrong,
                    radius = if (squint) ry * 0.75f else eyeR * 0.55f,
                    center = Offset(cx, eyeY + pupilDy),
                )
                drawCircle(
                    color = Color.White,
                    radius = eyeR * 0.20f,
                    center = Offset(cx + eyeR * 0.22f, eyeY - eyeR * 0.28f),
                )
            }
        }
    }

    // Yonoqlar — iliqlik qo'shadi.
    // Rang ATAYLAB shaffof emas: shaffof marjon ko'k yoki binafsha tana
    // ustiga tushganda loyqa kulrang dog' beradi. Qattiq pushti esa har
    // qanday tana rangida toza ko'rinadi (marjon personajda esa deyarli
    // bilinmaydi — bu ham to'g'ri, u yerda yonoq kerak emas).
    listOf(0.28f, 0.72f).forEach { fx ->
        drawCircle(
            color = CheekPink,
            radius = r(0.055f),
            center = Offset(x(fx), y(0.47f)),
        )
    }

    // Tumshuq. Gapirayotganda va bayramda ochiladi; tinglayotganda ovoz
    // balandligiga qarab bir oz ochiladi — go'yo birga takrorlayotgandek.
    val open = when (mood) {
        MascotMood.Speaking -> 0.5f + 0.5f * wave
        MascotMood.Cheer -> 0.7f
        MascotMood.Listening -> level * 0.45f
        else -> 0f
    }
    val beakTop = y(0.45f)
    val half = r(0.055f)
    val gap = r(0.03f) * open

    // Yuqori qism.
    drawPath(
        path = Path().apply {
            moveTo(x(0.5f) - half, beakTop)
            lineTo(x(0.5f) + half, beakTop)
            lineTo(x(0.5f), beakTop + r(0.055f) - gap)
            close()
        },
        color = Sunny,
    )
    if (open > 0.02f) {
        // Ochilganda pastki jag' ham ko'rinadi — og'iz ichi to'q rangda.
        drawPath(
            path = Path().apply {
                moveTo(x(0.5f) - half * 0.8f, beakTop + r(0.055f) - gap + r(0.012f))
                lineTo(x(0.5f) + half * 0.8f, beakTop + r(0.055f) - gap + r(0.012f))
                lineTo(x(0.5f), beakTop + r(0.055f) + gap * 1.6f)
                close()
            },
            color = SunnyDeep,
        )
    }

    // O'ylayotganda bosh tepasida nuqtalar — kutish belgisidek.
    if (mood == MascotMood.Thinking) {
        listOf(0.0f, 0.33f, 0.66f).forEachIndexed { i, phase ->
            val t = ((blinkPhase + phase) % 1f)
            drawCircle(
                color = look.bodyDeep.copy(alpha = 0.25f + 0.75f * (1f - abs(t * 2f - 1f))),
                radius = r(0.026f),
                center = Offset(x(0.72f + i * 0.09f), y(0.16f)),
            )
        }
    }
}

/** Modulni ajratib turadigan yagona belgi. */
private fun drawGear(
    look: MascotLook,
    scope: DrawScope,
    x: (Float) -> Float,
    y: (Float) -> Float,
    r: (Float) -> Float,
) = with(scope) {
    when (look.gear) {
        MascotGear.None -> Unit

        // Ko'zoynak — munozara: o'ylab, dalil bilan gapiradigan personaj.
        MascotGear.Glasses -> {
            val stroke = r(0.024f)
            listOf(0.385f, 0.615f).forEach { fx ->
                drawCircle(
                    color = InkStrong,
                    radius = r(0.098f),
                    center = Offset(x(fx), y(0.36f)),
                    style = Stroke(width = stroke),
                )
            }
            drawLine(
                color = InkStrong,
                start = Offset(x(0.483f), y(0.36f)),
                end = Offset(x(0.517f), y(0.36f)),
                strokeWidth = stroke,
            )
        }

        // Uchli qalpoq — ertakchi. Uchi va popugi tuvalga to'liq sig'ishi
        // kerak: Canvas chegaradan tashqarini kesib tashlaydi.
        MascotGear.Cap -> {
            drawPath(
                path = Path().apply {
                    moveTo(x(0.30f), y(0.22f))
                    lineTo(x(0.66f), y(0.22f))
                    lineTo(x(0.40f), y(0.06f))
                    close()
                },
                color = CoralDeep,
            )
            drawCircle(color = Sunny, radius = r(0.045f), center = Offset(x(0.40f), y(0.05f)))
        }

        // Mo'yqalam — rasmli hikoya.
        MascotGear.Brush -> {
            drawLine(
                color = InkStrong.copy(alpha = 0.75f),
                start = Offset(x(0.78f), y(0.86f)),
                end = Offset(x(0.90f), y(0.56f)),
                strokeWidth = r(0.038f),
                cap = StrokeCap.Round,
            )
            drawCircle(color = CoralDeep, radius = r(0.055f), center = Offset(x(0.915f), y(0.51f)))
        }

        // Ko'z niqobi — rolli o'yin. Ko'zlar ustidan tasma o'tadi, ko'z
        // teshiklari ochiq qoladi (ko'zlar bundan oldin chizilgan).
        // Rang tana rangidan olinmaydi: binafsha niqob binafsha tanada
        // ko'rinmay qolardi. To'q siyoh rangi hamma tanada ajralib turadi.
        MascotGear.Mask -> {
            val stroke = r(0.105f)
            drawLine(
                color = InkStrong,
                start = Offset(x(0.30f), y(0.34f)),
                end = Offset(x(0.70f), y(0.34f)),
                strokeWidth = stroke,
                cap = StrokeCap.Round,
            )
            // Ko'zlarni qayta chizamiz — niqob ustidan ko'rinsin.
            listOf(0.385f, 0.615f).forEach { fx ->
                drawOval(
                    color = Color.White,
                    topLeft = Offset(x(fx) - r(0.062f), y(0.34f) - r(0.045f)),
                    size = Size(r(0.124f), r(0.09f)),
                )
                drawCircle(color = InkStrong, radius = r(0.035f), center = Offset(x(fx), y(0.34f)))
            }
        }

        // Mikrofon — intervyu.
        MascotGear.Mic -> {
            drawLine(
                color = InkStrong.copy(alpha = 0.7f),
                start = Offset(x(0.87f), y(0.82f)),
                end = Offset(x(0.87f), y(0.62f)),
                strokeWidth = r(0.032f),
                cap = StrokeCap.Round,
            )
            drawOval(
                color = InkStrong,
                topLeft = Offset(x(0.80f), y(0.46f)),
                size = Size(r(0.14f), r(0.19f)),
            )
            drawCircle(
                color = Color.White.copy(alpha = 0.35f),
                radius = r(0.028f),
                center = Offset(x(0.855f), y(0.53f)),
            )
        }
    }
}
