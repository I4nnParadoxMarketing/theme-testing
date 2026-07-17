# GCashFlow

Mobile app for tracking **GCash cash in** and **cash out**.

Capture a receipt with the camera, upload a screenshot, or enter a transaction manually. On-device OCR reads the receipt text and fills amount, fee, reference, type, and date for review before saving.

## Features

- Cash in / cash out ledger with net balance
- Live camera capture and gallery upload
- OCR text extraction (Tesseract.js)
- GCash receipt parsing (amount, fee, ref no., counterparty, date)
- Local persistence on device (AsyncStorage)
- Manual entry and edit / delete

## Try on Android (installer)

A standalone APK is available as `GCashFlow-android.apk`.

1. Download the APK onto your Android phone
2. Open **Settings → Security** (or **Apps**) and allow **Install unknown apps** for your browser/Files app
3. Open the downloaded file and tap **Install**
4. Open **GCashFlow** and allow camera / photos when prompted

Package id: `com.gcashflow.tracker`

## Try instantly with Expo Go

1. Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from the Play Store
2. Open this link on your phone (while the cloud tunnel is running):

   `exp://c_sqwr8-anonymous-8081.exp.direct`

## Run from source

```bash
npm install
npm start        # Expo Dev Tools / Expo Go
npm run web      # browser demo
npm run android  # native Android build/run
npm run ios      # iOS simulator (macOS)
```

Build a release APK locally:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# output: android/app/build/outputs/apk/release/app-release.apk
```

## Tests

```bash
npm test
```

## How scanning works

1. Open **Scan receipt**
2. Use **live camera**, **quick camera shot**, or **upload from gallery**
3. OCR extracts text from the image
4. The parser detects cash in vs cash out and key fields
5. Confirm or edit details, then save

Tip: Photograph the full receipt with good lighting. Screenshots of GCash success pages usually parse best.
