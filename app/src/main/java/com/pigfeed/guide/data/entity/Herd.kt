package com.pigfeed.guide.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "herds")
data class Herd(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val stage: PigStage,
    val headCount: Int,
    val averageWeightKg: Double,
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis()
)
