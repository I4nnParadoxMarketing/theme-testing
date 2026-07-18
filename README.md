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

Download the APK:

**https://github.com/I4nnParadoxMarketing/theme-testing/releases/download/gcashflow-v1.0.1/GCashFlow-android.apk**

Release page: https://github.com/I4nnParadoxMarketing/theme-testing/releases/tag/gcashflow-v1.0.1

1. Open the download link on your Android phone
2. Allow **Install unknown apps** for your browser/Files app if prompted
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
2. Use **upload from gallery**, **camera**, or **Use sample Express Send**
3. OCR reads the screenshot over the internet (no broken on-device worker)
4. The parser detects Express Send / cash in / cash out and key fields
5. Confirm or edit details, then save

Supports GCash **Express Send** receipts (amount, Ref No., phone, date). Phone needs internet for OCR.
