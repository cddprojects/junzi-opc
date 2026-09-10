# Supabase design review (final, pre-implementation)

Status: **PLAN ONLY**. No SQL applied, no import run, `data/store.json` not deleted, no Vercel deploy.

This document is the approved plan plus the user’s overrides. Implementation must not start until this review is approved.

---

## Locked decisions

| Topic | Decision |
|---|---|
| Curriculum | `products.detail` stays **jsonb** (`CourseDetail`). Not normalized into lesson/live tables in v1. |
| Access | **Service-role only** on the Next.js server. No browser Supabase client in v1. |
| `revokeOrder` | Deletes the order row. **Does not** unwind commission, wallet, or payments already `paid`. |
| `VERIFY_SECRET` | **Env only**. Never a DB column. Never written back to `store.json`. |
| Uploads | Supabase Storage bucket `uploads`. Business rows keep `/uploads/{filename}`. |
| Shape | Relational tables for money, users, orders, payments. **Not** one JSON blob column for the store. |
| `orders.order_no` | **Immutable + UNIQUE**. Backfilled with the **old** display algorithm. After cutover, UI **never recomputes**. |
| Payments | First-class `payments` + `billplz_bills`. One Billplz bill → one payment → many orders. |
| Callback idempotency | Boundary = **payment**. Repeat callbacks must not re-fulfill, re-accrue, or re-credit. |
| Prod / Vercel | Missing Supabase env → **fail-fast**. No `store.json` fallback when `VERCEL=1` or `NODE_ENV=production`. |
| Local (non-Vercel) | File store still allowed if Supabase env is missing. |
| Sessions | Store **SHA-256 hash** of the bearer token. Cookie still holds the raw token. |
| Money | Catalog / snapshots in **CNY (numeric)**. Wallet, payment, commission, top-up, withdrawal in **MYR sen (bigint)**. |

Business rules unchanged: `MAX_COMMISSION_LEVELS = 3`, ledger insert-only, wallet buckets, withdrawal `pending → approved → paid \| rejected`.

---

## Money legend (read this first)

| Unit | Type | Where | Meaning |
|---|---|---|---|
| **CNY catalog** | `numeric` | `products.price_cny`, `products.original_price_cny` | List price in 人民币. Existing `Product.price` / `originalPrice`. |
| **CNY snapshot** | `numeric` | `orders.price_cny` | Unit catalog CNY copied at checkout. |
| **Browse / display amount** | `numeric` | `orders.price` + `orders.currency` | Unit price **in the shopper’s browse currency** (`CNY` / `MYR` / `USD` / `SGD`) via `fromCny`. **Not sen.** |
| **MYR major (legacy)** | `numeric` | `orders.amount_myr` | Cart-line total in ringgit (2 dp). Kept for display compatibility. **Not** the source of truth. |
| **MYR sen** | `bigint` | `orders.amount_sen`, all `payments.amount_sen`, wallets, ledger, top-ups, withdrawals | Integer sen. `100 sen = RM 1`. Source of truth for settlement and commission `baseSen`. |
| **FX** | `jsonb` | `settings.fx` | “1 unit of that currency = how many CNY”. `fx.CNY` is always `1`. |

Never mix: do not store catalog CNY in a `*_sen` column. Do not store sen in `numeric` money columns used for CNY.

---

## 1. Final table list

IDs stay text (`usr_…`, `ord_…`, `chk_…`, `pay_…`, `cms_…`, …) unless noted. Timestamps are `timestamptz`. Money sen is `bigint not null default 0` unless nullable is stated.

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | text **PK** | `usr_…` |
| `name` | text not null | |
| `email` | text | **UNIQUE** (NULL allowed, Postgres nulls-distinct) |
| `phone` | text | **UNIQUE** (NULL allowed) |
| `password_salt` | text not null | |
| `password_hash` | text not null | |
| `created_at` | timestamptz not null | |
| `member_until` | timestamptz | |
| `status` | text not null default `active` | **CHECK** `active` \| `disabled` |
| `referral_code` | text | **UNIQUE** (NULL allowed), normalized |
| `referrer_id` | text | **FK → users.id** `ON DELETE SET NULL` |
| `commission_balance_sen` | bigint not null default 0 | **MYR sen** |
| `topup_balance_sen` | bigint not null default 0 | **MYR sen** |

