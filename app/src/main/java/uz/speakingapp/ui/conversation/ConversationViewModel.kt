package uz.speakingapp.ui.conversation

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import uz.speakingapp.analysis.ConversationCoach
import uz.speakingapp.analysis.ConversationEngine
import uz.speakingapp.analysis.ConversationResult
import uz.speakingapp.analysis.ConversationTurn
import uz.speakingapp.analysis.SpeechResult
import uz.speakingapp.data.ProgressRepository
import uz.speakingapp.data.model.Conversation
import uz.speakingapp.data.model.ConversationNode
import uz.speakingapp.speech.ModelManager
import uz.speakingapp.speech.Speaker
import uz.speakingapp.speech.VoskRecognizer
import uz.speakingapp.ui.dialog.ChatMessage

enum class ConversationPhase { NeedModel, PreparingModel, CharacterSpeaking, StudentTurn, Recording, Done }

data class ConversationUiState(
    val phase: ConversationPhase = ConversationPhase.NeedModel,
    val downloadProgress: Float = 0f,
    val messages: List<ChatMessage> = emptyList(),
    val currentHint: String = "",
    val liveText: String = "",
    /** Mikrofon signal darajasi 0f..1f — personaj shunga jonlanadi. */
    val micLevel: Float = 0f,
    /** Joriy navbatda yozuv necha soniya davom etdi. */
    val elapsedSec: Int = 0,
    /** Suhbat boshlanganidan beri o'tgan vaqt. */
    val totalElapsedSec: Int = 0,
    val targetMinutes: Int = 3,
    val turnCount: Int = 0,
    /** Dastur tushungan javoblar soni — ekranda "meni tushunishdi" ko'rsatkichi. */
    val understoodCount: Int = 0,
    val result: ConversationResult? = null,
    val error: String? = null,
)

/**
 * Erkin suhbat ekranining holati.
 *
 * Vosk bilan ishlash qoidalari `DialogViewModel` dagi bilan AYNAN bir xil va
 * ular buzilmasligi shart (2026-07-27 dagi SIGSEGV saboqi):
 *  - `stop()` faqat bayroqni o'zgartiradi va darhol qaytadi;
 *  - yakuniy natija `onFinished` orqali keladi, main oqim bloklanmaydi;
 *  - `stopping` bayrog'i vaqt tugashi va tugma bosilishi to'qnashganda
 *    javob ikki marta qayd etilishining oldini oladi.
 */
class ConversationViewModel(app: Application) : AndroidViewModel(app) {

    private val modelManager = ModelManager(app)
    private val recognizer = VoskRecognizer()
    private val speaker = Speaker(app)
    private val progressRepository = ProgressRepository(app)

    private val _state = MutableStateFlow(ConversationUiState())
    val state: StateFlow<ConversationUiState> = _state.asStateFlow()

    private var conversation: Conversation? = null
    private var moduleId = ""
    private var currentNode: ConversationNode? = null

    private var turnTimerJob: Job? = null
    private var totalTimerJob: Job? = null

    private val segments = StringBuilder()
    private val altSegments = mutableListOf<String>()
    private val turns = mutableListOf<ConversationTurn>()

    private var stopping = false
    private var finishSignal: CompletableDeferred<Unit>? = null

    private companion object {
        /** Bitta javob uchun eng uzun vaqt. */
        const val TURN_LIMIT_SEC = 40
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
        recognizer.onLevel = { level -> _state.update { it.copy(micLevel = level) } }
        recognizer.onErrorMsg = { msg -> _state.update { it.copy(error = msg) } }
        recognizer.onFinished = { finishSignal?.complete(Unit) }
    }

    fun bind(conversation: Conversation, moduleId: String) {
        if (this.conversation?.id == conversation.id) return
        this.conversation = conversation
        this.moduleId = moduleId
        _state.update {
            it.copy(phase = ConversationPhase.NeedModel, targetMinutes = conversation.targetMinutes)
        }
        if (modelManager.isModelReady()) prepareModel()
    }

    fun prepareModel() {
        if (_state.value.phase == ConversationPhase.PreparingModel) return
        _state.update {
            it.copy(phase = ConversationPhase.PreparingModel, error = null, downloadProgress = 0f)
        }
        viewModelScope.launch {
            try {
                val path = modelManager.ensureModel { p ->
                    _state.update { it.copy(downloadProgress = p) }
                }
                recognizer.loadModel(path)
                startConversation()
            } catch (e: Exception) {
                _state.update {
                    it.copy(phase = ConversationPhase.NeedModel, error = e.message ?: "Model tayyorlanmadi")
                }
            }
        }
    }

    fun restart() = startConversation()

    private fun startConversation() {
        val c = conversation ?: return
        segments.clear()
        altSegments.clear()
        turns.clear()
        stopping = false
        _state.update {
            it.copy(
                messages = emptyList(),
                result = null,
                turnCount = 0,
                understoodCount = 0,
                totalElapsedSec = 0,
                elapsedSec = 0,
                error = null,
            )
        }
        startTotalTimer()
        val start = c.startNode
        if (start == null) {
            _state.update { it.copy(error = "Suhbat bo'sh") }
            return
        }
        speakNode(start)
    }

