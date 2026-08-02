package com.pigfeed.guide.data.db

import androidx.room.TypeConverter
import com.pigfeed.guide.data.entity.PigStage

class Converters {
    @TypeConverter
    fun fromPigStage(stage: PigStage): String = stage.name

    @TypeConverter
    fun toPigStage(value: String): PigStage = PigStage.valueOf(value)
}
