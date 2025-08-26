package com.example.voiceshopper.ui

import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.res.painterResource
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.voiceshopper.R
import com.example.voiceshopper.ui.screens.HistoryScreen
import com.example.voiceshopper.ui.screens.HomeScreen
import com.example.voiceshopper.ui.screens.SettingsScreen
import com.example.voiceshopper.ui.screens.VoiceAddScreen

sealed class Dest(val route: String, val title: String, val icon: Int) {
    data object Home : Dest("home", "Home", R.drawable.ic_home)
    data object Voice : Dest("voice", "Voice", R.drawable.ic_mic)
    data object History : Dest("history", "History", R.drawable.ic_history)
    data object Settings : Dest("settings", "Settings", R.drawable.ic_settings)
}

@Composable
fun AppNavHost() {
    val navController = rememberNavController()
    val items = listOf(Dest.Home, Dest.Voice, Dest.History, Dest.Settings)

    Scaffold(
        bottomBar = {
            val navBackStackEntry by navController.currentBackStackEntryAsState()
            val currentRoute = navBackStackEntry?.destination?.route
            NavigationBar {
                items.forEach { item ->
                    NavigationBarItem(
                        icon = { Icon(painterResource(item.icon), contentDescription = item.title) },
                        label = { Text(item.title) },
                        selected = currentRoute == item.route,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { paddingValues ->
        NavHost(navController, startDestination = Dest.Home.route) {
            composable(Dest.Home.route) { HomeScreen(paddingValues) }
            composable(Dest.Voice.route) { VoiceAddScreen(paddingValues) }
            composable(Dest.History.route) { HistoryScreen(paddingValues) }
            composable(Dest.Settings.route) { SettingsScreen(paddingValues) }
        }
    }
}