CHECK: both balances `>= 0`.

### `sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | text **PK** | `ses_…` (new surrogate; not the bearer) |
| `user_id` | text not null | **FK → users.id** `ON DELETE CASCADE` |
| `token_hash` | text not null | **UNIQUE**. `sha256` hex of raw cookie token |
| `expires_at` | timestamptz not null | 14 days from issue |
| `created_at` | timestamptz not null | |

Index: `user_id`, `expires_at`. **Never store the raw token.**

### `products`

| Column | Type | Notes |
|---|---|---|
| `slug` | text **PK** | |
| `title` / `title_en` | text | |
| `short_title` / `short_title_en` | text | |
| `price_cny` | numeric not null | **CNY catalog** |
| `original_price_cny` | numeric | **CNY catalog** |
| `sales` | int not null default 0 | Incremented only inside payment fulfill TX |
| `category_id` | text not null | **CHECK** `opc` \| `compute` |
| `cover` | text not null | Cover theme enum in app |
| `href` | text not null | |
| copy fields | text | subtitle*, gift_note*, description*, outline* |
| `cover_image` | text | `/uploads/…` or https |
| `detail_images` | text[] | `/uploads/…` |
| `detail` | jsonb | **CourseDetail** (lessons, lives, pillars, intro media) |

### `posters`

Current poster fields. `id` PK. `image` may be `/uploads/…`. `placement` CHECK `home-carousel` \| `home-banner`.

### `videos`

Current video fields. `id` PK. `product_slug` **FK → products.slug** optional `ON DELETE SET NULL`. `poster` / `video_url` may be `/uploads/…`.

### `settings` (singleton)

| Column | Type | Notes |
|---|---|---|
| `id` | int **PK** | Always `1` |
| `default_currency` | text not null | **CHECK** `CNY` \| `MYR` \| `USD` \| `SGD` |
| `fx` | jsonb not null | See money legend |

### `referral_plan` (singleton)

| Column | Type | Notes |
|---|---|---|
| `id` | int **PK** | Always `1` |
| `compression` | boolean not null | |
| `max_payout_sen` | bigint | **MYR sen**, null = no cap |
| `tiers` | jsonb not null | Exactly 3 slots; `MAX_COMMISSION_LEVELS` stays in code |

### `payments` (first-class)

One payment is the **idempotency and fulfillment root**.

| Column | Type | Notes |
|---|---|---|
| `id` | text **PK** | Import: deterministic (see §5). Runtime: `pay_…` |
| `user_id` | text not null | **FK → users.id** `ON DELETE RESTRICT` |
| `kind` | text not null | **CHECK** `order_cart` \| `topup` \| `wallet_cart` \| `demo_cart` \| `grant_cart` |
| `provider` | text not null | **CHECK** `billplz` \| `wallet` \| `demo` \| `grant` |
| `status` | text not null | **CHECK** `pending` \| `paid` \| `cancelled` \| `failed` |
| `amount_sen` | bigint not null | **MYR sen**, cart/top-up total |
| `checkout_id` | text | **UNIQUE** when set. `chk_…`. Null for top-up. |
| `created_at` | timestamptz not null | |
| `paid_at` | timestamptz | Set once when entering `paid` |
| `cancelled_at` | timestamptz | |
| `note` | text | |

CHECK: `amount_sen >= 0`.  
CHECK: `kind = topup` ↔ `checkout_id IS NULL`.  
CHECK: `kind IN (order_cart, wallet_cart, demo_cart, grant_cart)` → `checkout_id IS NOT NULL`.  
CHECK: `provider = billplz` → `kind IN (order_cart, topup)`.  
CHECK: `status = paid` → `paid_at IS NOT NULL`.

Index: `user_id`, `status`, `created_at`.

**Status machine (sticky `paid`):**

