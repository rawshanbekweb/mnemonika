package uz.speakingapp.ui.profile

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.speakingapp.data.StudentProfile
import uz.speakingapp.ui.theme.BrandTopBar
import uz.speakingapp.ui.theme.GradientButton
import uz.speakingapp.ui.theme.HairLine
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.Navy
import uz.speakingapp.ui.theme.NavyContainer
import uz.speakingapp.ui.theme.OnNavyContainer
import uz.speakingapp.ui.theme.OutlineSoft
import uz.speakingapp.ui.theme.OverlineLabel
import uz.speakingapp.ui.theme.SectionTitle
import uz.speakingapp.ui.theme.SoftCard

private val CLASS_SUGGESTIONS = listOf("5-A", "5-B", "5-V", "6-A", "6-B", "6-V")

/**
 * Ro'yxatdan o'tish / profilni tahrirlash.
 *
 * [firstTime] = true bo'lsa ilova birinchi ochilishidagi tanishuv ekrani
 * ko'rinadi (orqaga tugmasi yo'q), aks holda oddiy tahrirlash ekrani.
 */
@Composable
fun ProfileScreen(
    profile: StudentProfile,
    firstTime: Boolean,
    onSave: (name: String, classGroup: String) -> Unit,
    onBack: (() -> Unit)? = null,
) {
    var name by remember { mutableStateOf(profile.name) }
    var classGroup by remember { mutableStateOf(profile.classGroup) }
    val canSave = name.trim().length >= 2

    Column(Modifier.fillMaxSize()) {
        if (firstTime) {
            WelcomeHeader()
        } else {
            BrandTopBar(title = "Profil", subtitle = "Ism va sinfni o'zgartirish", onBack = onBack)
        }
        HairLine()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            SoftCard {
                SectionTitle("Ism-familiya")
                Spacer(Modifier.size(10.dp))
                BrandTextField(
                    value = name,
                    onValueChange = { if (it.length <= 60) name = it },
                    placeholder = "Masalan: Ali Valiyev",
                    imeAction = ImeAction.Next,
                )
                Spacer(Modifier.size(8.dp))
                Text(
                    "Natijalaringiz shu ism bilan o'qituvchingizga ko'rinadi.",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
            }

            SoftCard {
                SectionTitle("Sinf")
                Spacer(Modifier.size(10.dp))
                BrandTextField(
                    value = classGroup,
                    onValueChange = { if (it.length <= 24) classGroup = it },
                    placeholder = "Masalan: 5-A",
                    imeAction = ImeAction.Done,
                )
                Spacer(Modifier.size(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CLASS_SUGGESTIONS.take(3).forEach { s ->
                        ChoicePill(s, selected = classGroup == s) { classGroup = s }
                    }
                }
                Spacer(Modifier.size(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    CLASS_SUGGESTIONS.drop(3).forEach { s ->
                        ChoicePill(s, selected = classGroup == s) { classGroup = s }
                    }
                }
                Spacer(Modifier.size(8.dp))
                Text(
                    "Ixtiyoriy — o'qituvchi sinflar bo'yicha ajratib ko'rishi uchun.",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
            }

            GradientButton(
                text = if (firstTime) "Boshlash" else "Saqlash",
                onClick = { onSave(name.trim(), classGroup.trim()) },
                enabled = canSave,
                modifier = Modifier.fillMaxWidth(),
            )
            if (!canSave) {
                Text(
                    "Davom etish uchun ismingizni kiriting.",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            Spacer(Modifier.size(8.dp))
        }
    }
}

@Composable
private fun WelcomeHeader() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Navy)
            .padding(horizontal = 16.dp, vertical = 28.dp),
    ) {
        Text(
            "SPEAKUP",
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 26.sp,
            letterSpacing = 2.sp,
        )
        Spacer(Modifier.size(6.dp))
        Text(
            "Ingliz tili nutq ko'nikmalari platformasi",
            color = Color.White.copy(alpha = 0.75f),
            style = MaterialTheme.typography.bodyMedium,
        )
        Spacer(Modifier.size(20.dp))
        Text(
            "Boshlashdan oldin o'zingiz haqingizda qisqacha ma'lumot kiriting.",
            color = Color.White.copy(alpha = 0.9f),
            style = MaterialTheme.typography.bodyLarge,
        )
    }
}

@Composable
private fun BrandTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    imeAction: ImeAction,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder, color = InkMuted) },
        singleLine = true,
        shape = MaterialTheme.shapes.small,
        textStyle = MaterialTheme.typography.bodyLarge,
        keyboardOptions = KeyboardOptions(
            capitalization = KeyboardCapitalization.Words,
            imeAction = imeAction,
        ),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Navy,
            unfocusedBorderColor = OutlineSoft,
            cursorColor = Navy,
        ),
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun ChoicePill(text: String, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(MaterialTheme.shapes.extraSmall)
            .background(if (selected) Navy else NavyContainer)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text,
            color = if (selected) Color.White else OnNavyContainer,
            style = OverlineLabel,
        )
    }
}
