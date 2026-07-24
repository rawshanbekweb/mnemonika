package uz.speakingapp.ui.progress

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.speakingapp.data.db.AttemptEntity
import uz.speakingapp.data.model.SpeakingModule
import uz.speakingapp.ui.theme.BrandProgressBar
import uz.speakingapp.ui.theme.BrandTopBar
import uz.speakingapp.ui.theme.InkMuted
import uz.speakingapp.ui.theme.ScoreRing
import uz.speakingapp.ui.theme.SectionTitle
import uz.speakingapp.ui.theme.SoftCard
import uz.speakingapp.ui.theme.Violet

@Composable
fun ProgressScreen(
    modules: List<SpeakingModule>,
    onBack: () -> Unit,
) {
    val vm: ProgressViewModel = viewModel()
    val stats by vm.stats.collectAsStateWithLifecycle()
    val recent by vm.recent.collectAsStateWithLifecycle()
    val total by vm.total.collectAsStateWithLifecycle()

    val titleByModule = modules.associate { it.id to it.titleUz }
    val emojiByModule = modules.associate { it.id to it.emoji }

    Column(modifier = Modifier.fillMaxSize()) {
        BrandTopBar(title = "Mening natijalarim", onBack = onBack)
        if (total == 0) {
            Column(
                modifier = Modifier.fillMaxSize().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Spacer(Modifier.size(48.dp))
                Text("📊", fontSize = 56.sp)
                Spacer(Modifier.size(12.dp))
                Text("Hali natijalar yo'q", style = MaterialTheme.typography.titleMedium)
                Text(
                    "Birinchi mashqni bajaring va natijangiz shu yerda paydo bo'ladi!",
                    style = MaterialTheme.typography.bodyMedium,
                    color = InkMuted,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                )
            }
            return@Column
        }
        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                val overallAvg = if (recent.isNotEmpty()) recent.map { it.overallScore }.average().toInt() else 0
                SoftCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ScoreRing(overallAvg, ringSize = 104.dp, stroke = 11.dp)
                        Spacer(Modifier.size(16.dp))
                        Column {
                            Text("Umumiy o'rtacha", style = MaterialTheme.typography.titleMedium)
                            Spacer(Modifier.size(4.dp))
                            Text("$total ta urinish", style = MaterialTheme.typography.bodyMedium, color = InkMuted)
                            Text("Zo'r ketyapsan! ✨", style = MaterialTheme.typography.bodySmall, color = Violet)
                        }
                    }
                }
            }
            item { SectionTitle("Modullar bo'yicha", Modifier.padding(top = 4.dp)) }
            items(stats, key = { it.moduleId }) { stat ->
                SoftCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(emojiByModule[stat.moduleId] ?: "•", fontSize = 26.sp)
                        Spacer(Modifier.size(10.dp))
                        Text(
                            titleByModule[stat.moduleId] ?: stat.moduleId,
                            style = MaterialTheme.typography.titleMedium,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            "${stat.avgScore}",
                            style = MaterialTheme.typography.titleLarge,
                            color = Violet,
                        )
                        Text("/100", style = MaterialTheme.typography.bodySmall, color = InkMuted)
                    }
                    Spacer(Modifier.size(10.dp))
                    BrandProgressBar(progress = stat.avgScore / 100f)
                    Spacer(Modifier.size(8.dp))
                    Text(
                        "O'rtacha ${stat.avgScore} · Eng yaxshi ${stat.bestScore} · ${stat.attempts} urinish",
                        style = MaterialTheme.typography.bodySmall,
                        color = InkMuted,
                    )
                }
            }
            item { SectionTitle("So'nggi urinishlar", Modifier.padding(top = 4.dp)) }
            items(recent.take(20), key = { it.id }) { attempt ->
                RecentRow(attempt, emojiByModule[attempt.moduleId] ?: "•")
            }
        }
    }
}

@Composable
private fun RecentRow(attempt: AttemptEntity, emoji: String) {
    SoftCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(emoji, fontSize = 22.sp)
            Spacer(Modifier.size(12.dp))
            Column(Modifier.weight(1f)) {
                Text(attempt.exerciseTitle, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                Text(
                    "${attempt.wordCount} so'z · ${attempt.wordsPerMinute} so'z/daq · ${attempt.durationSec}s",
                    style = MaterialTheme.typography.bodySmall,
                    color = InkMuted,
                )
            }
            Text("${attempt.overallScore}", style = MaterialTheme.typography.titleLarge, color = Violet)
        }
    }
}