```
pending ──(provider paid / wallet debit / demo|grant)──► paid     [terminal success]
pending ──(deleteCheckout / bill create fail)────────► cancelled [terminal]
pending ──(explicit provider failure, optional)──────► failed    [terminal]
paid    ── any later unpaid / repeat paid ───────────► no-op     [do not reverse]
```

`paid` never moves back to `pending`. Unpaid Billplz callbacks while `pending` stay `pending` (Billplz often sends unpaid before paid). Unpaid after `paid` is ignored.

### `billplz_bills`

Independent provider table. **One bill → one payment → many orders.**

| Column | Type | Notes |
|---|---|---|
| `id` | text **PK** | Billplz bill id (provider unique) |
| `payment_id` | text not null | **UNIQUE FK → payments.id** `ON DELETE RESTRICT` |
| `url` | text | Hosted bill URL |
| `collection_id` | text | Optional snapshot |
| `amount_sen` | bigint not null | Amount sent to Billplz (**MYR sen**) |
| `status` | text not null | **CHECK** `created` \| `paid` \| `failed` |
| `paid_at` | timestamptz | |
| `last_callback_at` | timestamptz | Observability only |
| `created_at` | timestamptz not null | |

No second bill for the same `payment_id`. Repeat callbacks locate this row by `id`, then lock `payments`.

### `orders`

| Column | Type | Notes |
|---|---|---|
| `id` | text **PK** | `ord_…` |
| `order_no` | text not null | **UNIQUE**, immutable. `GO…` persisted. |
| `user_id` | text not null | **FK → users.id** `ON DELETE RESTRICT` |
| `payment_id` | text not null | **FK → payments.id** `ON DELETE RESTRICT` |
| `checkout_id` | text not null | Same as `payments.checkout_id` for cart kinds |
| `product_slug` | text not null | **FK → products.slug** `ON DELETE RESTRICT` |
| `product_title` | text not null | Denormalized snapshot |
| `price` | numeric not null | Browse-currency **unit** amount (not sen) |
| `price_cny` | numeric not null | **CNY snapshot** unit |
| `currency` | text not null | Browse currency CHECK |
| `qty` | int not null | `>= 1` |
| `created_at` | timestamptz not null | Used **only** at insert to compute `order_no` |
| `verify_code` | text | **UNIQUE** when set |
| `status` | text not null | **CHECK** `pending` \| `paid` |
| `paid_at` | timestamptz | |
| `pay_method` | text | **CHECK** `billplz` \| `demo` \| `grant` \| `wallet` |
| `amount_myr` | numeric | Legacy MYR major |
| `amount_sen` | bigint not null | **MYR sen** line total (commission base) |
| `referral_settled` | jsonb | Snapshot after accrue |
| `referral_skip` | jsonb | `{ reason }` when skipped |

**No** `billplz_bill_id` / `billplz_url` on `orders`. Repo hydrates them via `payment_id → billplz_bills` so existing UI/search keep working.

Index: `user_id`, `payment_id`, `checkout_id`, `status`, `created_at`, `order_no`.

`order_no` write rule: set once at INSERT (or import backfill). **No UPDATE** of `order_no` (enforce with trigger or revoke UPDATE privilege in app). Display reads `order_no` only.

Ref-verify fixtures (`ord_refverify_*`, `chk_refverify`, `bill_refverify`) still get a persisted `GO…`. UI continues to hide it via `isRefVerifyOrder` (id / checkout / bill), not by omitting `order_no`.

### `commission_ledger` (insert-only)

| Column | Type | Notes |
|---|---|---|
| `id` | text **PK** | `cms_…` |
| `kind` | text not null | **CHECK** `earn` \| `payout` \| `adjust` |
| `user_id` | text not null | **FK → users.id** (empty-string earn rows from unpaid slots: store NULL + allow `user_id` null for unpaid skip slots, or keep placeholder — **keep current behavior**: unpaid slots still insert with `userId: ""`. Prefer `user_id` nullable FK; import maps `""` → NULL) |
| `order_id` | text | **FK → orders.id** `ON DELETE RESTRICT` |
| `buyer_id` | text | **FK → users.id** |
| `buyer_name` | text | Snapshot |
| `tier` | int | 1..3 |
| `rate_percent` / `payout_type` / `fixed_sen` / `base_sen` | | rates in sen where applicable |
| `amount_sen` | bigint not null | **MYR sen** |
| `paid` | boolean not null | |
| `reason` / `note` | text | |
| `created_at` | timestamptz not null | |
| `relationship_snapshot` | jsonb | |

