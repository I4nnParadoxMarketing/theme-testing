package com.pigfeed.guide.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "feeding_guides")
data class FeedingGuide(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val stage: PigStage,
    val title: String,
    val dailyFeedKgMin: Double,
    val dailyFeedKgMax: Double,
    val mealsPerDay: Int,
    val proteinPercentMin: Double,
    val proteinPercentMax: Double,
    val energyMjPerKg: Double,
    val targetWeightMinKg: Double,
    val targetWeightMaxKg: Double,
    val tips: String,
    val feedMixNotes: String,
    val isCustom: Boolean = false
)
