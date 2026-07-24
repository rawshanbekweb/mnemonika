package uz.speakingapp.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.speakingapp.data.model.SpeakingModule
import uz.speakingapp.ui.theme.HeroGradient
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.SoftCard
import uz.speakingapp.ui.theme.accentGradientFor

@Composable
fun HomeScreen(
    modules: List<SpeakingModule>,
    onModuleClick: (String) -> Unit,
    onProgressClick: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item { HomeHeader(onProgressClick) }
        item {
            Text(
                "Mavzuni tanlang",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
            )
        }
        items(modules, key = { it.id }) { module ->
            ModuleCard(
                module = module,
                onClick = { onModuleClick(module.id) },
                modifier = Modifier.padding(horizontal = 16.dp),
            )
        }
    }
}

@Composable
private fun HomeHeader(onProgressClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
            .background(HeroGradient)
            .padding(20.dp),
    ) {
        Column {
            Text("Salom! 👋", color = Color.White.copy(alpha = 0.9f), fontSize = 15.sp)
            Spacer(Modifier.size(2.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("🎙️", fontSize = 30.sp)
                Spacer(Modifier.size(8.dp))
                Text(
                    "SpeakUp",
                    color = Color.White,
                    style = MaterialTheme.typography.headlineMedium,
                )
            }
            Spacer(Modifier.size(4.dp))
            Text(
                "Ingliz tilida gapirishni mashq qilamiz · 5–6 sinf",
                color = Color.White.copy(alpha = 0.9f),
                style = MaterialTheme.typography.bodyMedium,
            )
            Spacer(Modifier.size(16.dp))
            Row(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color.White)
                    .clickable(onClick = onProgressClick)
                    .padding(horizontal = 18.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("📊", fontSize = 16.sp)
                Spacer(Modifier.size(8.dp))
                Text(
                    "Mening natijalarim",
                    color = uz.speakingapp.ui.theme.Violet,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                )
            }
        }
    }
}

@Composable
private fun ModuleCard(module: SpeakingModule, onClick: () -> Unit, modifier: Modifier = Modifier) {
    SoftCard(modifier = modifier, onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(accentGradientFor(module.type)),
                contentAlignment = Alignment.Center,
            ) {
                Text(module.emoji, fontSize = 28.sp)
            }
            Spacer(Modifier.size(14.dp))
            Column(Modifier.weight(1f)) {
                Text(module.titleUz, style = MaterialTheme.typography.titleMedium)
                val count = module.exercises.size + module.dialogs.size
                Text(
                    "${module.titleEn} · $count ta mashq",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
            }
            Text("›", fontSize = 28.sp, color = InkMuted, fontWeight = FontWeight.Bold)
        }
    }
}
