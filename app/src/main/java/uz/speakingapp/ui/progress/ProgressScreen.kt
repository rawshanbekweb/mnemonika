package uz.speakingapp.ui.progress

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
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

@OptIn(ExperimentalMaterial3Api::class)
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
        TopAppBar(
            title = { Text("Mening natijalarim") },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Orqaga")
                }
            },
        )
        if (total == 0) {
            Column(
                modifier = Modifier.fillMaxSize().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Spacer(Modifier.size(40.dp))
                Text("📊", fontSize = 48.sp)
                Spacer(Modifier.size(12.dp))
                Text(
                    "Hali natijalar yo'q. Birinchi mashqni bajaring!",
                    style = MaterialTheme.typography.bodyLarge,
                )
            }
            return@Column
        }
        LazyColumn(
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Text(
                    "Jami $total ta urinish",
                    style = MaterialTheme.typography.titleMedium,
                )
            }
            item { Text("Modullar bo'yicha", style = MaterialTheme.typography.titleSmall) }
            items(stats, key = { it.moduleId }) { stat ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(emojiByModule[stat.moduleId] ?: "•", fontSize = 24.sp)
                            Spacer(Modifier.size(10.dp))
                            Text(
                                titleByModule[stat.moduleId] ?: stat.moduleId,
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.weight(1f),
                            )
                            Text(
                                "${stat.avgScore}/100",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary,
                            )
                        }
                        Spacer(Modifier.size(8.dp))
                        LinearProgressIndicator(
                            progress = { stat.avgScore / 100f },
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Spacer(Modifier.size(6.dp))
                        Text(
                            "O'rtacha ${stat.avgScore} · Eng yaxshi ${stat.bestScore} · ${stat.attempts} urinish",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
            item {
                Spacer(Modifier.size(4.dp))
                Text("So'nggi urinishlar", style = MaterialTheme.typography.titleSmall)
            }
            items(recent.take(20), key = { it.id }) { attempt ->
                RecentRow(attempt, emojiByModule[attempt.moduleId] ?: "•")
            }
        }
    }
}

@Composable
private fun RecentRow(attempt: AttemptEntity, emoji: String) {
    Card(Modifier.fillMaxWidth()) {
        Row(
            Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(emoji, fontSize = 20.sp)
            Spacer(Modifier.size(10.dp))
            Column(Modifier.weight(1f)) {
                Text(attempt.exerciseTitle, style = MaterialTheme.typography.bodyMedium)
                Text(
                    "${attempt.wordCount} so'z · ${attempt.wordsPerMinute} so'z/daq · ${attempt.durationSec}s",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(
                "${attempt.overallScore}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
            )
        }
    }
}
