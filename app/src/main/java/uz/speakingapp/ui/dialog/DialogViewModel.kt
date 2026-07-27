package uz.speakingapp.ui.dialog

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import uz.speakingapp.analysis.KeywordMatcher
import uz.speakingapp.analysis.SpeechResult
import uz.speakingapp.data.ProgressRepository
import uz.speakingapp.data.model.DialogScenario
import uz.speakingapp.speech.ModelManager
import uz.speakingapp.speech.Speaker
import uz.speakingapp.speech.VoskRecognizer

enum class DialogPhase { NeedModel, PreparingModel, CharacterSpeaking, StudentTurn, Recording, Done }

data class ChatMessage(val fromCharacter: Boolean, val text: String)

data class DialogUiState(
    val phase: DialogPhase = DialogPhase.NeedModel,
    val downloadProgress: Float = 0f,
    val messages: List<ChatMessage> = emptyList(),
    val currentHint: String = "",
    val liveText: String = "",
    val elapsedSec: Int = 0,
    val turnIndex: Int = 0,
    val totalTurns: Int = 0,
    val result: SpeechResult? = null,
    val error: String? = null,
)

class DialogViewModel(app: Application) : AndroidViewModel(app) {

    private val modelManager = ModelManager(app)
    private val recognizer = VoskRecognizer()
    private val speaker = Speaker(app)
    private val progressRepository = ProgressRepository(app)

    private val _state = MutableStateFlow(DialogUiState())
    val state: StateFlow<DialogUiState> = _state.asStateFlow()

    private var scenario: DialogScenario? = null
    private var isInterview = false
    private var moduleId = ""
    private var timerJob: Job? = null
    private val segments = StringBuilder()

    /** Tanigichning qo'shimcha variantlari — faqat kalit so'z qidirish uchun. */
    private val altSegments = mutableListOf<String>()

    private val studentResponses = mutableListOf<String>()
    private val matchedKeywords = linkedSetOf<String>()
    private var totalKeywords = 0

    /** To'xtatish boshlandi, lekin javob hali qayd etilmadi. */
    private var stopping = false

    /** Tanigich yakuniy natijani yuborganini kutish uchun. */
    private var finishSignal: CompletableDeferred<Unit>? = null

    private companion object {
        const val TURN_LIMIT_SEC = 40

        /** Yakuniy natijani kutishning eng uzun muddati (sekin qurilma uchun). */
        const val FINISH_TIMEOUT_MS = 5_000L
    }

    init {
        recognizer.onPartial = { p -> _state.update { it.copy(liveText = p) } }
        recognizer.onSegment = { s, alternatives ->
            if (segments.isNotEmpty()) segments.append(' ')
            segments.append(s)
            altSegments.addAll(alternatives.drop(1))
            _state.update { it.copy(liveText = "") }
        }
        recognizer.onErrorMsg = { msg -> _state.update { it.copy(error = msg) } }
        recognizer.onFinished = { finishSignal?.complete(Unit) }
    }

    fun bind(scenario: DialogScenario, moduleId: String, isInterview: Boolean) {
        if (this.scenario?.id == scenario.id) return
        this.scenario = scenario
        this.moduleId = moduleId
        this.isInterview = isInterview
        this.totalKeywords = scenario.turns.sumOf { it.expectedKeywords.size }
        _state.update {
            it.copy(phase = DialogPhase.NeedModel, totalTurns = scenario.turns.size)
        }
        if (modelManager.isModelReady()) prepareModel()
    }

    fun prepareModel() {
        if (_state.value.phase == DialogPhase.PreparingModel) return
        _state.update {
            it.copy(phase = DialogPhase.PreparingModel, error = null, downloadProgress = 0f)
        }
        viewModelScope.launch {
            try {
                val path = modelManager.ensureModel { p ->
                    _state.update { it.copy(downloadProgress = p) }
                }
                recognizer.loadModel(path)
                startScenario()
            } catch (e: Exception) {
                _state.update {
                    it.copy(phase = DialogPhase.NeedModel, error = e.message ?: "Model tayyorlanmadi")
                }
            }
        }
    }

    private fun startScenario() {
        val sc = scenario ?: return
        segments.clear()
        altSegments.clear()
        studentResponses.clear()
        matchedKeywords.clear()
        _state.update { it.copy(messages = emptyList(), turnIndex = 0) }
        if (sc.intro.isNotBlank()) {
            addCharacter(sc.intro)
            _state.update { it.copy(phase = DialogPhase.CharacterSpeaking) }
            speaker.speak(sc.intro) { beginTurn(0) }
        } else {
            beginTurn(0)
        }
    }

    private fun beginTurn(index: Int) {
        val sc = scenario ?: return
        if (index >= sc.turns.size) {
            finish()
            return
        }
        _state.update { it.copy(turnIndex = index) }
        val turn = sc.turns[index]
        if (isInterview) {
            // O'quvchi avval savol beradi
            _state.update {
                it.copy(phase = DialogPhase.StudentTurn, currentHint = turn.studentHint)
            }
        } else {
            // Rolli o'yin: personaj avval gapiradi
            addCharacter(turn.characterLine)
            _state.update { it.copy(phase = DialogPhase.CharacterSpeaking) }
            speaker.speak(turn.characterLine) {
                _state.update {
                    it.copy(
                        phase = DialogPhase.StudentTurn,
                        currentHint = turn.studentHint.ifBlank { "Javob bering:" },
                    )
                }
            }
        }
    }

