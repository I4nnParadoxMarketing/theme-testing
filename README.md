# GCashFlow

Mobile app for tracking **GCash cash in** and **cash out**.

Capture a receipt with the camera, upload a screenshot, or enter a transaction manually. OCR reads the receipt text and fills amount, fee, reference, type, and date for review before saving.

## Features

- Clean dashboard: today’s money, Cash In / Cash Out, recent activity
- **Settings**: today’s budget, reports, and cloud sync
- **Fee profit** shown for today and all-time
- Dedicated **Cash In** and **Cash Out** screens with scan + manual entry inside each
- Camera / gallery receipt scan with OCR
- **Completed / Not completed** tags for cash ins
- Claimed / Unclaimed marker + auto fee rules for cash outs
- Duplicate Ref No. blocking
- Local persistence on device

## Try on Android (installer)

Download the APK:

**https://github.com/I4nnParadoxMarketing/theme-testing/releases/download/gcashflow-v1.1.3/GCashFlow-android.apk**

Release page: https://github.com/I4nnParadoxMarketing/theme-testing/releases/tag/gcashflow-v1.1.3

1. Open the download link on your Android phone
2. Allow **Install unknown apps** if prompted
3. Install, then open **GCashFlow**

Package id: `com.gcashflow.tracker`

## Settings

Open **Settings** from the dashboard for:

- Today’s money budget
- Reports (CSV download)
- Cloud sync

## Cloud sync (multi-device)

1. On phone A open **Settings → Cloud sync**
2. Tap **Create new sync code** (Quick sync works immediately)
3. Tap **Copy sync code**
4. On phone B open **Settings → Cloud sync** → paste code → **Join & download transactions**
5. New saves upload automatically when sync is enabled

For short permanent codes, create a free Pantry at [getpantry.cloud](https://getpantry.cloud/), paste the Pantry ID in Sync settings, then create a sync code.

## Reports & download

Open **Settings → Reports** to view:

- Today
- Weekly (last 7 days)
- Monthly
- Yearly
- Custom date range (From / To)
- All time
- Unclaimed cash outs
- Incomplete cash ins
- Fees

Tap **Download CSV** and save/share the file (Files, Drive, email, etc.).

## Cash in / cash out tags

- **Cash in**: Completed / Not completed (tap the tag on the home list to toggle)
- **Cash out**: Claimed / Unclaimed
- **Duplicate Ref No.** blocked with an error
- **Auto fee** for cash outs (editable): ≤99 → ₱5 · 100–500 → ₱10 · 501–1000 → ₱15 · each full ₱1,000 → ₱15 + same brackets on excess

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
