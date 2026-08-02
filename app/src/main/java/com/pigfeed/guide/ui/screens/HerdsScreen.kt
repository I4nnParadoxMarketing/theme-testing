package com.pigfeed.guide.ui.screens

import androidx.compose.foundation.clickable
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
import com.pigfeed.guide.data.entity.PigStage
import com.pigfeed.guide.ui.components.InfoPanel
import com.pigfeed.guide.ui.components.NumberField
import com.pigfeed.guide.ui.components.PigFeedTopBar
import com.pigfeed.guide.ui.components.PrimaryActionButton
import com.pigfeed.guide.ui.components.formatKg
import com.pigfeed.guide.ui.theme.ForestDeep
import com.pigfeed.guide.ui.viewmodel.HerdsViewModel

@Composable
fun HerdsScreen(
    viewModel: HerdsViewModel,
    onOpenHerd: (Long) -> Unit
) {
    val herds by viewModel.herds.collectAsStateWithLifecycle()
    var showCreate by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<Herd?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            PigFeedTopBar(
                title = "Herds",
                actions = {
                    IconButton(onClick = { showCreate = true }) {
                        Icon(Icons.Filled.Add, contentDescription = "Add herd")
                    }
                }
            )
            Text(
                text = "Track batches by stage, weight, and head count. Open a herd to set meal times and log feedings.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            if (herds.isEmpty()) {
                PrimaryActionButton(text = "Create herd", onClick = { showCreate = true })
                Spacer(modifier = Modifier.height(8.dp))
            }
        }

        items(herds, key = { it.id }) { herd ->
            InfoPanel(modifier = Modifier.clickable { onOpenHerd(herd.id) }) {
                Text(herd.name, style = MaterialTheme.typography.titleLarge, color = ForestDeep)
                Text(
                    "${herd.stage.displayName} · ${herd.headCount} head · avg ${formatKg(herd.averageWeightKg)} kg",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (herd.notes.isNotBlank()) {
                    Text(herd.notes, style = MaterialTheme.typography.bodySmall)
                }
                TextButton(onClick = { editing = herd }) { Text("Edit") }
                TextButton(onClick = { viewModel.deleteHerd(herd) }) { Text("Delete") }
            }
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }

    if (showCreate || editing != null) {
        HerdEditorDialog(
            initial = editing,
            onDismiss = {
                showCreate = false
                editing = null
            },
            onSave = { name, stage, heads, weight, notes, id ->
                viewModel.saveHerd(id, name, stage, heads, weight, notes)
                showCreate = false
                editing = null
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HerdEditorDialog(
    initial: Herd?,
    onDismiss: () -> Unit,
    onSave: (String, PigStage, Int, Double, String, Long) -> Unit
) {
    var name by remember { mutableStateOf(initial?.name ?: "") }
    var stage by remember { mutableStateOf(initial?.stage ?: PigStage.GROWER) }
    var expanded by remember { mutableStateOf(false) }
    var heads by remember { mutableStateOf((initial?.headCount ?: 20).toString()) }
    var weight by remember { mutableStateOf((initial?.averageWeightKg ?: 40.0).toString()) }
    var notes by remember { mutableStateOf(initial?.notes ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial == null) "New herd" else "Edit herd") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Herd name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = it }
                ) {
                    OutlinedTextField(
                        value = stage.displayName,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Stage") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        PigStage.entries.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option.displayName) },
                                onClick = {
                                    stage = option
                                    expanded = false
                                }
                            )
                        }
                    }
                }
                NumberField(heads, { heads = it }, "Head count")
                NumberField(weight, { weight = it }, "Average weight (kg)")
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
                        name.ifBlank { "Herd" },
                        stage,
                        heads.toIntOrNull() ?: 1,
                        weight.toDoubleOrNull() ?: 0.0,
                        notes,
                        initial?.id ?: 0L
                    )
                }
            ) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
