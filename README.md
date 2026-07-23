# Gaba Hardware

Mobile store ops app for the Philippines — **admin (boss)** and **staff** logins, sales, inventory, SMS receipts in **₱ PHP**, optional **online sync**, and **Android** packaging.

## Default logins

| Role | Username | PIN |
|------|----------|-----|
| Admin / Boss | `admin` | `0000` |
| Staff | `staff` | `1234` |

## Features

- **Roles** — Admin manages settings/staff/void; Staff sells and adjusts stock
- **Dashboard** — sales, profit, chart, low stock, top movers
- **Sales** — favorites, GCash refs, SMS receipts, void (admin), cashier name on ticket
- **Inventory** — photos, favorites, restock
- **Customers / Reports / Staff / Settings**
- **Online sync** — Supabase (see `ONLINE.md`)
- **Android app** — Capacitor (see `ANDROID.md`)

## Run (web)

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Stack

Vite · React 19 · TypeScript · Supabase · Capacitor · Recharts