Partial unique (idempotency): **at most one earn set per order** — `UNIQUE (order_id) WHERE kind = 'earn'` is too strict (today one earn **row per tier**). Use:

- `UNIQUE (order_id, tier) WHERE kind = 'earn'`  
- plus application gate: if **any** `kind = earn` exists for `order_id`, skip the whole accrue.

### `wallet_transactions`

| Column | Type | Notes |
|---|---|---|
| `id` | text **PK** | `wtx_…` |
| `user_id` | text not null | **FK → users.id** |
| `amount_sen` | bigint not null | **MYR sen** (signed: debit negative) |
| `bucket` | text not null | **CHECK** `topup` \| `commission` |
| `kind` | text not null | Existing `WalletTxKind` enum |
| `source_type` | text not null | `topup` \| `order` \| `withdrawal` \| `commission` \| `admin` |
| `source_id` | text not null | |
| `note` | text | |
| `created_at` | timestamptz not null | |
| `balance_after_sen` | bigint not null | **MYR sen** after this tx |

**UNIQUE** `(source_type, source_id, kind)`.

### `withdrawals`

| Column | Type | Notes |
|---|---|---|
| `id` | text **PK** | `wd_…` |
| `user_id` | text not null | **FK → users.id** |
| `amount_sen` | bigint not null | **MYR sen**, `>= 1` |
| `status` | text not null | **CHECK** `pending` \| `approved` \| `paid` \| `rejected` |
| `created_at` / `approved_at` / `paid_at` / `rejected_at` / `settled_at` | timestamptz | |
| `note` | text | |
| `payout_bank` / `payout_holder` / `payout_account` | text | |

### `top_ups`

| Column | Type | Notes |
|---|---|---|
| `id` | text **PK** | `tup_…` |
| `user_id` | text not null | **FK → users.id** |
| `payment_id` | text not null | **UNIQUE FK → payments.id** |
| `amount_sen` | bigint not null | **MYR sen** |
| `status` | text not null | **CHECK** `pending` \| `credited` \| `failed` |
| `created_at` / `credited_at` | timestamptz | |
| `note` | text | |

No `billplz_bill_id` on this table. Hydrate via `payment_id → billplz_bills`.

### Intentionally absent

| Thing | Why |
|---|---|
| `verify_secret` column | Env only (`VERIFY_SECRET`) |
| Raw session token column | Hash only |
| One `store` jsonb blob | Relational |
| `orders.billplz_*` columns | Join through `payments` / `billplz_bills` |
| `checkouts` table | `checkout_id` on `payments` + `orders` is enough |

---

## 2. Constraints summary

**Keys**

- PKs as above.
- FKs: money tables `ON DELETE RESTRICT` (no silent cascade of paid history). Sessions cascade on user delete. `referrer_id` SET NULL.
- `billplz_bills.id` = provider bill id (global unique).
- `billplz_bills.payment_id` UNIQUE (one bill per payment).
- `payments.checkout_id` UNIQUE when present.
- `top_ups.payment_id` UNIQUE.
- `orders.order_no` UNIQUE NOT NULL.
- `orders.verify_code` UNIQUE when present.
- `wallet_transactions (source_type, source_id, kind)` UNIQUE.
- `commission_ledger (order_id, tier) WHERE kind = 'earn'` UNIQUE.
- Users: unique email / phone / referral_code (nulls distinct).

**Checks**

- User / withdrawal / top-up / payment status enums.
- Sen columns integer-valued (`bigint`); balances `>= 0`.
- Payment kind ↔ checkout_id XOR top-up.
- `paid` payments have `paid_at`.

