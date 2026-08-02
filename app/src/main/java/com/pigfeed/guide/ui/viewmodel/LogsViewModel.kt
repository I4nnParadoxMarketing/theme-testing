package com.pigfeed.guide.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pigfeed.guide.data.entity.FeedingLog
import com.pigfeed.guide.data.entity.Herd
import com.pigfeed.guide.data.repository.PigFeedRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class LogsUiState(
    val logs: List<FeedingLog> = emptyList(),
    val herds: List<Herd> = emptyList(),
    val todayTotalKg: Double = 0.0
)

class LogsViewModel(private val repository: PigFeedRepository) : ViewModel() {
    val uiState: StateFlow<LogsUiState> = combine(
        repository.observeLogs(),
        repository.observeHerds(),
        repository.observeTodayTotalKg()
    ) { logs, herds, todayTotal ->
        LogsUiState(logs = logs, herds = herds, todayTotalKg = todayTotal)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), LogsUiState())

    fun addLog(herdId: Long, amountKg: Double, feedType: String, notes: String) {
        viewModelScope.launch {
            repository.addLog(
                FeedingLog(
                    herdId = herdId,
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
        fun factory(repository: PigFeedRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return LogsViewModel(repository) as T
                }
            }
    }
}
