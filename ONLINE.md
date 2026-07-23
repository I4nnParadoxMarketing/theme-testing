# Take Gaba Hardware online

## 1. Create a free Supabase project

1. Go to [https://supabase.com](https://supabase.com) and create a project
2. Open **SQL Editor**
3. Paste and run everything in `supabase/schema.sql`
4. Open **Project Settings → API**
5. Copy:
   - Project URL
   - `anon` `public` key

## 2. Connect the app

### Option A — in the app (easiest)

1. Sign in as **admin** / PIN **0000**
2. Open **More → Settings & Online**
3. Paste Supabase URL + anon key
4. Turn on **Enable online sync**
5. Tap **Save cloud settings**

Sales, stock, customers, and staff accounts will sync to the cloud so other phones see the same data.

### Option B — env file (for developers)

Copy `.env.example` to `.env`:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Then rebuild:

```bash
npm run build
```

## 3. Admin vs Staff

| | Admin (boss) | Staff |
|---|---|---|
| Login | `admin` / `0000` | `staff` / `1234` |
| Record sales | Yes | Yes |
| Void sales | Yes | No |
| Add/edit products | Yes | Stock +/- only |
| Settings / online | Yes | No |
| Manage staff | Yes | No |
| Reports | Yes | Yes |

Admin can create more staff in **More → Staff accounts**.

## Notes

- Until cloud is enabled, the app works on one device (local mode)
- After cloud is enabled, use the same admin/staff logins on every phone
- Change default PINs after first login (create new staff / rotate admin PIN via Staff screen)