**App-level (keep in repos, not only DB)**

- Referral cycle: `wouldCreateReferralCycle` on register / set referrer.
- Withdrawal: available = commission − pending/approved holds.
- Wallet checkout: debit **top-up bucket only**.
- Commission: max 3 tiers; T4+ visible, 不计佣.
- `revokeOrder`: no ledger unwind.
- `VERIFY_SECRET` required to mint `verify_code` in prod.

**RLS (v1)**

- Enable RLS on all tables.
- No policies for `anon` / `authenticated`.
- Server uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS).

---

## 3. Transaction boundaries

Each row is **one Postgres transaction** (RPC or a single server-side function). Lock `payments` with `SELECT … FOR UPDATE` whenever fulfillment might run.

| Op | One TX writes |
|---|---|
| `registerCustomer` | `users` + `sessions` |
| `loginCustomer` | prune expired sessions for user + insert `sessions` |
| `logout` / disable / password reset | delete that user’s sessions (+ user update) |
| `createPendingCheckout` | `payments` (`pending`, `order_cart`, `billplz`) + N `orders` (`pending`, `order_no` assigned) |
| `attachBillToCheckout` | insert `billplz_bills` (fail if payment already has a bill) |
| `deleteCheckout` | only if payment `pending`: `payments.status = cancelled` + delete pending `orders` + leave or delete unused `created` bill row (prefer keep bill row, status `failed`) |
| **`fulfillBillplzPayment` (callback / return)** | **Lock payment**. If already `paid`, commit no-op. Else: `billplz_bills` + `payments → paid` + either credit top-up **or** fulfill all orders in that payment (verify codes, sales++, memberUntil, commission earn + balances + wallet txs). **Never both** top-up and orders. |
| `createPendingTopUp` | `payments` (`topup`, `pending`) + `top_ups` (`pending`) |
| `attachBillToTopUp` | insert `billplz_bills` |
| `checkoutWithWallet` | `payments` (`wallet_cart`, **paid**) + debit wtx + N orders fulfilled + commission |
| `checkoutOrders` (demo/grant) | `payments` (`demo_cart` / `grant_cart`, **paid**) + fulfill + commission (same skip rules as today) |
| `requestWithdrawal` | `withdrawals` pending + hold wtx |
| `settleWithdrawal` approve | status only |
| `settleWithdrawal` reject | rejected + release wtx |
| `settleWithdrawal` pay | paid + commission debit wtx |
| `adjustUserWallet` | balance + admin wtx (+ ledger `adjust` if commission bucket) |
| `accrueCommissionForOrder` | same as credit-referral; no-op if any earn exists |
| Admin catalog CRUD | single product/poster/video; optional Storage delete of unused objects **after** commit |
| `revokeOrder` | delete **that** order only. If payment still `pending` and this was the last order, cancel payment. If payment `paid`, **do not** delete payment / ledger / bills. |

Billplz lookup order (unchanged rule, now via payments):

1. Find `billplz_bills.id = :billId`.
2. Load payment.
3. If `kind = topup` → credit top-up path.
4. Else → fulfill all `orders` with that `payment_id`.
5. If no bill row → error (do not guess).

---

## 4. Idempotency design

### Payment callback (primary)

**Key:** `billplz_bills.id` (Billplz bill id) → `payments.id`.

Algorithm:

1. Verify `x-signature` in the app (unchanged). Invalid → 4xx, no write.
2. `SELECT payment FOR UPDATE` via the bill row.
3. If no row → 404/log; do not create money.
4. If `payment.status = paid` → return 200, **zero** further writes (no fulfill, no commission, no wallet, no sales++, no memberUntil).
5. If `payment.status IN (cancelled, failed)` → return 200, no fulfill.
6. If callback is unpaid and payment is `pending` → update `last_callback_at` only.
7. If callback is paid and payment is `pending`:
   - **Top-up:** keep `assertTopUpAmountMatch`. Mismatch → do not credit; leave `pending` (or `failed`); throw like today (`充值金额不符`).
   - **Orders:** keep today’s rule (no amount match required when `reportedAmountSen` is null). If reported sen is present and ≠ `payment.amount_sen`, **do not fulfill** (safer than today); leave `pending` and log. Confirm on implementation if you want this extra guard.
   - Then run fulfill **once**, set `payment.status = paid`, `paid_at`, bill `status = paid`.
