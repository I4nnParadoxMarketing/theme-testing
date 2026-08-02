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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import com.pigfeed.guide.data.entity.FeedingGuide
import com.pigfeed.guide.data.entity.PigStage
import com.pigfeed.guide.ui.components.InfoPanel
import com.pigfeed.guide.ui.components.NumberField
import com.pigfeed.guide.ui.components.PigFeedTopBar
import com.pigfeed.guide.ui.components.StageChipRow
import com.pigfeed.guide.ui.components.formatKg
import com.pigfeed.guide.ui.theme.ForestDeep
import com.pigfeed.guide.ui.viewmodel.GuidesViewModel

@Composable
fun GuidesScreen(
    viewModel: GuidesViewModel,
    onOpenGuide: (Long) -> Unit
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var showCreate by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            PigFeedTopBar(
                title = "Feeding guides",
                actions = {
                    IconButton(onClick = { showCreate = true }) {
                        Icon(Icons.Filled.Add, contentDescription = "Add custom guide")
                    }
                }
            )
            Text(
                text = "Reference rations by growth and breeding stage. Create custom guides for your farm.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(12.dp))
            StageChipRow(
                selected = state.selectedStage,
                onSelect = viewModel::selectStage
            )
            Spacer(modifier = Modifier.height(8.dp))
        }

        items(state.guides, key = { it.id }) { guide ->
            InfoPanel(modifier = Modifier.clickable { onOpenGuide(guide.id) }) {
                Text(guide.title, style = MaterialTheme.typography.titleLarge, color = ForestDeep)
                Text(
                    guide.stage.displayName,
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.secondary
                )
                Text(
                    "${formatKg(guide.dailyFeedKgMin)}–${formatKg(guide.dailyFeedKgMax)} kg/head · " +
                        "${formatKg(guide.proteinPercentMin)}–${formatKg(guide.proteinPercentMax)}% protein · " +
                        "${guide.mealsPerDay} meals/day",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (guide.isCustom) {
                    TextButton(onClick = { viewModel.deleteGuide(guide.id) }) {
                        Text("Delete custom guide")
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }

    if (showCreate) {
        CreateGuideDialog(
            onDismiss = { showCreate = false },
            onSave = {
                viewModel.saveGuide(it)
                showCreate = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CreateGuideDialog(
    onDismiss: () -> Unit,
    onSave: (FeedingGuide) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var stage by remember { mutableStateOf(PigStage.GROWER) }
    var stageExpanded by remember { mutableStateOf(false) }
    var minKg by remember { mutableStateOf("1.5") }
    var maxKg by remember { mutableStateOf("2.2") }
    var meals by remember { mutableStateOf("2") }
    var proteinMin by remember { mutableStateOf("16") }
    var proteinMax by remember { mutableStateOf("18") }
    var energy by remember { mutableStateOf("13") }
    var weightMin by remember { mutableStateOf("25") }
    var weightMax by remember { mutableStateOf("60") }
    var tips by remember { mutableStateOf("") }
    var mixNotes by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Custom feeding guide") },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Title") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                ExposedDropdownMenuBox(
                    expanded = stageExpanded,
                    onExpandedChange = { stageExpanded = it }
                ) {
                    OutlinedTextField(
                        value = stage.displayName,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Stage") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(stageExpanded) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth()
                    )
                    ExposedDropdownMenu(
                        expanded = stageExpanded,
                        onDismissRequest = { stageExpanded = false }
                    ) {
                        PigStage.entries.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option.displayName) },
                                onClick = {
                                    stage = option
                                    stageExpanded = false
                                }
                            )
                        }
                    }
                }
                NumberField(minKg, { minKg = it }, "Daily kg min / head")
                NumberField(maxKg, { maxKg = it }, "Daily kg max / head")
                NumberField(meals, { meals = it }, "Meals per day")
                NumberField(proteinMin, { proteinMin = it }, "Protein % min")
                NumberField(proteinMax, { proteinMax = it }, "Protein % max")
                NumberField(energy, { energy = it }, "Energy MJ/kg")
                NumberField(weightMin, { weightMin = it }, "Weight min kg")
                NumberField(weightMax, { weightMax = it }, "Weight max kg")
                OutlinedTextField(
                    value = tips,
                    onValueChange = { tips = it },
                    label = { Text("Tips") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = mixNotes,
                    onValueChange = { mixNotes = it },
                    label = { Text("Feed mix notes") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onSave(
                        FeedingGuide(
                            stage = stage,
                            title = title.ifBlank { "${stage.displayName} custom" },
                            dailyFeedKgMin = minKg.toDoubleOrNull() ?: 0.0,
                            dailyFeedKgMax = maxKg.toDoubleOrNull() ?: 0.0,
                            mealsPerDay = meals.toIntOrNull() ?: 2,
                            proteinPercentMin = proteinMin.toDoubleOrNull() ?: 0.0,
                            proteinPercentMax = proteinMax.toDoubleOrNull() ?: 0.0,
                            energyMjPerKg = energy.toDoubleOrNull() ?: 0.0,
                            targetWeightMinKg = weightMin.toDoubleOrNull() ?: 0.0,
                            targetWeightMaxKg = weightMax.toDoubleOrNull() ?: 0.0,
                            tips = tips,
                            feedMixNotes = mixNotes,
                            isCustom = true
                        )
                    )
                }
            ) { Text("Save") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
