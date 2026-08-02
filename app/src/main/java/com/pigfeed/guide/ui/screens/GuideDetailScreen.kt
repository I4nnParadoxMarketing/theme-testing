package com.pigfeed.guide.ui.screens

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
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.pigfeed.guide.ui.components.InfoPanel
import com.pigfeed.guide.ui.components.MetricTile
import com.pigfeed.guide.ui.components.PigFeedTopBar
import com.pigfeed.guide.ui.components.formatKg
import com.pigfeed.guide.ui.theme.AmberGrain
import com.pigfeed.guide.ui.theme.ForestDeep
import com.pigfeed.guide.ui.theme.ForestMid
import com.pigfeed.guide.ui.theme.Leaf
import com.pigfeed.guide.ui.viewmodel.GuideDetailViewModel

@Composable
fun GuideDetailScreen(
    viewModel: GuideDetailViewModel,
    onBack: () -> Unit
) {
    val guide by viewModel.guide.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
    ) {
        PigFeedTopBar(title = guide?.title ?: "Guide", onBack = onBack)
        val current = guide
        if (current == null) {
            Text("Loading guide…")
        } else {
        Text(
            text = current.stage.displayName,
            style = MaterialTheme.typography.labelLarge,
            color = AmberGrain
        )
        Text(
            text = current.stage.description,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MetricTile(
                label = "Daily / head",
                value = "${formatKg(current.dailyFeedKgMin)}–${formatKg(current.dailyFeedKgMax)} kg",
                accent = ForestMid,
                modifier = Modifier.weight(1f)
            )
            MetricTile(
                label = "Meals",
                value = "${current.mealsPerDay}/day",
                accent = Leaf,
                modifier = Modifier.weight(1f)
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            MetricTile(
                label = "Protein",
                value = "${formatKg(current.proteinPercentMin)}–${formatKg(current.proteinPercentMax)}%",
                accent = AmberGrain,
                modifier = Modifier.weight(1f)
            )
            MetricTile(
                label = "Energy",
                value = "${formatKg(current.energyMjPerKg)} MJ/kg",
                accent = ForestDeep,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(18.dp))
        InfoPanel {
            Text("Target weight", style = MaterialTheme.typography.titleMedium, color = ForestDeep)
            Text(
                "${formatKg(current.targetWeightMinKg)}–${formatKg(current.targetWeightMaxKg)} kg",
                style = MaterialTheme.typography.bodyLarge
            )
        }
        Spacer(modifier = Modifier.height(12.dp))
        InfoPanel {
            Text("Feeding tips", style = MaterialTheme.typography.titleMedium, color = ForestDeep)
            Text(current.tips, style = MaterialTheme.typography.bodyLarge)
        }
        Spacer(modifier = Modifier.height(12.dp))
        InfoPanel {
            Text("Feed mix notes", style = MaterialTheme.typography.titleMedium, color = ForestDeep)
            Text(current.feedMixNotes, style = MaterialTheme.typography.bodyLarge)
        }
        Spacer(modifier = Modifier.height(28.dp))
        }
    }
}
