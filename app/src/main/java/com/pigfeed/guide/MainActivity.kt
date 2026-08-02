package com.pigfeed.guide

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.pigfeed.guide.ui.navigation.PigFeedNavHost
import com.pigfeed.guide.ui.theme.PigFeedTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as PigFeedApplication
        setContent {
            PigFeedTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    PigFeedNavHost(repository = app.repository)
                }
            }
        }
    }
}
