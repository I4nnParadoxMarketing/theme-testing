package com.pigfeed.guide.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.pigfeed.guide.data.entity.FeedingGuide
import com.pigfeed.guide.data.entity.PigStage
import kotlinx.coroutines.flow.Flow

@Dao
interface FeedingGuideDao {
    @Query("SELECT * FROM feeding_guides ORDER BY stage ASC, title ASC")
    fun observeAll(): Flow<List<FeedingGuide>>

    @Query("SELECT * FROM feeding_guides WHERE id = :id")
    fun observeById(id: Long): Flow<FeedingGuide?>

    @Query("SELECT * FROM feeding_guides WHERE stage = :stage ORDER BY title ASC")
    fun observeByStage(stage: PigStage): Flow<List<FeedingGuide>>

    @Query("SELECT COUNT(*) FROM feeding_guides")
    suspend fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(guides: List<FeedingGuide>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(guide: FeedingGuide): Long

    @Update
    suspend fun update(guide: FeedingGuide)

    @Query("DELETE FROM feeding_guides WHERE id = :id AND isCustom = 1")
    suspend fun deleteCustom(id: Long)
}
