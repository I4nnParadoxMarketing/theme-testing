# Gaba Hardware

Mobile-first hardware store ops app for monitoring **sales**, managing **inventory**, and checking a live **dashboard**.

## Features

- **Dashboard** — today’s till, profit estimate, chart, low-stock alerts, top movers
- **Sales** — search, favorites quick-pick, Cash/GCash/Card/Bank transfer, void sale, GCash ref
- **SMS receipts** — send peso receipts to PH mobiles; auto-save customers
- **Inventory** — photos, favorites, search & category filters, restock
- **Customers** — saved clients for quick SMS
- **Reports** — sales/profit by period, payment mix, share report & reorder list
- **Settings** — store name/address for receipts, reset demo data

Currency is **PHP (₱)**. Data persists in `localStorage` with seeded demo hardware SKUs.

## Run

```bash
npm install
npm run dev
```

Open the local URL (phone-width frame on desktop; full-bleed on mobile).

```bash
npm run build
npm run preview
```

## Stack

Vite · React 19 · TypeScript · React Router · Recharts · date-fns
