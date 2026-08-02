package com.pigfeed.guide.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.pigfeed.guide.data.entity.FeedingGuide
import com.pigfeed.guide.data.entity.PigStage
import com.pigfeed.guide.data.repository.PigFeedRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlin.math.round

data class CalculatorUiState(
    val stage: PigStage = PigStage.GROWER,
    val headCount: Int = 10,
    val days: Int = 7,
    val guide: FeedingGuide? = null,
    val dailyMinKg: Double = 0.0,
    val dailyMaxKg: Double = 0.0,
    val periodMinKg: Double = 0.0,
    val periodMaxKg: Double = 0.0,
    val bags50kgMin: Double = 0.0,
    val bags50kgMax: Double = 0.0
)

class CalculatorViewModel(repository: PigFeedRepository) : ViewModel() {
    private val stage = MutableStateFlow(PigStage.GROWER)
    private val headCount = MutableStateFlow(10)
    private val days = MutableStateFlow(7)

    val uiState: StateFlow<CalculatorUiState> = combine(
        repository.observeGuides(),
        stage,
        headCount,
        days
    ) { guides, selectedStage, heads, periodDays ->
        val guide = guides.firstOrNull { it.stage == selectedStage }
        val dailyMin = (guide?.dailyFeedKgMin ?: 0.0) * heads
        val dailyMax = (guide?.dailyFeedKgMax ?: 0.0) * heads
        val periodMin = dailyMin * periodDays
        val periodMax = dailyMax * periodDays
        CalculatorUiState(
            stage = selectedStage,
            headCount = heads,
            days = periodDays,
            guide = guide,
            dailyMinKg = round1(dailyMin),
            dailyMaxKg = round1(dailyMax),
            periodMinKg = round1(periodMin),
            periodMaxKg = round1(periodMax),
            bags50kgMin = round1(periodMin / 50.0),
            bags50kgMax = round1(periodMax / 50.0)
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), CalculatorUiState())

    fun setStage(value: PigStage) {
        stage.value = value
    }

    fun setHeadCount(value: Int) {
        headCount.value = value.coerceIn(1, 10_000)
    }

    fun setDays(value: Int) {
        days.value = value.coerceIn(1, 365)
    }

    private fun round1(value: Double): Double = round(value * 10.0) / 10.0

    companion object {
        fun factory(repository: PigFeedRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return CalculatorViewModel(repository) as T
                }
            }
    }
}
