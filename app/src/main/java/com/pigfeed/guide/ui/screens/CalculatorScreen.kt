package com.pigfeed.guide.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.pigfeed.guide.ui.components.InfoPanel
import com.pigfeed.guide.ui.components.MetricTile
import com.pigfeed.guide.ui.components.PigFeedTopBar
import com.pigfeed.guide.ui.components.StageChipRow
import com.pigfeed.guide.ui.components.formatKg
import com.pigfeed.guide.ui.theme.AmberGrain
import com.pigfeed.guide.ui.theme.ForestDeep
import com.pigfeed.guide.ui.theme.ForestMid
import com.pigfeed.guide.ui.theme.Leaf
import com.pigfeed.guide.ui.viewmodel.CalculatorViewModel

@Composable
fun CalculatorScreen(viewModel: CalculatorViewModel) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
    ) {
        PigFeedTopBar(title = "Feed calculator")
        Text(
            text = "Estimate daily and period feed needs from stage guides and head count.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(14.dp))

        StageChipRow(
            selected = state.stage,
            includeAll = false,
            onSelect = { selected -> if (selected != null) viewModel.setStage(selected) }
        )

        Spacer(modifier = Modifier.height(18.dp))
        Text("Head count: ${state.headCount}", style = MaterialTheme.typography.titleMedium)
        Slider(
            value = state.headCount.toFloat(),
            onValueChange = { viewModel.setHeadCount(it.toInt()) },
            valueRange = 1f..500f
        )

        Text("Planning days: ${state.days}", style = MaterialTheme.typography.titleMedium)
        Slider(
            value = state.days.toFloat(),
            onValueChange = { viewModel.setDays(it.toInt()) },
            valueRange = 1f..90f
        )

        Spacer(modifier = Modifier.height(8.dp))
        AnimatedContent(
            targetState = state,
            transitionSpec = { fadeIn() togetherWith fadeOut() },
            label = "calc-results"
        ) { current ->
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricTile(
                        label = "Daily total",
                        value = "${formatKg(current.dailyMinKg)}–${formatKg(current.dailyMaxKg)} kg",
                        accent = ForestMid,
                        modifier = Modifier.weight(1f)
                    )
                    MetricTile(
                        label = "${current.days}-day total",
                        value = "${formatKg(current.periodMinKg)}–${formatKg(current.periodMaxKg)} kg",
                        accent = Leaf,
                        modifier = Modifier.weight(1f)
                    )
                }
                MetricTile(
                    label = "Approx. 50 kg bags",
                    value = "${formatKg(current.bags50kgMin)}–${formatKg(current.bags50kgMax)} bags",
                    accent = AmberGrain,
                    modifier = Modifier.fillMaxWidth()
                )
                InfoPanel {
                    Text("Based on guide", style = MaterialTheme.typography.titleMedium, color = ForestDeep)
                    Text(
                        current.guide?.title ?: "No guide for this stage",
                        style = MaterialTheme.typography.bodyLarge
                    )
                    current.guide?.let { guide ->
                        Text(
                            "${formatKg(guide.dailyFeedKgMin)}–${formatKg(guide.dailyFeedKgMax)} kg/head/day · " +
                                "${formatKg(guide.proteinPercentMin)}–${formatKg(guide.proteinPercentMax)}% protein",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
        Spacer(modifier = Modifier.height(28.dp))
    }
}
