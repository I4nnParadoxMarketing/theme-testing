# GCashFlow

Mobile app for tracking **GCash cash in** and **cash out**.

Capture a receipt with the camera, upload a screenshot, or enter a transaction manually. OCR reads the receipt text and fills amount, fee, reference, type, and date for review before saving.

## Features

- Cash in / cash out ledger with net balance
- Camera / gallery receipt scan with OCR
- Claimed marker + auto fee rules for cash outs
- Duplicate Ref No. blocking
- **Cloud sync** across phones with a shared sync code
- **Reports**: today, weekly, monthly, yearly, unclaimed, fees — downloadable CSV
- Local persistence on device

## Try on Android (installer)

Download the APK:

**https://github.com/I4nnParadoxMarketing/theme-testing/releases/download/gcashflow-v1.1.0/GCashFlow-android.apk**

Release page: https://github.com/I4nnParadoxMarketing/theme-testing/releases/tag/gcashflow-v1.1.0

1. Open the download link on your Android phone
2. Allow **Install unknown apps** if prompted
3. Install, then open **GCashFlow**

Package id: `com.gcashflow.tracker`

## Cloud sync (multi-device)

1. On phone A open **Cloud sync**
2. Tap **Create new sync code** (Quick sync works immediately)
3. Tap **Copy sync code**
4. On phone B open **Cloud sync** → paste code → **Join & download transactions**
5. New saves upload automatically when sync is enabled

For short permanent codes, create a free Pantry at [getpantry.cloud](https://getpantry.cloud/), paste the Pantry ID in Sync settings, then create a sync code.

## Reports & download

Open **Reports** to view:

- Today
- Weekly (last 7 days)
- Monthly
- Yearly
- All time
- Unclaimed cash outs
- Fees

Tap **Download CSV** and save/share the file (Files, Drive, email, etc.).

## Cash out rules

- **Claimed** marker on cash outs
- **Duplicate Ref No.** blocked with an error
- **Auto fee** (editable): ≤99 → ₱5 · 100–500 → ₱10 · 501–1000 → ₱15 · each full ₱1,000 → ₱15 + same brackets on excess

## Run from source

```bash
npm install
npm start
npm run web
npm test
```

Build a release APK:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```
