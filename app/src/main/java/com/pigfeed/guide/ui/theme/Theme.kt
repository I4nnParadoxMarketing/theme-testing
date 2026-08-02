package com.pigfeed.guide.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = ForestDeep,
    onPrimary = Color.White,
    primaryContainer = SoftMoss,
    onPrimaryContainer = ForestDeep,
    secondary = AmberGrain,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFF4E4C2),
    onSecondaryContainer = WarmEarth,
    tertiary = Leaf,
    onTertiary = Color.White,
    background = MistSage,
    onBackground = Ink,
    surface = CreamPanel,
    onSurface = Ink,
    surfaceVariant = SoftMoss,
    onSurfaceVariant = MutedInk,
    error = AlertClay,
    onError = Color.White,
    outline = Color(0xFF9AAB9F)
)

@Composable
fun PigFeedTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        typography = Typography,
        content = content
    )
}
