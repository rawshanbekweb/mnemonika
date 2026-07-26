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
import uz.speakingapp.analysis.GrammarChecker
import uz.speakingapp.analysis.ReadAloud
import uz.speakingapp.analysis.ReadAloudResult
import uz.speakingapp.analysis.SpeechAnalyzer
import uz.speakingapp.analysis.SpeechResult
import uz.speakingapp.analysis.WordStatus
import uz.speakingapp.data.ProgressRepository
import uz.speakingapp.data.model.Exercise
import uz.speakingapp.speech.ModelManager
import uz.speakingapp.speech.Speaker
import uz.speakingapp.speech.VoskRecognizer

enum class Phase { NeedModel, PreparingModel, Ready, Recording, Done }

data class ExerciseUiState(
    val phase: Phase = Phase.NeedModel,
    val downloadProgress: Float = 0f,
    val liveText: String = "",
    val transcript: String = "",
    val elapsedSec: Int = 0,
    val timeLimitSec: Int = 60,
    /** Mikrofon signal darajasi 0f..1f — "seni eshityapman" indikatori uchun. */
    val micLevel: Float = 0f,
    val result: SpeechResult? = null,
    /** "Takrorlang" mashqida so'zma-so'z solishtirish natijasi. */
    val readResult: ReadAloudResult? = null,
    val checkingGrammar: Boolean = false,
    val speaking: Boolean = false,
    val error: String? = null,
)

class ExerciseViewModel(app: Application) : AndroidViewModel(app) {

    private val modelManager = ModelManager(app)
    private val recognizer = VoskRecognizer()
    private val progressRepository = ProgressRepository(app)
    private val speaker = Speaker(app)

    private val _state = MutableStateFlow(ExerciseUiState())
    val state: StateFlow<ExerciseUiState> = _state.asStateFlow()

    private var exercise: Exercise? = null
    private var moduleId: String = ""
    private var timerJob: Job? = null
    private val segments = StringBuilder()

    /** Tanigichning ikkinchi/uchinchi variantlari — faqat kalit so'z qidirish uchun. */
    private val altSegments = mutableListOf<String>()

    init {
        recognizer.onPartial = { partial ->
            _state.update { it.copy(liveText = partial) }
        }
        recognizer.onSegment = { segment, alternatives ->
            if (segments.isNotEmpty()) segments.append(' ')
            segments.append(segment)
            // Qolgan variantlarni faqat kalit so'z qidirish uchun alohida to'playmiz.
            alternatives.drop(1).forEach { altSegments.add(it) }
            _state.update { it.copy(transcript = segments.toString(), liveText = "") }
        }
        recognizer.onErrorMsg = { msg ->
            _state.update { it.copy(error = msg) }
        }
        recognizer.onLevel = { level ->
            _state.update { it.copy(micLevel = level) }
        }
    }

    fun bind(exercise: Exercise, moduleId: String) {
        if (this.exercise?.id == exercise.id) return
        this.exercise = exercise
        this.moduleId = moduleId
        _state.update { it.copy(timeLimitSec = exercise.timeLimitSec, phase = Phase.NeedModel) }
        // Model allaqachon yuklangan bo'lsa, uni fon oqimida yuklab to'g'ridan-to'g'ri Tayyor holatiga o'tamiz.
        if (modelManager.isModelReady()) {
            prepareModel()
        }
    }

