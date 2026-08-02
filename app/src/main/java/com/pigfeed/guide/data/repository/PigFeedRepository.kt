package com.pigfeed.guide.data.repository

import com.pigfeed.guide.data.dao.FeedingGuideDao
import com.pigfeed.guide.data.dao.FeedingLogDao
import com.pigfeed.guide.data.dao.FeedingScheduleDao
import com.pigfeed.guide.data.dao.HerdDao
import com.pigfeed.guide.data.entity.FeedingGuide
import com.pigfeed.guide.data.entity.FeedingLog
import com.pigfeed.guide.data.entity.FeedingSchedule
import com.pigfeed.guide.data.entity.Herd
import com.pigfeed.guide.data.entity.PigStage
import kotlinx.coroutines.flow.Flow
import java.util.Calendar

class PigFeedRepository(
    private val guideDao: FeedingGuideDao,
    private val herdDao: HerdDao,
    private val scheduleDao: FeedingScheduleDao,
    private val logDao: FeedingLogDao
) {
    fun observeGuides(): Flow<List<FeedingGuide>> = guideDao.observeAll()
    fun observeGuide(id: Long): Flow<FeedingGuide?> = guideDao.observeById(id)
    fun observeGuidesByStage(stage: PigStage): Flow<List<FeedingGuide>> =
        guideDao.observeByStage(stage)

    suspend fun saveGuide(guide: FeedingGuide): Long {
        return if (guide.id == 0L) guideDao.insert(guide.copy(isCustom = true))
        else {
            guideDao.update(guide)
            guide.id
        }
    }

    suspend fun deleteCustomGuide(id: Long) = guideDao.deleteCustom(id)

    fun observeHerds(): Flow<List<Herd>> = herdDao.observeAll()
    fun observeHerd(id: Long): Flow<Herd?> = herdDao.observeById(id)
    fun observeHerdCount(): Flow<Int> = herdDao.observeCount()
    fun observeTotalHeadCount(): Flow<Int> = herdDao.observeTotalHeadCount()

    suspend fun saveHerd(herd: Herd): Long {
        return if (herd.id == 0L) herdDao.insert(herd)
        else {
            herdDao.update(herd)
            herd.id
        }
    }

    suspend fun deleteHerd(herd: Herd) = herdDao.delete(herd)

    fun observeSchedules(): Flow<List<FeedingSchedule>> = scheduleDao.observeAll()
    fun observeSchedulesForHerd(herdId: Long): Flow<List<FeedingSchedule>> =
        scheduleDao.observeByHerd(herdId)

    suspend fun saveSchedule(schedule: FeedingSchedule): Long {
        return if (schedule.id == 0L) scheduleDao.insert(schedule)
        else {
            scheduleDao.update(schedule)
            schedule.id
        }
    }

    suspend fun deleteSchedule(schedule: FeedingSchedule) = scheduleDao.delete(schedule)

    fun observeLogs(): Flow<List<FeedingLog>> = logDao.observeAll()
    fun observeLogsForHerd(herdId: Long): Flow<List<FeedingLog>> = logDao.observeByHerd(herdId)

    fun observeTodayLogs(): Flow<List<FeedingLog>> {
        val (start, end) = dayBounds()
        return logDao.observeForDay(start, end)
    }

    fun observeTodayTotalKg(): Flow<Double> {
        val (start, end) = dayBounds()
        return logDao.observeTotalForDay(start, end)
    }

    suspend fun addLog(log: FeedingLog): Long = logDao.insert(log)
    suspend fun deleteLog(log: FeedingLog) = logDao.delete(log)

    fun recommendedDailyTotalKg(guide: FeedingGuide, headCount: Int): Pair<Double, Double> {
        return guide.dailyFeedKgMin * headCount to guide.dailyFeedKgMax * headCount
    }

    private fun dayBounds(): Pair<Long, Long> {
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val start = calendar.timeInMillis
        calendar.add(Calendar.DAY_OF_YEAR, 1)
        return start to calendar.timeInMillis
    }
}
