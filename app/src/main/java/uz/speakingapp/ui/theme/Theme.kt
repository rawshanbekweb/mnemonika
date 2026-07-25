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
    primary = Navy,
    onPrimary = Color.White,
    primaryContainer = NavyContainer,
    onPrimaryContainer = OnNavyContainer,
    secondary = Gold,
    onSecondary = Color.White,
    secondaryContainer = GoldContainer,
    onSecondaryContainer = OnGoldContainer,
    tertiary = NavyLight,
    onTertiary = Color.White,
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

/** Akademik uslub: burchaklar deyarli tekis. */
private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(3.dp),
    small = RoundedCornerShape(4.dp),
    medium = RoundedCornerShape(4.dp),
    large = RoundedCornerShape(6.dp),
    extraLarge = RoundedCornerShape(8.dp),
)

/**
 * Tipografika ierarxiya orqali ishlaydi, rang va gradient orqali emas:
 * sarlavhalar zich va qat'iy, kichik yorliqlar katta harfda va kengaytirilgan.
 */
private val AppTypography = Typography().run {
    copy(
        headlineLarge = headlineLarge.copy(fontWeight = FontWeight.Bold, letterSpacing = (-0.4).sp),
        headlineMedium = headlineMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = (-0.4).sp),
        headlineSmall = headlineSmall.copy(fontWeight = FontWeight.SemiBold),
        titleLarge = titleLarge.copy(fontWeight = FontWeight.SemiBold),
        titleMedium = titleMedium.copy(fontWeight = FontWeight.SemiBold),
        titleSmall = titleSmall.copy(fontWeight = FontWeight.Medium),
        labelLarge = labelLarge.copy(fontWeight = FontWeight.Medium),
        bodyLarge = bodyLarge.copy(lineHeight = 24.sp),
    )
}

/** Bo'lim yorlig'i: KICHIK, KATTA HARFDA, kengaytirilgan — hujjat uslubi. */
val OverlineLabel = TextStyle(
    fontWeight = FontWeight.SemiBold,
    fontSize = 11.sp,
    letterSpacing = 1.2.sp,
)

/** Ball ko'rsatkichi (ScoreRing markazida). */
val DisplayScore = TextStyle(fontWeight = FontWeight.Bold, fontSize = 38.sp, letterSpacing = (-1).sp)

/** Modul tartib raqami (01, 02 …). */
val ModuleNumber = TextStyle(
    fontWeight = FontWeight.Bold,
    fontSize = 15.sp,
    letterSpacing = 0.5.sp,
)

@Composable
fun SpeakUpTheme(
    // Doim yorug' tema — bosma hujjatga o'xshash izchil ko'rinish uchun.
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = LightColors,
        shapes = AppShapes,
        typography = AppTypography,
        content = content,
    )
}
