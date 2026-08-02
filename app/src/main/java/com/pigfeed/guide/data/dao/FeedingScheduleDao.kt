package com.pigfeed.guide.data.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.pigfeed.guide.data.entity.FeedingSchedule
import kotlinx.coroutines.flow.Flow

@Dao
interface FeedingScheduleDao {
    @Query("SELECT * FROM feeding_schedules ORDER BY timeHour ASC, timeMinute ASC")
    fun observeAll(): Flow<List<FeedingSchedule>>

    @Query("SELECT * FROM feeding_schedules WHERE herdId = :herdId ORDER BY timeHour ASC, timeMinute ASC")
    fun observeByHerd(herdId: Long): Flow<List<FeedingSchedule>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(schedule: FeedingSchedule): Long

    @Update
    suspend fun update(schedule: FeedingSchedule)

    @Delete
    suspend fun delete(schedule: FeedingSchedule)
}
