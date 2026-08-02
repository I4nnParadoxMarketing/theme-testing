package com.pigfeed.guide.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.pigfeed.guide.data.repository.PigFeedRepository
import com.pigfeed.guide.ui.screens.CalculatorScreen
import com.pigfeed.guide.ui.screens.GuideDetailScreen
import com.pigfeed.guide.ui.screens.GuidesScreen
import com.pigfeed.guide.ui.screens.HerdDetailScreen
import com.pigfeed.guide.ui.screens.HerdsScreen
import com.pigfeed.guide.ui.screens.HomeScreen
import com.pigfeed.guide.ui.screens.LogsScreen
import com.pigfeed.guide.ui.viewmodel.CalculatorViewModel
import com.pigfeed.guide.ui.viewmodel.GuideDetailViewModel
import com.pigfeed.guide.ui.viewmodel.GuidesViewModel
import com.pigfeed.guide.ui.viewmodel.HerdDetailViewModel
import com.pigfeed.guide.ui.viewmodel.HerdsViewModel
import com.pigfeed.guide.ui.viewmodel.HomeViewModel
import com.pigfeed.guide.ui.viewmodel.LogsViewModel

private data class TabItem(
    val route: String,
    val label: String,
    val icon: ImageVector
)

@Composable
fun PigFeedNavHost(repository: PigFeedRepository) {
    val navController = rememberNavController()
    val tabs = listOf(
        TabItem(Routes.Home.route, "Home", Icons.Filled.Home),
        TabItem(Routes.Guides.route, "Guides", Icons.Filled.MenuBook),
        TabItem(Routes.Herds.route, "Herds", Icons.Filled.Groups),
        TabItem(Routes.Logs.route, "Logs", Icons.Filled.ReceiptLong),
        TabItem(Routes.Calculator.route, "Calc", Icons.Filled.Calculate)
    )
    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route
    val showBottomBar = tabs.any { it.route == currentRoute }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = currentRoute == tab.route,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) }
                        )
                    }
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.Home.route,
            modifier = Modifier.padding(padding)
        ) {
            composable(Routes.Home.route) {
                val vm: HomeViewModel = viewModel(factory = HomeViewModel.factory(repository))
                HomeScreen(
                    viewModel = vm,
                    onOpenGuides = { navController.navigate(Routes.Guides.route) },
                    onOpenHerds = { navController.navigate(Routes.Herds.route) },
                    onOpenGuide = { id -> navController.navigate(Routes.GuideDetail.create(id)) },
                    onOpenHerd = { id -> navController.navigate(Routes.HerdDetail.create(id)) },
                    onOpenCalculator = { navController.navigate(Routes.Calculator.route) }
                )
            }
            composable(Routes.Guides.route) {
                val vm: GuidesViewModel = viewModel(factory = GuidesViewModel.factory(repository))
                GuidesScreen(
                    viewModel = vm,
                    onOpenGuide = { id -> navController.navigate(Routes.GuideDetail.create(id)) }
                )
            }
            composable(
                route = Routes.GuideDetail.route,
                arguments = listOf(navArgument("guideId") { type = NavType.LongType })
            ) { entry ->
                val guideId = entry.arguments?.getLong("guideId") ?: return@composable
                val vm: GuideDetailViewModel = viewModel(
                    factory = GuideDetailViewModel.factory(repository, guideId)
                )
                GuideDetailScreen(
                    viewModel = vm,
                    onBack = { navController.popBackStack() }
                )
            }
            composable(Routes.Herds.route) {
                val vm: HerdsViewModel = viewModel(factory = HerdsViewModel.factory(repository))
                HerdsScreen(
                    viewModel = vm,
                    onOpenHerd = { id -> navController.navigate(Routes.HerdDetail.create(id)) }
                )
            }
            composable(
                route = Routes.HerdDetail.route,
                arguments = listOf(navArgument("herdId") { type = NavType.LongType })
            ) { entry ->
                val herdId = entry.arguments?.getLong("herdId") ?: return@composable
                val vm: HerdDetailViewModel = viewModel(
                    factory = HerdDetailViewModel.factory(repository, herdId)
                )
                HerdDetailScreen(
                    viewModel = vm,
                    onBack = { navController.popBackStack() }
                )
            }
            composable(Routes.Logs.route) {
                val vm: LogsViewModel = viewModel(factory = LogsViewModel.factory(repository))
                LogsScreen(viewModel = vm)
            }
            composable(Routes.Calculator.route) {
                val vm: CalculatorViewModel =
                    viewModel(factory = CalculatorViewModel.factory(repository))
                CalculatorScreen(viewModel = vm)
            }
        }
    }
}