8. Return / callback racing each other: the row lock serializes them. Loser sees `paid` and no-ops.

`last_callback_at` must not be treated as fulfillment.

### Top-up credit

| Layer | Key |
|---|---|
| Payment | `payments.status = paid` |
| Row | `top_ups.status = credited` → return existing |
| Wallet | UNIQUE `(source_type='topup', source_id=top_up.id, kind='topup_credit')` |

All three sit in the same TX as the callback.

### Commission earn

| Layer | Key |
|---|---|
| Gate | If any `commission_ledger` row with `kind='earn'` and this `order_id` → skip entire accrue |
| DB | UNIQUE `(order_id, tier) WHERE kind='earn'` |
| Wallet | UNIQUE `(source_type='commission', source_id=ledger.id, kind='commission_earn')` |

Fulfill also skips `creditReferral` when the order is already paid (today: `alreadyPaid` skips accrue). Payment-level `paid` is the outer gate.

### Wallet txs

UNIQUE `(source_type, source_id, kind)` covers:

| kind | source_type | source_id |
|---|---|---|
| `topup_credit` | `topup` | `tup_…` |
| `purchase_debit` | `order` | `checkout_id` (unchanged) |
| `commission_earn` | `commission` | `cms_…` |
| `withdrawal_hold` / `release` / `paid` | `withdrawal` | `wd_…` |
| `admin_adjust` | `admin` | new `adj_…` each time (not idempotent — intentional) |

### Order / verify code

- `orders.id` PK.
- `orders.order_no` UNIQUE — insert-time only.
- `verify_code` UNIQUE; minted once inside fulfill if missing.
- Sales / memberUntil only when order transitions `pending → paid` inside the payment TX.

### Attach bill

- Insert `billplz_bills` with PK = provider id.
- UNIQUE `payment_id` → second attach is an error (do not overwrite a paid payment’s bill).

---

## 5. Migration mapping

Source of truth for import: local `data/store.json` + `data/uploads/`. **Do not delete either.** Re-run = upsert by PK. Print inserted / updated / skipped counts per table.

`verifySecret` in JSON is **not imported**. Script prints: set `VERIFY_SECRET` to that value once if env is empty.

### `store.json` → tables

| JSON path | Table.column |
|---|---|
| `users[].id` | `users.id` |
| `users[].name` | `users.name` |
| `users[].email` / `phone` | unique columns (blank → NULL) |
| `users[].passwordSalt` / `passwordHash` | `password_salt` / `password_hash` |
| `users[].createdAt` | `created_at` |
| `users[].memberUntil` | `member_until` |
| `users[].status` | `status` (default `active`) |
| `users[].referralCode` | `referral_code` (normalized) |
| `users[].referrerId` | `referrer_id` |
| `users[].commissionBalanceSen` | `commission_balance_sen` |
| `users[].topUpBalanceSen` | `topup_balance_sen` |
| `sessions[]` | see session hash below |
| `products[]` | `products` (`price` → `price_cny`, `originalPrice` → `original_price_cny`, `detail` → jsonb) |
| `posters[]` / `videos[]` | same names, snake_case columns |
| `settings` | `settings` id=1 |
| `referralPlan` | `referral_plan` id=1 |
| `orders[]` | `orders` + synthesized `payments` / `billplz_bills` |
| `orders[].referralSettled` | `orders.referral_settled` jsonb |
| `orders[].referralSkip` | `orders.referral_skip` jsonb |
| `commissionLedger[]` | `commission_ledger` (`userId === ""` → NULL) |
| `walletTransactions[]` | `wallet_transactions` |
| `withdrawals[]` | `withdrawals` (normalize legacy `requested`/`settled`) |
| `topUps[]` | `top_ups` + synthesized `payments` / `billplz_bills` |
| `verifySecret` | **ignored** (env) |
| `version` | ignored |

