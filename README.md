# GCashFlow

Mobile app for tracking **GCash cash in** and **cash out**.

Capture a receipt with the camera, upload a screenshot, or enter a transaction manually. OCR reads the receipt text and fills amount, fee, reference, type, and date for review before saving.

## Features

- **Login** for admin and staff (default passwords `1234` / `1234`)
- **Account settings**: change password; admin can add / update / deactivate staff
- Accounts sync **online** with Cloud sync
- Clean dashboard with **greeting** (Good morning/afternoon/evening + name)
- **Notification bell** for incomplete cash ins and unclaimed cash outs
- **Settings**: today’s budget, account, reports, and cloud sync
- **Fee profit** shown for today and all-time
- Dedicated **Cash In** and **Cash Out** screens with scan + manual entry inside each
- Camera / gallery receipt scan with OCR
- **Completed / Not completed** tags for cash ins
- Claimed / Unclaimed marker + auto fee rules for cash outs
- Duplicate Ref No. blocking
- Local persistence on device

## Try on Android (installer)

Download the APK:

**https://github.com/I4nnParadoxMarketing/theme-testing/releases/download/gcashflow-v1.2.7/GCashFlow-android.apk**

Release page: https://github.com/I4nnParadoxMarketing/theme-testing/releases/tag/gcashflow-v1.2.7

1. Open the download link on your Android phone
2. Allow **Install unknown apps** if prompted
3. Install, then open **GCashFlow**

Package id: `com.gcashflow.tracker`

## Login

| Username | Default password | Role |
|---|---|---|
| `admin` | `1234` | Manage staff; can mark cash in **Completed** (reference required) |
| `staff` | `1234` | Add cash in / cash out; cash-in form hides reference & completed |

Change passwords in **Settings → Account**. Admin can add more staff there. When **Cloud sync** is on, accounts are shared online with other phones on the same sync code.

## Settings

Open **Settings** from the dashboard for:

- Account (password + staff management)
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
