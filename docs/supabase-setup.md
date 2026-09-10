# Supabase + Vercel setup

The app does **not** deploy itself. You apply SQL, import data from a machine that has `data/store.json`, then set Vercel env and deploy.

## 1. Manual Supabase steps

1. Create a Supabase project (region close to Vercel).
2. SQL Editor → paste and run [`supabase/migrations/20260910_000001_init.sql`](../supabase/migrations/20260910_000001_init.sql).
3. Storage → New bucket → name `uploads` → **Public**.
4. Settings → API: copy Project URL and `service_role` key.
5. Settings → Database: copy the Postgres URI into `DATABASE_URL` (SSL). Use the **transaction pooler (`:6543`)** for Vercel. Writes use `BEGIN` + `pg_advisory_xact_lock` (transaction-scoped). Reads are sequential, one query at a time, `prepare: false`. Session pooler (`:5432`) or direct are not required.
6. Copy `VERIFY_SECRET` from local `data/store.json` (`verifySecret`) **once** into env. Do not store it in Postgres.

## 2. Vercel env vars

| Name | Required |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (server only) |
| `DATABASE_URL` | yes |
| `VERIFY_SECRET` | yes |
| `ADMIN_PASSWORD` | yes (change from default) |
| `BILLPLZ_API_KEY` | for live pay |
| `BILLPLZ_COLLECTION_ID` | for live pay |
| `BILLPLZ_X_SIGNATURE_KEY` | for live pay |
| `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_APP_URL` | yes (https origin) |

Do not set `SUPABASE_SERVICE_ROLE_KEY` on a `NEXT_PUBLIC_` name.

## 3. Import (local machine that has data)

```bash
cp .env.example .env.local
# fill Supabase + VERIFY_SECRET
npm install
npm run import:supabase
```

Prints inserted/updated/skipped counts. Re-run is safe. Does **not** delete `data/store.json` or `data/uploads/`.

If import reports `mixed_status` / `bill_shared`, fix those groups in `store.json` first.

## 4. Deploy (you run this)

1. Confirm Vercel env vars above.
2. Deploy the branch (`vercel` or git push to the production branch).
3. Do not rely on `data/` in the serverless image.

## 5. Production verification

- Homepage loads in a few seconds (no `ENOENT mkdir /var/task/data`, no 300s task timeout).
- Vercel Logs show `[store] connect start` → `[store] connect ok` and sequential `[store] query start|ok` for `settings` / `products` / `posters` / `videos` (not 14 parallel full-table dumps).
- Catalog products match import counts.
- Login with an imported user still works (session cookie hashed on import).
- Open a paid order: **订单号** is the persisted `GO…`, not recomputed.
- Billplz sandbox/live: paid callback with matching sen fulfills once; a second callback does not double commission.
- Deliberate amount mismatch: payment status `amount_mismatch`, orders stay unpaid, callback HTTP 200 JSON.
- `/uploads/…` images redirect to Storage.
- Admin product upload writes to Storage, path still `/uploads/{file}`.
