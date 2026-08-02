package com.pigfeed.guide.data.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "feeding_schedules",
    foreignKeys = [
        ForeignKey(
            entity = Herd::class,
            parentColumns = ["id"],
            childColumns = ["herdId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("herdId")]
)
data class FeedingSchedule(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val herdId: Long,
    val mealLabel: String,
    val timeHour: Int,
    val timeMinute: Int,
    val amountKgPerHead: Double,
    val feedType: String,
    val enabled: Boolean = true
)
