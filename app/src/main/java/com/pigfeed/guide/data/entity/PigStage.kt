package com.pigfeed.guide.data.entity

enum class PigStage(val displayName: String, val description: String) {
    STARTER("Starter / Piglet", "Weaning to ~25 kg"),
    GROWER("Grower", "25–60 kg growth phase"),
    FINISHER("Finisher", "60 kg to market weight"),
    GESTATING_SOW("Gestating Sow", "Pregnancy nutrition"),
    LACTATING_SOW("Lactating Sow", "Nursing litter nutrition"),
    BOAR("Boar", "Breeding boar maintenance")
}
