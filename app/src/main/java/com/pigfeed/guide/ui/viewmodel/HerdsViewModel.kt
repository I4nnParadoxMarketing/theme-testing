package com.pigfeed.guide.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pigfeed.guide.data.entity.FeedingGuide
import com.pigfeed.guide.data.entity.FeedingLog
import com.pigfeed.guide.data.entity.FeedingSchedule
import com.pigfeed.guide.data.entity.Herd
import com.pigfeed.guide.data.entity.PigStage
import com.pigfeed.guide.data.repository.PigFeedRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class HerdsViewModel(private val repository: PigFeedRepository) : ViewModel() {
    val herds: StateFlow<List<Herd>> = repository.observeHerds()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun saveHerd(
        id: Long = 0,
        name: String,
        stage: PigStage,
        headCount: Int,
        averageWeightKg: Double,
        notes: String
    ) {
        viewModelScope.launch {
            repository.saveHerd(
                Herd(
                    id = id,
                    name = name.trim(),
                    stage = stage,
                    headCount = headCount,
                    averageWeightKg = averageWeightKg,
                    notes = notes.trim()
                )
            )
        }
    }

    fun deleteHerd(herd: Herd) {
        viewModelScope.launch { repository.deleteHerd(herd) }
    }

    companion object {
        fun factory(repository: PigFeedRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return HerdsViewModel(repository) as T
                }
            }
    }
}

data class HerdDetailUiState(
    val herd: Herd? = null,
    val schedules: List<FeedingSchedule> = emptyList(),
    val logs: List<FeedingLog> = emptyList(),
    val matchingGuide: FeedingGuide? = null,
    val recommendedMinKg: Double = 0.0,
    val recommendedMaxKg: Double = 0.0
)

class HerdDetailViewModel(
    private val repository: PigFeedRepository,
    herdId: Long
) : ViewModel() {
    val uiState: StateFlow<HerdDetailUiState> = combine(
        repository.observeHerd(herdId),
        repository.observeSchedulesForHerd(herdId),
        repository.observeLogsForHerd(herdId),
        repository.observeGuides()
    ) { herd, schedules, logs, guides ->
        val guide = herd?.let { h -> guides.firstOrNull { it.stage == h.stage } }
        val range = if (herd != null && guide != null) {
            repository.recommendedDailyTotalKg(guide, herd.headCount)
        } else 0.0 to 0.0
        HerdDetailUiState(
            herd = herd,
            schedules = schedules,
            logs = logs,
            matchingGuide = guide,
            recommendedMinKg = range.first,
            recommendedMaxKg = range.second
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), HerdDetailUiState())

    fun saveSchedule(schedule: FeedingSchedule) {
        viewModelScope.launch { repository.saveSchedule(schedule) }
    }

    fun deleteSchedule(schedule: FeedingSchedule) {
        viewModelScope.launch { repository.deleteSchedule(schedule) }
    }

    fun addLog(amountKg: Double, feedType: String, notes: String) {
        viewModelScope.launch {
            val herd = uiState.value.herd ?: return@launch
            repository.addLog(
                FeedingLog(
                    herdId = herd.id,
                    amountKg = amountKg,
                    feedType = feedType.trim(),
                    notes = notes.trim()
                )
            )
        }
    }

    fun deleteLog(log: FeedingLog) {
        viewModelScope.launch { repository.deleteLog(log) }
    }

    companion object {
        fun factory(repository: PigFeedRepository, herdId: Long): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return HerdDetailViewModel(repository, herdId) as T
                }
            }
    }
}
