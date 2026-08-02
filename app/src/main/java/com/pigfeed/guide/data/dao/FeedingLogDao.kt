package com.pigfeed.guide.data.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.pigfeed.guide.data.entity.FeedingLog
import kotlinx.coroutines.flow.Flow

@Dao
interface FeedingLogDao {
    @Query("SELECT * FROM feeding_logs ORDER BY fedAt DESC")
    fun observeAll(): Flow<List<FeedingLog>>

    @Query("SELECT * FROM feeding_logs WHERE herdId = :herdId ORDER BY fedAt DESC")
    fun observeByHerd(herdId: Long): Flow<List<FeedingLog>>

    @Query(
        """
        SELECT * FROM feeding_logs
        WHERE fedAt >= :startOfDay AND fedAt < :endOfDay
        ORDER BY fedAt DESC
        """
    )
    fun observeForDay(startOfDay: Long, endOfDay: Long): Flow<List<FeedingLog>>

    @Query(
        """
        SELECT COALESCE(SUM(amountKg), 0) FROM feeding_logs
        WHERE fedAt >= :startOfDay AND fedAt < :endOfDay
        """
    )
    fun observeTotalForDay(startOfDay: Long, endOfDay: Long): Flow<Double>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(log: FeedingLog): Long

    @Delete
    suspend fun delete(log: FeedingLog)
}
