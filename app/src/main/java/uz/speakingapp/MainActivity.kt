package uz.speakingapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import uz.speakingapp.data.AttemptUploader
import uz.speakingapp.data.ContentRepository
import uz.speakingapp.data.ProfileStore
import uz.speakingapp.ui.home.HomeScreen
import uz.speakingapp.ui.module.ModuleDetailScreen
import uz.speakingapp.ui.profile.ProfileScreen
import uz.speakingapp.ui.theme.SpeakUpTheme
import uz.speakingapp.ui.theme.pagePattern

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SpeakUpTheme {
                val repository = remember { ContentRepository(applicationContext) }
                val profileStore = remember { ProfileStore(applicationContext) }
                var profile by remember { mutableStateOf(profileStore.load()) }
                val navController = rememberNavController()

                // Ochilishda: onlayn kontentni tekshiramiz va offline qolgan
                // natijalarni serverga uzatamiz (ikkalasi ham best-effort).
                var refreshKey by remember { mutableIntStateOf(0) }
                LaunchedEffect(Unit) {
                    if (repository.sync()) refreshKey++
                    AttemptUploader.flushPending(applicationContext)
                }

                Scaffold(modifier = Modifier.fillMaxSize()) { padding ->
                    NavHost(
                        navController = navController,
                        startDestination = if (profile.isComplete) "home" else "welcome",
                        // Sahifa foni — barcha ekranlarga umumiy nozik to'r.
                        modifier = Modifier.padding(padding).fillMaxSize().pagePattern(),
                    ) {
                        composable("welcome") {
                            ProfileScreen(
                                profile = profile,
                                firstTime = true,
                                onSave = { name, classGroup ->
                                    profileStore.save(name, classGroup)
                                    profile = profileStore.load()
                                    navController.navigate("home") {
                                        popUpTo("welcome") { inclusive = true }
                                    }
                                },
                            )
                        }
                        composable("profile") {
                            ProfileScreen(
                                profile = profile,
                                firstTime = false,
                                onBack = { navController.popBackStack() },
                                onSave = { name, classGroup ->
                                    profileStore.save(name, classGroup)
                                    profile = profileStore.load()
                                    navController.popBackStack()
                                },
                            )
                        }
                        composable("home") {
                            val modules = remember(refreshKey) { repository.loadModules() }
                            HomeScreen(
                                modules = modules,
                                studentName = profile.firstName,
                                onModuleClick = { id -> navController.navigate("module/$id") },
                                onProgressClick = { navController.navigate("progress") },
                                onProfileClick = { navController.navigate("profile") },
                            )
                        }
                        composable("progress") {
                            uz.speakingapp.ui.progress.ProgressScreen(
                                modules = repository.loadModules(),
                                onBack = { navController.popBackStack() },
                            )
                        }
                        composable("module/{moduleId}") { backStackEntry ->
                            val id = backStackEntry.arguments?.getString("moduleId").orEmpty()
                            ModuleDetailScreen(
                                module = repository.moduleById(id),
                                onBack = { navController.popBackStack() },
                                onExerciseClick = { exerciseId ->
                                    navController.navigate("exercise/$id/$exerciseId")
                                },
                                onDialogClick = { dialogId ->
                                    navController.navigate("dialog/$id/$dialogId")
                                },
                                onConversationClick = { conversationId ->
                                    navController.navigate("conversation/$id/$conversationId")
                                },
                            )
                        }
                        composable("exercise/{moduleId}/{exerciseId}") { backStackEntry ->
                            val moduleId = backStackEntry.arguments?.getString("moduleId").orEmpty()
                            val exerciseId = backStackEntry.arguments?.getString("exerciseId").orEmpty()
                            val module = repository.moduleById(moduleId)
                            val exercise = module?.exercises?.firstOrNull { it.id == exerciseId }
                            uz.speakingapp.ui.exercise.ExerciseScreen(
                                exercise = exercise,
                                moduleId = moduleId,
                                onBack = { navController.popBackStack() },
                                // Modul do'stini (mascot) tanlash uchun.
                                moduleType = module?.type.orEmpty(),
                            )
                        }
                        composable("dialog/{moduleId}/{dialogId}") { backStackEntry ->
                            val moduleId = backStackEntry.arguments?.getString("moduleId").orEmpty()
                            val dialogId = backStackEntry.arguments?.getString("dialogId").orEmpty()
                            val module = repository.moduleById(moduleId)
                            val scenario = module?.dialogs?.firstOrNull { it.id == dialogId }
                            uz.speakingapp.ui.dialog.DialogScreen(
                                scenario = scenario,
                                moduleId = moduleId,
                                isInterview = module?.type == "interview",
                                onBack = { navController.popBackStack() },
                                moduleType = module?.type.orEmpty(),
                            )
                        }
                        composable("conversation/{moduleId}/{conversationId}") { backStackEntry ->
                            val moduleId = backStackEntry.arguments?.getString("moduleId").orEmpty()
                            val conversationId =
                                backStackEntry.arguments?.getString("conversationId").orEmpty()
                            val module = repository.moduleById(moduleId)
                            val conversation =
                                module?.conversations?.firstOrNull { it.id == conversationId }
                            uz.speakingapp.ui.conversation.ConversationScreen(
                                conversation = conversation,
                                moduleId = moduleId,
                                onBack = { navController.popBackStack() },
                                moduleType = module?.type.orEmpty(),
                            )
                        }
                    }
                }
            }
        }
    }
}