    fun startRecording() {
        if (_state.value.phase != DialogPhase.StudentTurn || stopping) return
        segments.clear()
        altSegments.clear()
        _state.update { it.copy(phase = DialogPhase.Recording, liveText = "", elapsedSec = 0) }
        try {
            recognizer.startListening()
        } catch (e: Exception) {
            _state.update { it.copy(phase = DialogPhase.StudentTurn, error = e.message) }
            return
        }
        timerJob = viewModelScope.launch {
            while (true) {
                delay(1000)
                val s = _state.value
                if (s.phase != DialogPhase.Recording) break
                val next = s.elapsedSec + 1
                _state.update { it.copy(elapsedSec = next) }
                if (next >= TURN_LIMIT_SEC) {
                    stopRecording()
                    break
                }
            }
        }
    }

    fun stopRecording() {
        // `stopping` ham tekshiriladi: vaqt tugashi va tugma bosilishi bir vaqtda
        // to'g'ri kelsa, bitta javob ikki marta qayd etilib navbat ikki qadam
        // oldinga siljib ketardi.
        if (_state.value.phase != DialogPhase.Recording || stopping) return
        stopping = true
        timerJob?.cancel()

        val signal = CompletableDeferred<Unit>()
        finishSignal = signal
        recognizer.stop()

        viewModelScope.launch {
            // Tanigich yakuniy natijani berguncha kutamiz (muddat — himoya to'siq).
            withTimeoutOrNull(FINISH_TIMEOUT_MS) { signal.await() }
            finishSignal = null
            stopping = false
            val sc = scenario ?: return@launch
            val index = _state.value.turnIndex
            val turn = sc.turns.getOrNull(index) ?: return@launch
            val transcript = segments.toString().trim().ifBlank { "…" }
            studentResponses.add(transcript)
            addStudent(transcript)

            // Kalit so'z mosligi — mashqlardagi bilan bir xil, ASR xatolariga chidamli.
            matchedKeywords.addAll(
                KeywordMatcher.matched(transcript, turn.expectedKeywords, altSegments.toList())
            )

            if (isInterview) {
                // Personaj javob beradi
                addCharacter(turn.characterLine)
                _state.update { it.copy(phase = DialogPhase.CharacterSpeaking) }
                speaker.speak(turn.characterLine) { beginTurn(index + 1) }
            } else {
                beginTurn(index + 1)
            }
        }
    }

    private fun finish() {
        val result = buildResult()
        _state.update { it.copy(phase = DialogPhase.Done, result = result, liveText = "") }
        saveAttempt(result)
    }

    private fun buildResult(): SpeechResult {
        val allText = studentResponses.joinToString(" ")
        val words = allText.lowercase().split(Regex("[^\\p{L}']+")).filter { it.isNotBlank() }
        val keywordScore = if (totalKeywords == 0) 100 else matchedKeywords.size * 100 / totalKeywords
        val lengthScore = when {
            words.size >= 60 -> 100
            words.size >= 40 -> 80
            words.size >= 20 -> 60
            words.size >= 10 -> 40
            else -> 20
        }
        val completionScore = 100 // dialog oxirigacha yetkazildi
        val overall = ((keywordScore + lengthScore + completionScore) / 3).coerceIn(0, 100)
        val feedback = buildList {
            add("Suhbatni oxirigacha olib bordingiz — ${state.value.totalTurns} ta almashish!")
            if (words.size < 20) add("Keyingi safar to'liqroq javoblar berishga harakat qiling.")
            else add("Yaxshi, ${words.size} so'z ishlatdingiz.")
            if (totalKeywords > 0) {
                add("Kalit iboralar: ${matchedKeywords.size}/$totalKeywords ishlatildi.")
            }
        }
        return SpeechResult(
            transcript = allText,
            wordCount = words.size,
            uniqueWordCount = words.toSet().size,
            durationSec = 0,
            wordsPerMinute = 0,
            matchedKeywords = matchedKeywords.toList(),
            totalKeywords = totalKeywords,
            overallScore = overall,
            feedback = feedback,
        )
    }

    private fun saveAttempt(result: SpeechResult) {
        val sc = scenario ?: return
        if (result.wordCount == 0) return
        viewModelScope.launch {
            try {
                progressRepository.saveAttempt(
                    moduleId = moduleId,
                    exerciseId = sc.id,
                    exerciseTitle = sc.title,
                    result = result,
                    timestamp = System.currentTimeMillis(),
                )
            } catch (_: Exception) {
            }
        }
    }

    fun restart() = startScenario()

    private fun addCharacter(text: String) {
        _state.update { it.copy(messages = it.messages + ChatMessage(true, text)) }
    }

    private fun addStudent(text: String) {
        _state.update { it.copy(messages = it.messages + ChatMessage(false, text)) }
    }

    /**
     * Ekran fonga o'tdi — mikrofon va personaj ovozi ochiq qolmasligi kerak.
     * Yozuv odatdagidek yakunlanadi, javob yo'qolmaydi.
     */
    fun onScreenStopped() {
        speaker.stop()
        stopRecording()
    }

    override fun onCleared() {
        timerJob?.cancel()
        recognizer.release()
        speaker.shutdown()
        super.onCleared()
    }
}
