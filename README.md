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

## Run

```bash
npm install
npm run web      # browser (good for quick demo)
npm start        # Expo Dev Tools / Expo Go
npm run android  # Android emulator / device
npm run ios      # iOS simulator (macOS)
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
