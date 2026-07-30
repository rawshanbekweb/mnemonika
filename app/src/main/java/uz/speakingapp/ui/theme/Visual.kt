package uz.speakingapp.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

/**
 * Mashqning vizual ishorasi. Web'dagi `Visual.tsx` bilan bir xil mantiq —
 * IKKALASI DOIM BIRGA O'ZGARTIRILADI.
 *
 * [token] — emoji (yoki eski kontentda to'g'ridan-to'g'ri rasm URL'i).
 * [imageUrl] — `visualImages` dan kelgan fotosurat; bo'sh bo'lishi mumkin.
 *
 * ZAXIRA SHART: tasvir BEZAK emas, mashqning mazmuni — bola aynan shu narsa
 * haqida gapiradi. Ilova esa internetsiz ishlashi kerak, ya'ni rasm ko'pincha
 * YUKLANMAYDI. Shunday holatda bola bo'sh kulrang kvadratni emas, emojini
 * ko'radi ([onError] → [failed]).
 *
 * Coil rasmni diskka keshlaydi, shuning uchun bir marta ko'rilgan rasm keyin
 * internetsiz ham chiqadi.
 */
@Composable
fun VisualTile(
    token: String,
    imageUrl: String = "",
    modifier: Modifier = Modifier,
    size: Dp = 88.dp,
) {
    // Eski kontentda URL to'g'ridan-to'g'ri `visuals` ichida bo'lishi mumkin.
    val tokenIsUrl = token.startsWith("http://") || token.startsWith("https://")
    val src = if (imageUrl.isNotEmpty()) imageUrl else if (tokenIsUrl) token else ""

    // `src` o'zgarsa qaytadan urinib ko'rish kerak — shuning uchun kalit sifatida.
    var failed by remember(src) { mutableStateOf(false) }

    Box(
        modifier = modifier
            .size(size)
            .clip(MaterialTheme.shapes.small)
            .background(SurfaceMuted)
            .border(1.dp, OutlineSoft, MaterialTheme.shapes.small),
        contentAlignment = Alignment.Center,
    ) {
        if (src.isNotEmpty() && !failed) {
            AsyncImage(
                model = src,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                onError = { failed = true },
                modifier = Modifier.fillMaxSize().clip(MaterialTheme.shapes.small),
            )
        } else {
            Text(
                if (tokenIsUrl) "🖼️" else token,
                fontSize = (size.value * 0.42f).sp,
            )
        }
    }
}

/** Kichik ro'yxat elementi uchun ixcham variant. */
@Composable
fun VisualThumb(token: String, imageUrl: String = "", size: Dp = 44.dp) =
    VisualTile(token = token, imageUrl = imageUrl, size = size)
