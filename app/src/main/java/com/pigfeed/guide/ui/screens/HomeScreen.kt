package com.pigfeed.guide.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.pigfeed.guide.ui.components.BrandMark
import com.pigfeed.guide.ui.components.FadeInItem
import com.pigfeed.guide.ui.components.InfoPanel
import com.pigfeed.guide.ui.components.MetricTile
import com.pigfeed.guide.ui.components.PrimaryActionButton
import com.pigfeed.guide.ui.components.SectionHeader
import com.pigfeed.guide.ui.components.formatKg
import com.pigfeed.guide.ui.components.formatTime
import com.pigfeed.guide.ui.theme.AmberGrain
import com.pigfeed.guide.ui.theme.ForestDeep
import com.pigfeed.guide.ui.theme.ForestMid
import com.pigfeed.guide.ui.theme.Leaf
import com.pigfeed.guide.ui.theme.MistSage
import com.pigfeed.guide.ui.theme.SoftMoss
import com.pigfeed.guide.ui.viewmodel.HomeViewModel

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onOpenGuides: () -> Unit,
    onOpenHerds: () -> Unit,
    onOpenGuide: (Long) -> Unit,
    onOpenHerd: (Long) -> Unit,
    onOpenCalculator: () -> Unit
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val heroAlpha = remember { Animatable(0f) }
    val heroOffset = remember { Animatable(24f) }

    LaunchedEffect(Unit) {
        heroAlpha.animateTo(1f, tween(700))
        heroOffset.animateTo(0f, tween(700))
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        ForestDeep.copy(alpha = 0.12f),
                        MistSage,
                        SoftMoss.copy(alpha = 0.5f)
                    )
                )
            )
            .verticalScroll(rememberScrollState())
            .padding(20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .graphicsLayer { translationY = heroOffset.value }
                .alpha(heroAlpha.value)
        ) {
            BrandMark()
            Spacer(modifier = Modifier.height(18.dp))
            Text(
                text = "Know what to feed, when, and how much.",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(18.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                PrimaryActionButton(
                    text = "Browse guides",
                    onClick = onOpenGuides,
                    modifier = Modifier.weight(1f)
                )
                TextButton(onClick = onOpenCalculator) {
                    Text("Feed calc", color = AmberGrain)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        FadeInItem {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricTile(
                    label = "Herds",
                    value = state.herdCount.toString(),
                    accent = ForestMid,
                    modifier = Modifier.weight(1f)
                )
                MetricTile(
                    label = "Head count",
                    value = state.totalHeadCount.toString(),
                    accent = Leaf,
                    modifier = Modifier.weight(1f)
                )
                MetricTile(
                    label = "Fed today",
                    value = "${formatKg(state.todayFeedKg)} kg",
                    accent = AmberGrain,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        Spacer(modifier = Modifier.height(28.dp))

        FadeInItem {
            SectionHeader(
                title = "Stage guides",
                subtitle = "Built-in rations by production phase"
            )
            Spacer(modifier = Modifier.height(12.dp))
            state.guides.take(3).forEach { guide ->
                InfoPanel(
                    modifier = Modifier
                        .padding(bottom = 10.dp)
                        .clickable { onOpenGuide(guide.id) }
                ) {
                    Text(
                        text = guide.title,
                        style = MaterialTheme.typography.titleLarge,
                        color = ForestDeep
                    )
                    Text(
                        text = "${guide.stage.displayName} · ${formatKg(guide.dailyFeedKgMin)}–${formatKg(guide.dailyFeedKgMax)} kg/head/day",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            TextButton(onClick = onOpenGuides) {
                Text("See all guides")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        FadeInItem {
            SectionHeader(
                title = "Your herds",
                subtitle = if (state.herds.isEmpty()) "Add a batch to start scheduling and logging"
                else "Tap a herd to manage meals and logs"
            )
            Spacer(modifier = Modifier.height(12.dp))
            if (state.herds.isEmpty()) {
                PrimaryActionButton(text = "Add first herd", onClick = onOpenHerds)
            } else {
                state.herds.take(3).forEach { herd ->
                    InfoPanel(
                        modifier = Modifier
                            .padding(bottom = 10.dp)
                            .clickable { onOpenHerd(herd.id) }
                    ) {
                        Text(herd.name, style = MaterialTheme.typography.titleLarge, color = ForestDeep)
                        Text(
                            "${herd.headCount} head · ${herd.stage.displayName} · avg ${formatKg(herd.averageWeightKg)} kg",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                TextButton(onClick = onOpenHerds) { Text("Manage herds") }
            }
        }

        if (state.upcomingSchedules.isNotEmpty()) {
            Spacer(modifier = Modifier.height(16.dp))
            FadeInItem {
                SectionHeader(title = "Meal schedule", subtitle = "Enabled feeding times")
                Spacer(modifier = Modifier.height(12.dp))
                state.upcomingSchedules.forEach { schedule ->
                    val herdName = state.herds.firstOrNull { it.id == schedule.herdId }?.name
                        ?: "Herd #${schedule.herdId}"
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(ForestDeep.copy(alpha = 0.08f))
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(schedule.mealLabel, style = MaterialTheme.typography.titleMedium)
                            Text(
                                "$herdName · ${schedule.feedType}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Text(
                            formatTime(schedule.timeHour, schedule.timeMinute),
                            style = MaterialTheme.typography.titleMedium,
                            color = AmberGrain
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(
                    Brush.horizontalGradient(listOf(ForestDeep, Leaf, AmberGrain))
                )
        )
        Spacer(modifier = Modifier.height(12.dp))
    }
}
