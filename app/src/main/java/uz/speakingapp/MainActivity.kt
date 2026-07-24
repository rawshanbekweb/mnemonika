package uz.speakingapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import uz.speakingapp.data.ContentRepository
import uz.speakingapp.ui.home.HomeScreen
import uz.speakingapp.ui.module.ModuleDetailScreen
import uz.speakingapp.ui.theme.SpeakUpTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SpeakUpTheme {
                val repository = remember { ContentRepository(applicationContext) }
                val navController = rememberNavController()
                Scaffold(modifier = Modifier.fillMaxSize()) { padding ->
                    NavHost(
                        navController = navController,
                        startDestination = "home",
                        modifier = Modifier.padding(padding),
                    ) {
                        composable("home") {
                            HomeScreen(
                                modules = repository.loadModules(),
                                onModuleClick = { id -> navController.navigate("module/$id") },
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
                            )
                        }
                        composable("exercise/{moduleId}/{exerciseId}") { backStackEntry ->
                            val moduleId = backStackEntry.arguments?.getString("moduleId").orEmpty()
                            val exerciseId = backStackEntry.arguments?.getString("exerciseId").orEmpty()
                            val exercise = repository.moduleById(moduleId)
                                ?.exercises?.firstOrNull { it.id == exerciseId }
                            uz.speakingapp.ui.exercise.ExerciseScreen(
                                exercise = exercise,
                                onBack = { navController.popBackStack() },
                            )
                        }
                    }
                }
            }
        }
    }
}
