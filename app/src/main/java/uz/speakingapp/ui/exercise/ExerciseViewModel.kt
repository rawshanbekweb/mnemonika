package uz.speakingapp.ui.exercise

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import uz.speakingapp.analysis.SpeechAnalyzer
import uz.speakingapp.analysis.SpeechResult
import uz.speakingapp.data.model.Exercise
import uz.speakingapp.speech.ModelManager
import uz.speakingapp.speech.VoskRecognizer

enum class Phase { NeedModel, PreparingModel, Ready, Recording, Done }

data class ExerciseUiState(
    val phase: Phase = Phase.NeedModel,
    val downloadProgress: Float = 0f,
    val liveText: String = "",
    val transcript: String = "",
    val elapsedSec: Int = 0,
    val timeLimitSec: Int = 60,
    val result: SpeechResult? = null,
    val error: String? = null,
)

class ExerciseViewModel(app: Application) : AndroidViewModel(app) {

    private val modelManager = ModelManager(app)
    private val recognizer = VoskRecognizer()

    private val _state = MutableStateFlow(ExerciseUiState())
    val state: StateFlow<ExerciseUiState> = _state.asStateFlow()

    private var exercise: Exercise? = null
    private var timerJob: Job? = null
    private val segments = StringBuilder()

    init {
        recognizer.onPartial = { partial ->
            _state.update { it.copy(liveText = partial) }
        }
        recognizer.onSegment = { segment ->
            if (segments.isNotEmpty()) segments.append(' ')
            segments.append(segment)
            _state.update { it.copy(transcript = segments.toString(), liveText = "") }
        }
        recognizer.onErrorMsg = { msg ->
            _state.update { it.copy(error = msg) }
        }
    }

    fun bind(exercise: Exercise) {
        if (this.exercise?.id == exercise.id) return
        this.exercise = exercise
        _state.update {
            it.copy(
                timeLimitSec = exercise.timeLimitSec,
                phase = if (modelManager.isModelReady()) Phase.NeedModel else Phase.NeedModel,
            )
        }
    }

    /** Modelni tayyorlaydi (kerak bo'lsa yuklab oladi). */
    fun prepareModel() {
        if (_state.value.phase == Phase.PreparingModel) return
        _state.update { it.copy(phase = Phase.PreparingModel, error = null, downloadProgress = 0f) }
        viewModelScope.launch {
            try {
                val path = modelManager.ensureModel { p ->
                    _state.update { it.copy(downloadProgress = p) }
                }
                recognizer.loadModel(path)
                _state.update { it.copy(phase = Phase.Ready) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(phase = Phase.NeedModel, error = e.message ?: "Model tayyorlanmadi")
                }
            }
        }
    }

    fun startRecording() {
        if (_state.value.phase != Phase.Ready && _state.value.phase != Phase.Done) return
        segments.clear()
        _state.update {
            it.copy(
                phase = Phase.Recording,
                transcript = "",
                liveText = "",
                elapsedSec = 0,
                result = null,
                error = null,
            )
        }
        try {
            recognizer.startListening()
        } catch (e: Exception) {
            _state.update { it.copy(phase = Phase.Ready, error = e.message) }
            return
        }
        timerJob = viewModelScope.launch {
            while (true) {
                delay(1000)
                val s = _state.value
                if (s.phase != Phase.Recording) break
                val next = s.elapsedSec + 1
                _state.update { it.copy(elapsedSec = next) }
                if (next >= s.timeLimitSec) {
                    stopRecording()
                    break
                }
            }
        }
    }

    fun stopRecording() {
        if (_state.value.phase != Phase.Recording) return
        timerJob?.cancel()
        recognizer.stop()
        // Yakuniy segment kelishi uchun qisqa kutamiz, keyin tahlil qilamiz.
        viewModelScope.launch {
            delay(300)
            val ex = exercise
            val transcript = segments.toString().trim()
            val result = SpeechAnalyzer.analyze(
                transcript = transcript,
                durationSec = _state.value.elapsedSec,
                keywords = ex?.keywords ?: emptyList(),
            )
            _state.update {
                it.copy(phase = Phase.Done, transcript = transcript, liveText = "", result = result)
            }
        }
    }

    override fun onCleared() {
        timerJob?.cancel()
        recognizer.release()
        super.onCleared()
    }
}