    /** Suhbat vaqti — yozuv paytida ham, personaj gapirayotganda ham ketadi. */
    private fun startTotalTimer() {
        totalTimerJob?.cancel()
        totalTimerJob = viewModelScope.launch {
            while (true) {
                delay(1000)
                if (_state.value.phase == ConversationPhase.Done) break
                _state.update { it.copy(totalElapsedSec = it.totalElapsedSec + 1) }
            }
        }
    }

    private fun speakNode(node: ConversationNode) {
        currentNode = node
        addCharacter(node.line)
        _state.update { it.copy(phase = ConversationPhase.CharacterSpeaking, liveText = "") }
        speaker.speak(node.line) {
            if (node.isEnd) {
                finish()
            } else {
                _state.update {
                    it.copy(
                        phase = ConversationPhase.StudentTurn,
                        currentHint = node.hintUz.ifBlank { "Javob ber:" },
                    )
                }
            }
        }
    }

    fun startRecording() {
        if (_state.value.phase != ConversationPhase.StudentTurn || stopping) return
        segments.clear()
        altSegments.clear()
        _state.update { it.copy(phase = ConversationPhase.Recording, liveText = "", elapsedSec = 0) }
        try {
            recognizer.startListening()
        } catch (e: Exception) {
            _state.update { it.copy(phase = ConversationPhase.StudentTurn, error = e.message) }
            return
        }
        turnTimerJob = viewModelScope.launch {
            while (true) {
                delay(1000)
                val s = _state.value
                if (s.phase != ConversationPhase.Recording) break
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
        if (_state.value.phase != ConversationPhase.Recording || stopping) return
        stopping = true
        turnTimerJob?.cancel()

        val signal = CompletableDeferred<Unit>()
        finishSignal = signal
        recognizer.stop()

        viewModelScope.launch {
            withTimeoutOrNull(FINISH_TIMEOUT_MS) { signal.await() }
            finishSignal = null
            stopping = false
            advance(segments.toString().trim(), _state.value.elapsedSec)
        }
    }

    /**
     * Bola javob bera olmadi — suhbatni to'xtatmaymiz, fallback yo'lidan
     * davom etamiz. Busiz bitta tushunarsiz savol butun suhbatni to'xtatardi.
     */
    fun skipTurn() {
        if (_state.value.phase != ConversationPhase.StudentTurn) return
        advance("", 0)
    }

    /** Javobni qayd etadi, keyingi tugunni tanlaydi va suhbatni davom ettiradi. */
    private fun advance(transcript: String, durationSec: Int) {
        val c = conversation ?: return
        val node = currentNode ?: return

        val step = ConversationEngine.next(node, transcript, altSegments.toList())
        if (transcript.isNotBlank()) addStudent(transcript)

        turns.add(
            ConversationTurn(
                nodeKey = node.nodeKey,
                transcript = transcript,
                understood = step.understood,
                durationSec = durationSec,
            )
        )
        _state.update {
            it.copy(
                turnCount = it.turnCount + 1,
                understoodCount = it.understoodCount + if (step.understood) 1 else 0,
            )
        }

        val next = ConversationEngine.resolve(c, step.nextKey, _state.value.totalElapsedSec)
        if (next == null) finish() else speakNode(next)
    }

    private fun finish() {
        totalTimerJob?.cancel()
        val result = ConversationCoach.analyze(turns.toList())
        _state.update { it.copy(phase = ConversationPhase.Done, result = result, liveText = "") }
        saveAttempt(result)
    }

    /**
     * Suhbat natijasi ham progressga tushadi (daraja, seriya, nishonlar) —
     * shuning uchun mavjud `SpeechResult` shakliga o'giriladi. Kalit so'z
     * maydonlari bo'sh: suhbatda kalit so'z qamrovi o'lchanmaydi.
     */
    private fun saveAttempt(result: ConversationResult) {
        val c = conversation ?: return
        if (result.wordCount == 0) return
        val speech = SpeechResult(
            transcript = result.transcript,
            wordCount = result.wordCount,
            uniqueWordCount = result.uniqueWordCount,
            durationSec = result.speakingSec,
            wordsPerMinute = result.wordsPerMinute,
            matchedKeywords = emptyList(),
            totalKeywords = 0,
            overallScore = result.score,
            feedback = result.tips.map { it.detail },
            tips = result.tips,
        )
        viewModelScope.launch {
            try {
                progressRepository.saveAttempt(
                    moduleId = moduleId,
                    exerciseId = c.id,
                    exerciseTitle = c.title,
                    result = speech,
                    timestamp = System.currentTimeMillis(),
                )
            } catch (_: Exception) {
            }
        }
    }

    private fun addCharacter(text: String) {
        if (text.isBlank()) return
        _state.update { it.copy(messages = it.messages + ChatMessage(true, text)) }
    }

    private fun addStudent(text: String) {
        _state.update { it.copy(messages = it.messages + ChatMessage(false, text)) }
    }

    /** Ekran fonga o'tdi — mikrofon va personaj ovozi ochiq qolmasligi kerak. */
    fun onScreenStopped() {
        speaker.stop()
        stopRecording()
    }

    override fun onCleared() {
        turnTimerJob?.cancel()
        totalTimerJob?.cancel()
        recognizer.release()
        speaker.shutdown()
        super.onCleared()
    }
}