Upload path strings (`/uploads/…`) are copied **verbatim** into image/video columns.

### `order_no` backfill (once, then freeze)

Use the **current** `displayOrderNo` algorithm from `lib/orders-ui.ts` — do not invent a new format:

```
stamp = YYYYMMDDHHmm from createdAt in local/ISO parse
        or "000000000000" if invalid date
tail  = id without leading "ord_", strip dashes, last 6 chars, UPPERCASE
order_no = "GO" + stamp + tail
```

- Run on **every** order, including `ord_refverify_*`.
- Persist. Upsert conflict on `id` does not recompute `order_no` if the row already has one (idempotent).
- After cutover, `displayOrderNo` / `publicOrderNo` **read `order.orderNo` only**. `publicOrderNo` still returns `null` for ref-verify.
- New runtime inserts: generate `id` + `createdAt`, compute `order_no` with the same function **once**, INSERT. On rare `order_no` unique violation, mint a new `id` and retry (do not change the algorithm).

Search: match `order_no` and `id` (and hydrated bill id).

### Existing checkout / Billplz → `payments` + `billplz_bills`

Group **orders** (priority order):

1. Same non-empty `billplzBillId` → one payment.
2. Else same non-empty `checkoutId` → one payment.
3. Else orphan line → one payment per order.

Deterministic payment ids (import idempotent):

| Group | `payments.id` |
|---|---|
| Has `billplzBillId` | `pay_bill_{billplzBillId}` |
| Else has `checkoutId` | `pay_{checkoutId}` |
| Orphan order | `pay_{order.id}` |

Payment fields from the group:

| Field | Rule |
|---|---|
| `user_id` | All lines must share one user; else fail that group |
| `checkout_id` | Shared `checkoutId`, or `chk_mig_{order.id}` for orphans |
| `amount_sen` | Sum of line `amountSen` (or `round(amountMyr * 100)`) |
| `kind` / `provider` / `status` | see table below |
| `paid_at` | Max of paid order `paidAt` if any paid |

| Existing payMethod / state | `kind` | `provider` | `status` |
|---|---|---|---|
| `billplz` or has bill, any unpaid | `order_cart` | `billplz` | `pending` if all pending, else `paid` if all paid |
| Mixed paid/pending same bill | — | — | **Fail group, report** (dirty data) |
| `wallet` | `wallet_cart` | `wallet` | `paid` |
| `demo` | `demo_cart` | `demo` | `paid` if orders paid |
| `grant` | `grant_cart` | `grant` | `paid` if orders paid |
| Ref-verify (`bill_refverify`) | `order_cart` | `billplz` | as orders (`paid` if paid) |

`billplz_bills` when `billplzBillId` present:

- `id` = that bill id  
- `payment_id` = group payment id  
- `url` = first `billplzUrl`  
- `amount_sen` = `payment.amount_sen`  
- `status` = `paid` if payment paid else `created`

**Top-ups:**

| Group | `payments.id` |
|---|---|
| Has `billplzBillId` | `pay_bill_{billplzBillId}` |
| Else | `pay_{topUp.id}` |

`kind=topup`, `provider=billplz` (or `demo` if no bill — should not happen), `amount_sen=topUp.amountSen`, status `paid` iff `credited`.

**Conflict:** same `billplzBillId` on a top-up **and** an order group → **fail import for that id** (today’s callback treats it as top-up-only; do not silently drop orders).

Each order gets `payment_id` + `checkout_id` set. Each top-up gets `payment_id`.

### Session token → hash

```
token_hash = SHA-256(UTF-8 raw token) as lowercase hex (64 chars)
```

- Import: hash `sessions[].token`; do **not** persist plaintext.
- `sessions.id` = `ses_` + first 16 of hash (or new id); `token_hash` UNIQUE is the lookup key.
- Skip expired sessions (optional; can import and let reads filter).
- Runtime: cookie `opc_user_session` still stores the **raw** token; `customerFromToken` hashes then `SELECT WHERE token_hash = $1`.
- Existing cookies keep working after import of the hashed current tokens.
- Logout / disable: delete by `token_hash` or by `user_id`.

