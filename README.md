# PigFeed Guide

Android app for managing pig feeding guides, herds, meal schedules, and daily feed logs.

## Features

- **Stage feeding guides** — starter, grower, finisher, gestating sow, lactating sow, and boar rations (seeded defaults + custom guides)
- **Herd management** — track batches by stage, head count, and average weight
- **Meal schedules** — set feeding times and amounts per herd
- **Feeding logs** — record actual feedings and see today’s total
- **Feed calculator** — estimate daily/period feed needs and 50 kg bag counts

## Tech stack

- Kotlin
- Jetpack Compose + Material 3
- Room (local persistence)
- Navigation Compose
- ViewModel + StateFlow

## Open in Android Studio

1. Open this folder in Android Studio (Hedgehog or newer recommended)
2. Let Gradle sync
3. Run the `app` configuration on an emulator or device (API 26+)

## Build from CLI

```bash
# Ensure ANDROID_HOME / local.properties sdk.dir is set
./gradlew assembleDebug
./gradlew test
```

Debug APK output: `app/build/outputs/apk/debug/app-debug.apk`

## App package

`com.pigfeed.guide`
