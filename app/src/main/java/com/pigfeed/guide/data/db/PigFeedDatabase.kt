package com.pigfeed.guide.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.pigfeed.guide.data.dao.FeedingGuideDao
import com.pigfeed.guide.data.dao.FeedingLogDao
import com.pigfeed.guide.data.dao.FeedingScheduleDao
import com.pigfeed.guide.data.dao.HerdDao
import com.pigfeed.guide.data.entity.FeedingGuide
import com.pigfeed.guide.data.entity.FeedingLog
import com.pigfeed.guide.data.entity.FeedingSchedule
import com.pigfeed.guide.data.entity.Herd

@Database(
    entities = [
        FeedingGuide::class,
        Herd::class,
        FeedingSchedule::class,
        FeedingLog::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class PigFeedDatabase : RoomDatabase() {
    abstract fun feedingGuideDao(): FeedingGuideDao
    abstract fun herdDao(): HerdDao
    abstract fun feedingScheduleDao(): FeedingScheduleDao
    abstract fun feedingLogDao(): FeedingLogDao

    companion object {
        @Volatile
        private var INSTANCE: PigFeedDatabase? = null

        fun getInstance(context: Context): PigFeedDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    PigFeedDatabase::class.java,
                    "pig_feed_guide.db"
                ).build().also { INSTANCE = it }
            }
        }
    }
}
