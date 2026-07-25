package uz.speakingapp.ui.profile

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import uz.speakingapp.ui.theme.HeroGradient
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.OnVioletContainer
import uz.speakingapp.ui.theme.OutlineSoft
import uz.speakingapp.ui.theme.SoftCard
import uz.speakingapp.ui.theme.Violet
import uz.speakingapp.ui.theme.VioletContainer

private val CLASS_SUGGESTIONS = listOf("5-A", "5-B", "5-V", "6-A", "6-B", "6-V")

/**
 * Ro'yxatdan o'tish / profilni tahrirlash.
 *
 * [firstTime] = true bo'lsa ilova birinchi ochilishidagi tanishuv ekrani ko'rinadi
 * (orqaga tugmasi yo'q), aks holda oddiy tahrirlash ekrani.
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
        if (firstTime) WelcomeHeader() else {
            BrandTopBar(title = "Mening profilim", subtitle = "Ism va sinfni o'zgartirish", onBack = onBack)
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            SoftCard {
                Text("Isming nima?", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.size(4.dp))
                Text(
                    "Natijalaring shu ism bilan o'qituvchingga ko'rinadi.",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
                Spacer(Modifier.size(12.dp))
                BrandTextField(
                    value = name,
                    onValueChange = { if (it.length <= 60) name = it },
                    placeholder = "Masalan: Ali Valiyev",
                    imeAction = ImeAction.Next,
                )
            }

            SoftCard {
                Text("Sinfing qaysi?", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.size(4.dp))
                Text(
                    "Ixtiyoriy — o'qituvchi sinflar bo'yicha ajratib ko'rishi uchun.",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
                Spacer(Modifier.size(12.dp))
                BrandTextField(
                    value = classGroup,
                    onValueChange = { if (it.length <= 24) classGroup = it },
                    placeholder = "Masalan: 5-A",
                    imeAction = ImeAction.Done,
                )
                Spacer(Modifier.size(10.dp))
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
            }

            GradientButton(
                text = if (firstTime) "Boshladik! 🚀" else "Saqlash",
                onClick = { onSave(name.trim(), classGroup.trim()) },
                enabled = canSave,
                modifier = Modifier.fillMaxWidth(),
            )
            if (!canSave) {
                Text(
                    "Davom etish uchun ismingni yoz.",
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
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
            .background(HeroGradient)
            .padding(24.dp),
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("🎙️", fontSize = 34.sp)
                Spacer(Modifier.size(10.dp))
                Text("SpeakUp", color = Color.White, style = MaterialTheme.typography.headlineMedium)
            }
            Spacer(Modifier.size(8.dp))
            Text(
                "Xush kelibsan! Keling, avval tanishib olamiz.",
                color = Color.White.copy(alpha = 0.92f),
                style = MaterialTheme.typography.bodyLarge,
            )
        }
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
            focusedBorderColor = Violet,
            unfocusedBorderColor = OutlineSoft,
            cursorColor = Violet,
        ),
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun ChoicePill(text: String, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(if (selected) Violet else VioletContainer)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 8.dp),
    ) {
        Text(
            text,
            color = if (selected) Color.White else OnVioletContainer,
            fontWeight = FontWeight.SemiBold,
            style = MaterialTheme.typography.labelLarge,
        )
    }
}
