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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.pigfeed.guide.data.entity.FeedingSchedule
import com.pigfeed.guide.ui.components.InfoPanel
import com.pigfeed.guide.ui.components.MetricTile
import com.pigfeed.guide.ui.components.NumberField
import com.pigfeed.guide.ui.components.PigFeedTopBar
import com.pigfeed.guide.ui.components.PrimaryActionButton
import com.pigfeed.guide.ui.components.SectionHeader
import com.pigfeed.guide.ui.components.formatKg
import com.pigfeed.guide.ui.components.formatTime
import com.pigfeed.guide.ui.theme.AmberGrain
import com.pigfeed.guide.ui.theme.ForestDeep
import com.pigfeed.guide.ui.theme.ForestMid
import com.pigfeed.guide.ui.theme.Leaf
import com.pigfeed.guide.ui.viewmodel.HerdDetailViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HerdDetailScreen(
    viewModel: HerdDetailViewModel,
    onBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var showScheduleDialog by remember { mutableStateOf(false) }
    var showLogDialog by remember { mutableStateOf(false) }
    val dateFormat = remember { SimpleDateFormat("MMM d · h:mm a", Locale.getDefault()) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
    ) {
        val herd = state.herd
        PigFeedTopBar(title = herd?.name ?: "Herd", onBack = onBack)

        if (herd == null) {
            Text("Loading herd…")
        } else {
            Text(
                "${herd.stage.displayName} · ${herd.headCount} head · avg ${formatKg(herd.averageWeightKg)} kg",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (herd.notes.isNotBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(herd.notes, style = MaterialTheme.typography.bodySmall)
            }

            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                MetricTile(
                    label = "Recommended / day",
                    value = "${formatKg(state.recommendedMinKg)}–${formatKg(state.recommendedMaxKg)} kg",
                    accent = ForestMid,
                    modifier = Modifier.weight(1f)
                )
                MetricTile(
                    label = "Guide",
                    value = state.matchingGuide?.title ?: "—",
                    accent = AmberGrain,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
            SectionHeader(title = "Meal schedule", subtitle = "Set feeding times for this herd")
            Spacer(modifier = Modifier.height(10.dp))
            state.schedules.forEach { schedule ->
                InfoPanel(modifier = Modifier.padding(bottom = 8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(schedule.mealLabel, style = MaterialTheme.typography.titleMedium, color = ForestDeep)
                            Text(
                                "${formatTime(schedule.timeHour, schedule.timeMinute)} · " +
                                    "${formatKg(schedule.amountKgPerHead)} kg/head · ${schedule.feedType}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Switch(
                            checked = schedule.enabled,
                            onCheckedChange = {
                                viewModel.saveSchedule(schedule.copy(enabled = it))
                            }
                        )
                    }
                    TextButton(onClick = { viewModel.deleteSchedule(schedule) }) {
                        Text("Remove")
                    }
                }
            }
            PrimaryActionButton(text = "Add meal time", onClick = { showScheduleDialog = true })

            Spacer(modifier = Modifier.height(24.dp))
            SectionHeader(title = "Feeding log", subtitle = "Record what was actually fed")
            Spacer(modifier = Modifier.height(10.dp))
            PrimaryActionButton(text = "Log feeding", onClick = { showLogDialog = true })
            Spacer(modifier = Modifier.height(10.dp))
            state.logs.take(20).forEach { log ->
                InfoPanel(modifier = Modifier.padding(bottom = 8.dp)) {
                    Text(
                        "${formatKg(log.amountKg)} kg · ${log.feedType}",
                        style = MaterialTheme.typography.titleMedium,
                        color = ForestDeep
                    )
                    Text(
                        dateFormat.format(Date(log.fedAt)),
                        style = MaterialTheme.typography.bodySmall,
                        color = Leaf
                    )
                    if (log.notes.isNotBlank()) {
                        Text(log.notes, style = MaterialTheme.typography.bodyMedium)
                    }
                    TextButton(onClick = { viewModel.deleteLog(log) }) { Text("Delete") }
                }
            }
            Spacer(modifier = Modifier.height(28.dp))
        }
    }

    if (showScheduleDialog && state.herd != null) {
        ScheduleDialog(
            herdId = state.herd!!.id,
            onDismiss = { showScheduleDialog = false },
            onSave = {
                viewModel.saveSchedule(it)
                showScheduleDialog = false
            }
        )
    }

    if (showLogDialog) {
        LogDialog(
            onDismiss = { showLogDialog = false },
            onSave = { amount, feedType, notes ->
                viewModel.addLog(amount, feedType, notes)
                showLogDialog = false
            }
        )
    }
}

@Composable
private fun ScheduleDialog(
    herdId: Long,
    onDismiss: () -> Unit,
    onSave: (FeedingSchedule) -> Unit
) {
    var label by remember { mutableStateOf("Morning") }
    var hour by remember { mutableStateOf("7") }
    var minute by remember { mutableStateOf("0") }
    var amount by remember { mutableStateOf("1.0") }
    var feedType by remember { mutableStateOf("Grower mash") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add meal time") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = label,
                    onValueChange = { label = it },
                    label = { Text("Meal label") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                NumberField(hour, { hour = it }, "Hour (0–23)")
                NumberField(minute, { minute = it }, "Minute (0–59)")
                NumberField(amount, { amount = it }, "Kg per head")
                OutlinedTextField(
                    value = feedType,
                    onValueChange = { feedType = it },
                    label = { Text("Feed type") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(
                        FeedingSchedule(
                            herdId = herdId,
                            mealLabel = label.ifBlank { "Meal" },
                            timeHour = (hour.toIntOrNull() ?: 7).coerceIn(0, 23),
                            timeMinute = (minute.toIntOrNull() ?: 0).coerceIn(0, 59),
                            amountKgPerHead = amount.toDoubleOrNull() ?: 0.0,
                            feedType = feedType.ifBlank { "Feed" }
                        )
                    )
                }
            ) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun LogDialog(
    onDismiss: () -> Unit,
    onSave: (Double, String, String) -> Unit
) {
    var amount by remember { mutableStateOf("") }
    var feedType by remember { mutableStateOf("Complete feed") }
    var notes by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Log feeding") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                NumberField(amount, { amount = it }, "Total amount (kg)")
                OutlinedTextField(
                    value = feedType,
                    onValueChange = { feedType = it },
                    label = { Text("Feed type") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(
                        amount.toDoubleOrNull() ?: 0.0,
                        feedType,
                        notes
                    )
                }
            ) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
