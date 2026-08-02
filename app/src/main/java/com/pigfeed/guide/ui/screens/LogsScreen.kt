package com.pigfeed.guide.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.pigfeed.guide.data.entity.Herd
import com.pigfeed.guide.ui.components.InfoPanel
import com.pigfeed.guide.ui.components.MetricTile
import com.pigfeed.guide.ui.components.NumberField
import com.pigfeed.guide.ui.components.PigFeedTopBar
import com.pigfeed.guide.ui.components.PrimaryActionButton
import com.pigfeed.guide.ui.components.formatKg
import com.pigfeed.guide.ui.theme.AmberGrain
import com.pigfeed.guide.ui.theme.ForestDeep
import com.pigfeed.guide.ui.viewmodel.LogsViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun LogsScreen(viewModel: LogsViewModel) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var showCreate by remember { mutableStateOf(false) }
    val dateFormat = remember { SimpleDateFormat("EEE, MMM d · h:mm a", Locale.getDefault()) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            PigFeedTopBar(
                title = "Feeding logs",
                actions = {
                    IconButton(
                        onClick = { showCreate = true },
                        enabled = state.herds.isNotEmpty()
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = "Add log")
                    }
                }
            )
            MetricTile(
                label = "Total fed today",
                value = "${formatKg(state.todayTotalKg)} kg",
                accent = AmberGrain,
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            if (state.herds.isEmpty()) {
                Text(
                    "Create a herd first, then log feedings here.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                PrimaryActionButton(text = "Log feeding", onClick = { showCreate = true })
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        items(state.logs, key = { it.id }) { log ->
            val herdName = state.herds.firstOrNull { it.id == log.herdId }?.name
                ?: "Herd #${log.herdId}"
            InfoPanel {
                Text(
                    "${formatKg(log.amountKg)} kg · ${log.feedType}",
                    style = MaterialTheme.typography.titleMedium,
                    color = ForestDeep
                )
                Text(
                    "$herdName · ${dateFormat.format(Date(log.fedAt))}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (log.notes.isNotBlank()) {
                    Text(log.notes, style = MaterialTheme.typography.bodySmall)
                }
                TextButton(onClick = { viewModel.deleteLog(log) }) { Text("Delete") }
            }
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }

    if (showCreate && state.herds.isNotEmpty()) {
        QuickLogDialog(
            herds = state.herds,
            onDismiss = { showCreate = false },
            onSave = { herdId, amount, feedType, notes ->
                viewModel.addLog(herdId, amount, feedType, notes)
                showCreate = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun QuickLogDialog(
    herds: List<Herd>,
    onDismiss: () -> Unit,
    onSave: (Long, Double, String, String) -> Unit
) {
    var selectedHerd by remember { mutableStateOf(herds.first()) }
    var expanded by remember { mutableStateOf(false) }
    var amount by remember { mutableStateOf("") }
    var feedType by remember { mutableStateOf("Complete feed") }
    var notes by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Log feeding") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = it }
                ) {
                    OutlinedTextField(
                        value = selectedHerd.name,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Herd") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        herds.forEach { herd ->
                            DropdownMenuItem(
                                text = { Text(herd.name) },
                                onClick = {
                                    selectedHerd = herd
                                    expanded = false
                                }
                            )
                        }
                    }
                }
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
                        selectedHerd.id,
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
