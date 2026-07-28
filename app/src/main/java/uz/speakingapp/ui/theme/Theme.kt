package uz.speakingapp.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val LightColors = lightColorScheme(
    primary = Sky,
    onPrimary = Color.White,
    primaryContainer = SkyContainer,
    onPrimaryContainer = OnSkyContainer,
    secondary = Sunny,
    onSecondary = Color.White,
    secondaryContainer = SunnyContainer,
    onSecondaryContainer = OnSunnyContainer,
    tertiary = Grape,
    onTertiary = Color.White,
    tertiaryContainer = GrapeContainer,
    onTertiaryContainer = OnGrapeContainer,
    background = AppBackground,
    onBackground = InkStrong,
    surface = SurfaceWhite,
    onSurface = InkStrong,
    surfaceVariant = SurfaceMuted,
    onSurfaceVariant = InkMuted,
    outline = OutlineSoft,
    outlineVariant = OutlineSoft,
    error = Danger,
    onError = Color.White,
)

/**
 * Yumaloq burchaklar — bolalar ilovasi uchun asosiy shakl belgisi.
 * O'tkir burchak "hujjat", yumaloq burchak "o'yinchoq" degan taassurot beradi.
 */
private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(10.dp),
    small = RoundedCornerShape(16.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(32.dp),
)

/**
 * Tipografika: yirikroq va qalinroq. 5–6 sinf o'quvchisi ekranga uzoqroqdan
 * va shoshib qaraydi, shuning uchun asosiy matn 16sp dan kichik bo'lmaydi.
 */
private val AppTypography = Typography().run {
    copy(
        headlineLarge = headlineLarge.copy(fontWeight = FontWeight.ExtraBold, letterSpacing = (-0.5).sp),
        headlineMedium = headlineMedium.copy(fontWeight = FontWeight.ExtraBold, letterSpacing = (-0.4).sp),
        headlineSmall = headlineSmall.copy(fontWeight = FontWeight.Bold),
        titleLarge = titleLarge.copy(fontWeight = FontWeight.Bold),
        titleMedium = titleMedium.copy(fontWeight = FontWeight.Bold),
        titleSmall = titleSmall.copy(fontWeight = FontWeight.SemiBold),
        labelLarge = labelLarge.copy(fontWeight = FontWeight.SemiBold),
        bodyLarge = bodyLarge.copy(fontSize = 16.sp, lineHeight = 25.sp),
        bodyMedium = bodyMedium.copy(fontSize = 15.sp, lineHeight = 22.sp),
    )
}

/**
 * Bo'lim yorlig'i. Akademik versiyada bu juda kichik va katta harfli edi;
 * endi biroz yirikroq va yumshoqroq — bola o'qiy olishi kerak.
 */
val OverlineLabel = TextStyle(
    fontWeight = FontWeight.Bold,
    fontSize = 12.sp,
    letterSpacing = 0.8.sp,
)

/** Ball ko'rsatkichi (ScoreRing markazida). */
val DisplayScore = TextStyle(fontWeight = FontWeight.ExtraBold, fontSize = 42.sp, letterSpacing = (-1.5).sp)

/** Modul tartib raqami (01, 02 …). */
val ModuleNumber = TextStyle(
    fontWeight = FontWeight.ExtraBold,
    fontSize = 16.sp,
    letterSpacing = 0.5.sp,
)

@Composable
fun SpeakUpTheme(
    // Doim yorug' tema: bolalar ilovasi, qorong'i rejim kerak emas.
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = LightColors,
        shapes = AppShapes,
        typography = AppTypography,
        content = content,
    )
}