    /**
     * Savollarni ingliz tilida ovoz chiqarib o'qiydi (Android TTS — bepul).
     * O'quvchi to'g'ri talaffuzni eshitib, keyin takrorlashi uchun.
     */
    fun speakPrompts() {
        val ex = exercise ?: return
        if (_state.value.phase == Phase.Recording) return
        if (_state.value.speaking) {
            speaker.stop()
            _state.update { it.copy(speaking = false) }
            return
        }
        // "Takrorlang" mashqida namunani eshitish — mashqning asosiy qismi:
        // bola avval to'g'ri talaffuzni eshitadi, keyin takrorlaydi.
        val text = if (ex.isReadAloud) {
            ex.targetText
        } else {
            ex.prompts.joinToString(" ").ifBlank { ex.title }
        }
        _state.update { it.copy(speaking = true) }
        speaker.speak(text) {
            _state.update { it.copy(speaking = false) }
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
        // Namuna hali o'qilayotgan bo'lsa uni to'xtatamiz — mikrofon TTS ovozini yozib olmasin.
        speaker.stop()
        segments.clear()
        altSegments.clear()
        _state.update {
            it.copy(
                phase = Phase.Recording,
                transcript = "",
                liveText = "",
                elapsedSec = 0,
                result = null,
                readResult = null,
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

            // "Takrorlang" mashqi: kutilgan matn ma'lum, so'zma-so'z solishtiramiz.
            // Grammatika tekshirilmaydi — matn bolaniki emas, bizniki.
            if (ex != null && ex.isReadAloud) {
                val read = ReadAloud.analyze(
                    targetText = ex.targetText,
                    transcript = transcript,
                    durationSec = _state.value.elapsedSec,
                    alternatives = altSegments.toList(),
                )
                val asResult = readAsSpeechResult(read, transcript, _state.value.elapsedSec)
                _state.update {
                    it.copy(
                        phase = Phase.Done,
                        transcript = transcript,
                        liveText = "",
                        result = asResult,
                        readResult = read,
                        checkingGrammar = false,
                    )
                }
                saveAttempt(ex, asResult)
                return@launch
            }

            val localResult = SpeechAnalyzer.analyze(
                transcript = transcript,
                durationSec = _state.value.elapsedSec,
                keywords = ex?.keywords ?: emptyList(),
                alternatives = altSegments.toList(),
                // Murabbiy struktura bo'yicha maslahat bera olishi uchun.
                mnemonicSteps = ex?.mnemonic?.steps?.map { it.en } ?: emptyList(),
            )
            // Avval mahalliy natijani darhol ko'rsatamiz.
            _state.update {
                it.copy(
                    phase = Phase.Done,
                    transcript = transcript,
                    liveText = "",
                    result = localResult,
                    checkingGrammar = localResult.wordCount > 0,
                )
            }
            // Keyin onlayn grammatikani tekshiramiz (bo'lsa qo'shamiz).
            var finalResult = localResult
            if (localResult.wordCount > 0) {
                val report = GrammarChecker.check(transcript, localResult.wordCount)
                if (report != null) {
                    finalResult = SpeechAnalyzer.withGrammar(localResult, report)
                }
            }
            _state.update { it.copy(result = finalResult, checkingGrammar = false) }
            saveAttempt(ex, finalResult)
        }
    }

    /**
     * "Takrorlang" natijasini umumiy [SpeechResult] shakliga o'tkazadi — shunda
     * progress saqlash, o'qituvchi paneli va gamifikatsiya o'zgarishsiz ishlaydi.
     * Aniq o'qilgan so'zlar "kalit so'z" o'rnida saqlanadi: qamrov ustuni
     * o'qish aniqligini ko'rsatadi.
     */
    private fun readAsSpeechResult(
        read: ReadAloudResult,
        transcript: String,
        durationSec: Int,
    ): SpeechResult {
        val spoken = transcript.split(Regex("\\s+")).filter { it.isNotBlank() }
        return SpeechResult(
            transcript = transcript,
            wordCount = spoken.size,
            uniqueWordCount = spoken.map { it.lowercase() }.toSet().size,
            durationSec = durationSec,
            wordsPerMinute = spoken.size * 60 / durationSec.coerceAtLeast(1),
            matchedKeywords = read.words.filter { it.status == WordStatus.CORRECT }.map { it.word },
            totalKeywords = read.targetCount,
            overallScore = read.accuracy,
            feedback = read.tips.map { it.detail },
            tips = read.tips,
        )
    }

    private fun saveAttempt(ex: Exercise?, result: SpeechResult) {
        if (ex == null || result.wordCount == 0) return
        viewModelScope.launch {
            try {
                progressRepository.saveAttempt(
                    moduleId = moduleId,
                    exerciseId = ex.id,
                    exerciseTitle = ex.title,
                    result = result,
                    timestamp = System.currentTimeMillis(),
                )
            } catch (_: Exception) {
                // progress saqlash muvaffaqiyatsiz bo'lsa ham natija ko'rsatiladi
            }
        }
    }

    override fun onCleared() {
        timerJob?.cancel()
        recognizer.release()
        speaker.shutdown()
        super.onCleared()
    }
}
