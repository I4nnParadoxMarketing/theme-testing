package com.pigfeed.guide.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pigfeed.guide.data.entity.FeedingGuide
import com.pigfeed.guide.data.entity.FeedingLog
import com.pigfeed.guide.data.entity.FeedingSchedule
import com.pigfeed.guide.data.entity.Herd
import com.pigfeed.guide.data.repository.PigFeedRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

data class HomeUiState(
    val herdCount: Int = 0,
    val totalHeadCount: Int = 0,
    val todayFeedKg: Double = 0.0,
    val guides: List<FeedingGuide> = emptyList(),
    val herds: List<Herd> = emptyList(),
    val todayLogs: List<FeedingLog> = emptyList(),
    val upcomingSchedules: List<FeedingSchedule> = emptyList()
)

class HomeViewModel(repository: PigFeedRepository) : ViewModel() {
    private val summary = combine(
        repository.observeHerdCount(),
        repository.observeTotalHeadCount(),
        repository.observeTodayTotalKg()
    ) { herdCount, totalHeads, todayKg ->
        Triple(herdCount, totalHeads, todayKg)
    }

    private val content = combine(
        repository.observeGuides(),
        repository.observeHerds(),
        repository.observeTodayLogs(),
        repository.observeSchedules()
    ) { guides, herds, logs, schedules ->
        HomeContent(guides, herds, logs, schedules.filter { it.enabled }.take(4))
    }

    val uiState: StateFlow<HomeUiState> = combine(summary, content) { summaryData, contentData ->
        HomeUiState(
            herdCount = summaryData.first,
            totalHeadCount = summaryData.second,
            todayFeedKg = summaryData.third,
            guides = contentData.guides,
            herds = contentData.herds,
            todayLogs = contentData.todayLogs,
            upcomingSchedules = contentData.schedules
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), HomeUiState())

    private data class HomeContent(
        val guides: List<FeedingGuide>,
        val herds: List<Herd>,
        val todayLogs: List<FeedingLog>,
        val schedules: List<FeedingSchedule>
    )

    companion object {
        fun factory(repository: PigFeedRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return HomeViewModel(repository) as T
                }
            }
    }
}
