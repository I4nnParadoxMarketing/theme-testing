package com.pigfeed.guide

import com.pigfeed.guide.data.db.SeedData
import com.pigfeed.guide.data.entity.PigStage
import com.pigfeed.guide.data.repository.PigFeedRepository
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SeedDataTest {
    @Test
    fun defaultGuidesCoverAllStages() {
        val guides = SeedData.defaultGuides()
        assertEquals(PigStage.entries.size, guides.size)
        assertEquals(PigStage.entries.toSet(), guides.map { it.stage }.toSet())
        guides.forEach { guide ->
            assertTrue(guide.dailyFeedKgMax >= guide.dailyFeedKgMin)
            assertTrue(guide.proteinPercentMax >= guide.proteinPercentMin)
            assertTrue(guide.mealsPerDay >= 1)
            assertTrue(guide.title.isNotBlank())
        }
    }

    @Test
    fun recommendedDailyTotalScalesWithHeadCount() {
        val guide = SeedData.defaultGuides().first { it.stage == PigStage.GROWER }
        val repository = PigFeedRepository(
            guideDao = unusedDao(),
            herdDao = unusedDao(),
            scheduleDao = unusedDao(),
            logDao = unusedDao()
        )
        val (min, max) = repository.recommendedDailyTotalKg(guide, headCount = 10)
        assertEquals(guide.dailyFeedKgMin * 10, min, 0.0001)
        assertEquals(guide.dailyFeedKgMax * 10, max, 0.0001)
    }

    // Repository only needs the calculation method for this test; DAO refs are unused.
    private inline fun <reified T> unusedDao(): T {
        return java.lang.reflect.Proxy.newProxyInstance(
            T::class.java.classLoader,
            arrayOf(T::class.java)
        ) { _, _, _ -> null } as T
    }
}
