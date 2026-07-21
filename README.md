# BoltYard

Mobile-first hardware store ops app for monitoring **sales**, managing **inventory**, and checking a live **dashboard**.

## Features

- **Dashboard** — today’s till, 7-day revenue chart, low-stock alerts, top movers
- **Sales** — filter by today / 7 days / all, record multi-item sales (cash, card, transfer)
- **Inventory** — search & category filters, quick stock adjust, add/edit products, restock

Data persists in `localStorage` with seeded demo hardware SKUs.

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
