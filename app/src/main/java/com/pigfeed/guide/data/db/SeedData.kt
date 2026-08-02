package com.pigfeed.guide.data.db

import com.pigfeed.guide.data.entity.FeedingGuide
import com.pigfeed.guide.data.entity.PigStage

object SeedData {
    fun defaultGuides(): List<FeedingGuide> = listOf(
        FeedingGuide(
            stage = PigStage.STARTER,
            title = "Weaner Starter Ration",
            dailyFeedKgMin = 0.5,
            dailyFeedKgMax = 1.2,
            mealsPerDay = 3,
            proteinPercentMin = 18.0,
            proteinPercentMax = 21.0,
            energyMjPerKg = 13.5,
            targetWeightMinKg = 7.0,
            targetWeightMaxKg = 25.0,
            tips = "Offer fresh feed often. Keep water clean and available. Transition from milk replacer gradually over 5–7 days.",
            feedMixNotes = "High-quality cereal base with soybean meal, whey powder optional, lysine-balanced premix, and coccidiostat if advised by vet."
        ),
        FeedingGuide(
            stage = PigStage.GROWER,
            title = "Grower Phase Guide",
            dailyFeedKgMin = 1.2,
            dailyFeedKgMax = 2.2,
            mealsPerDay = 2,
            proteinPercentMin = 16.0,
            proteinPercentMax = 18.0,
            energyMjPerKg = 13.0,
            targetWeightMinKg = 25.0,
            targetWeightMaxKg = 60.0,
            tips = "Monitor body condition weekly. Avoid sudden ration changes. Split feed morning and late afternoon.",
            feedMixNotes = "Maize/barley + soybean meal + wheat bran, with mineral-vitamin premix and adequate lysine/methionine."
        ),
        FeedingGuide(
            stage = PigStage.FINISHER,
            title = "Finisher Market Prep",
            dailyFeedKgMin = 2.2,
            dailyFeedKgMax = 3.2,
            mealsPerDay = 2,
            proteinPercentMin = 14.0,
            proteinPercentMax = 16.0,
            energyMjPerKg = 12.8,
            targetWeightMinKg = 60.0,
            targetWeightMaxKg = 110.0,
            tips = "Focus on feed conversion. Reduce protein slightly as weight rises. Track leftover feed to avoid waste.",
            feedMixNotes = "Energy-dense cereal mix with moderate protein. Include fiber source for gut health."
        ),
        FeedingGuide(
            stage = PigStage.GESTATING_SOW,
            title = "Gestation Maintenance",
            dailyFeedKgMin = 2.0,
            dailyFeedKgMax = 2.8,
            mealsPerDay = 2,
            proteinPercentMin = 12.0,
            proteinPercentMax = 14.0,
            energyMjPerKg = 12.0,
            targetWeightMinKg = 150.0,
            targetWeightMaxKg = 250.0,
            tips = "Limit overfeeding in early/mid gestation. Increase feed in last 3 weeks. Keep sows comfortable and unstressed.",
            feedMixNotes = "Higher fiber gestation ration; controlled energy; calcium/phosphorus balanced for fetal development."
        ),
        FeedingGuide(
            stage = PigStage.LACTATING_SOW,
            title = "Lactation High-Energy",
            dailyFeedKgMin = 4.5,
            dailyFeedKgMax = 7.5,
            mealsPerDay = 3,
            proteinPercentMin = 16.0,
            proteinPercentMax = 18.0,
            energyMjPerKg = 13.5,
            targetWeightMinKg = 150.0,
            targetWeightMaxKg = 250.0,
            tips = "Ramp feed intake after farrowing. Never let the sow go thirsty. Aim to minimize body condition loss.",
            feedMixNotes = "High energy lactation diet with quality protein, fat sources, and boosted vitamins/minerals."
        ),
        FeedingGuide(
            stage = PigStage.BOAR,
            title = "Breeding Boar Ration",
            dailyFeedKgMin = 2.0,
            dailyFeedKgMax = 3.0,
            mealsPerDay = 2,
            proteinPercentMin = 14.0,
            proteinPercentMax = 16.0,
            energyMjPerKg = 12.5,
            targetWeightMinKg = 180.0,
            targetWeightMaxKg = 300.0,
            tips = "Maintain firm, athletic condition. Adjust feed if boar becomes overweight. Keep feeding consistent around breeding days.",
            feedMixNotes = "Balanced maintenance ration; avoid excess fat. Include minerals supporting reproductive health."
        )
    )
}
