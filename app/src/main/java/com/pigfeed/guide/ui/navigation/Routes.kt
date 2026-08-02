package com.pigfeed.guide.ui.navigation

sealed class Routes(val route: String) {
    data object Home : Routes("home")
    data object Guides : Routes("guides")
    data object GuideDetail : Routes("guides/{guideId}") {
        fun create(guideId: Long) = "guides/$guideId"
    }
    data object Herds : Routes("herds")
    data object HerdDetail : Routes("herds/{herdId}") {
        fun create(herdId: Long) = "herds/$herdId"
    }
    data object Logs : Routes("logs")
    data object Calculator : Routes("calculator")
}
