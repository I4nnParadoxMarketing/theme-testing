# Build the Android app

Gaba Hardware uses **Capacitor** to wrap the web app as an Android APK.

## Requirements (on your computer)

- Node.js 20+
- Android Studio (with Android SDK)
- JDK 17+

## Build steps

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio:

1. Wait for Gradle sync
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Install the APK on the store phone(s)

Or run on a device/emulator:

```bash
npx cap run android
```

## After code changes

```bash
npm run build
npx cap sync android
```

## Tips for the store

- Install the APK on admin + staff phones
- Enable online sync (see `ONLINE.md`) so all phones share stock/sales
- Add the app to the home screen
- Keep one admin PIN private

## Play Store (later)

When ready for Play Store publishing, create a signing key in Android Studio and upload an AAB (`Build → Generate Signed Bundle`).
