package com.pigfeed.guide.data.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.pigfeed.guide.data.entity.Herd
import kotlinx.coroutines.flow.Flow

@Dao
interface HerdDao {
    @Query("SELECT * FROM herds ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<Herd>>

    @Query("SELECT * FROM herds WHERE id = :id")
    fun observeById(id: Long): Flow<Herd?>

    @Query("SELECT COUNT(*) FROM herds")
    fun observeCount(): Flow<Int>

    @Query("SELECT COALESCE(SUM(headCount), 0) FROM herds")
    fun observeTotalHeadCount(): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(herd: Herd): Long

    @Update
    suspend fun update(herd: Herd)

    @Delete
    suspend fun delete(herd: Herd)
}
