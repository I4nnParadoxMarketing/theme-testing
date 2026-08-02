package com.pigfeed.guide

import android.app.Application
import com.pigfeed.guide.data.db.PigFeedDatabase
import com.pigfeed.guide.data.db.SeedData
import com.pigfeed.guide.data.repository.PigFeedRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class PigFeedApplication : Application() {
    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    lateinit var repository: PigFeedRepository
        private set

    override fun onCreate() {
        super.onCreate()
        val db = PigFeedDatabase.getInstance(this)
        repository = PigFeedRepository(
            guideDao = db.feedingGuideDao(),
            herdDao = db.herdDao(),
            scheduleDao = db.feedingScheduleDao(),
            logDao = db.feedingLogDao()
        )
        appScope.launch {
            if (db.feedingGuideDao().count() == 0) {
                db.feedingGuideDao().insertAll(SeedData.defaultGuides())
            }
        }
    }
}
