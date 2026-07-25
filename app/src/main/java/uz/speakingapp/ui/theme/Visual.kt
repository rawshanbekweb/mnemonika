package uz.speakingapp.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

/**
 * Mashqning vizual ishorasi.
 *
 * Kontentdagi `visuals` maydoni ikki xil bo'lishi mumkin:
 *  - rasm URL'i (`https://…`) — admin panelidagi media kutubxonasidan;
 *  - emoji tokeni — kontentning boshlang'ich ko'rinishi.
 *
 * Emoji BEZAK emas, mashqning mazmuni: bola aynan shu tasvir haqida gapiradi.
 * Shuning uchun u olib tashlanmadi, balki bosiq ramkaga solindi. Rasm URL'i
 * qo'yilgan zahoti o'sha joyda haqiqiy rasm chiqadi.
 */
@Composable
fun VisualTile(
    token: String,
    modifier: Modifier = Modifier,
    size: Dp = 88.dp,
) {
    val isUrl = token.startsWith("http://") || token.startsWith("https://")

    Box(
        modifier = modifier
            .size(size)
            .clip(MaterialTheme.shapes.small)
            .background(SurfaceMuted)
            .border(1.dp, OutlineSoft, MaterialTheme.shapes.small),
        contentAlignment = Alignment.Center,
    ) {
        if (isUrl) {
            AsyncImage(
                model = token,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize().clip(MaterialTheme.shapes.small),
            )
        } else {
            Text(token, fontSize = (size.value * 0.42f).sp)
        }
    }
}

/** Kichik ro'yxat elementi uchun ixcham variant. */
@Composable
fun VisualThumb(token: String, size: Dp = 44.dp) = VisualTile(token = token, size = size)
