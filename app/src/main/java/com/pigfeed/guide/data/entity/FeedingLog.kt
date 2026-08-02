package com.pigfeed.guide.data.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "feeding_logs",
    foreignKeys = [
        ForeignKey(
            entity = Herd::class,
            parentColumns = ["id"],
            childColumns = ["herdId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("herdId"), Index("fedAt")]
)
data class FeedingLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val herdId: Long,
    val amountKg: Double,
    val feedType: String,
    val notes: String = "",
    val fedAt: Long = System.currentTimeMillis()
)