### Uploads → Storage

- Bucket: `uploads`, public read.
- Object key: filename only (`{uuid}.ext`), same as today’s `/uploads/{filename}`.
- Import: for each file in `data/uploads/` (skip `.parts`), upload if object missing.
- Rows keep `/uploads/{filename}`.
- `app/uploads/[...path]` on Vercel: redirect (or proxy) to  
  `{NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/{filename}`.
- Local file mode: keep serving from `data/uploads/`.
- Admin upload (Vercel): one-shot or memory assemble → Storage. Never `mkdir` `data/`.
- `releaseUnusedUploads`: collect refs from DB columns + `products.detail` jsonb, delete unreferenced Storage objects.

### Display / API compatibility after cutover

Repo functions keep today’s names (`getCatalog`, `createPendingCheckout`, `fulfillBillplzPayment`, …). Hydrate `Order.billplzBillId` / `billplzUrl` / `orderNo` for UI. Stop calling `readStore` / `writeStore` in production.

---

## 6. Env fail-fast rules

**Required names** (`.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # unused in v1; optional

VERIFY_SECRET=
ADMIN_PASSWORD=
BILLPLZ_API_KEY=
BILLPLZ_COLLECTION_ID=
BILLPLZ_X_SIGNATURE_KEY=
BILLPLZ_SANDBOX=
NEXT_PUBLIC_SITE_URL=
# or existing NEXT_PUBLIC_APP_URL — pick one name at implement time and document
ALLOW_DEMO_PAY=
```

**Runtime selection**

| Environment | Missing `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` | Missing `VERIFY_SECRET` |
|---|---|---|
| `VERCEL=1` | **Throw at first data access** (module init preferred). No `store.json`, no `/tmp`, no `data/` mkdir. | **Throw** before minting or verifying course codes. |
| `NODE_ENV=production` (any host) | Same fail-fast. | Same fail-fast. |
| Local, not Vercel, not production | File store (`data/store.json` + `data/uploads/`) allowed. | May read legacy `store.verifySecret` **only in this mode**; still prefer env. |

If Supabase env is **complete** locally, use Supabase (do not dual-write).

Service role is server-only. Never prefix it `NEXT_PUBLIC_`.

---

## 7. Open risks

None of these block the schema; they need a yes/no at implementation kickoff if you care.

1. **Order callback amount guard** — today orders do not compare `reportedAmountSen` to the cart. Proposal: if Billplz reports a sen amount and it ≠ `payments.amount_sen`, do not fulfill. Top-up already throws. Default in this review: **add the guard**.
2. **`order_no` collision on backfill** — same minute + same last-6 of `id`. Extremely unlikely. Import should **fail that row** rather than mutate the algorithm. Runtime: retry with a new `id`.
3. **Dirty store groups** — mixed paid/pending on one bill, or bill id on both top-up and orders. Import fails those groups; operator fixes JSON first.
4. **Commission rows with empty `userId`** — nullable FK. Confirm no UI assumes `""`.
5. **Large `detail` jsonb / video files** — Storage import of `.mp4` must run from a machine that has `data/uploads/`, not from an empty Vercel clone.
6. **Local agent pointed at prod Supabase** — one env slip overwrites prod. Use a separate Supabase project for preview.
7. **Return URL vs callback** — both call fulfill; TX + payment `paid` handles it. Still return 200 on repeats so Billplz stops retrying.
8. **`amount_myr` float** — keep column; never use it to recompute sen after import if `amount_sen` is present.

No remaining product-scope questions from the previous eight decisions except risk #1.

---

## 8. What this turn did not do

- No SQL migration applied  
- No import script executed  
- `data/store.json` / `data/uploads/` not deleted or rewritten  
- No Vercel deploy  
- No UI redesign  

---

**Ready for your approval before implementation.**

Please confirm **risk #1** (reject order fulfill when Billplz reported sen ≠ `payment.amount_sen`). Everything else in this document is treated as the implementation spec once you approve.