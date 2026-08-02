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
import kotlinx.coroutines.launch

data class GuidesUiState(
    val guides: List<FeedingGuide> = emptyList(),
    val selectedStage: PigStage? = null
)

class GuidesViewModel(private val repository: PigFeedRepository) : ViewModel() {
    private val selectedStage = MutableStateFlow<PigStage?>(null)

    val uiState: StateFlow<GuidesUiState> = combine(
        repository.observeGuides(),
        selectedStage
    ) { guides, stage ->
        GuidesUiState(
            guides = if (stage == null) guides else guides.filter { it.stage == stage },
            selectedStage = stage
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), GuidesUiState())

    fun selectStage(stage: PigStage?) {
        selectedStage.value = stage
    }

    fun saveGuide(guide: FeedingGuide) {
        viewModelScope.launch { repository.saveGuide(guide) }
    }

    fun deleteGuide(id: Long) {
        viewModelScope.launch { repository.deleteCustomGuide(id) }
    }

    companion object {
        fun factory(repository: PigFeedRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return GuidesViewModel(repository) as T
                }
            }
    }
}

class GuideDetailViewModel(
    private val repository: PigFeedRepository,
    guideId: Long
) : ViewModel() {
    val guide: StateFlow<FeedingGuide?> = repository.observeGuide(guideId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    companion object {
        fun factory(repository: PigFeedRepository, guideId: Long): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return GuideDetailViewModel(repository, guideId) as T
                }
            }
    }
}
