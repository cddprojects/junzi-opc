-- Junzi OPC persistent store → Supabase Postgres
-- Apply in the Supabase SQL editor or via CLI. Idempotent-enough for a fresh project.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id text primary key,
  name text not null,
  email text,
  phone text,
  password_salt text not null,
  password_hash text not null,
  created_at timestamptz not null,
  member_until timestamptz,
  status text not null default 'active',
  referral_code text,
  referrer_id text references public.users (id) on delete set null,
  commission_balance_sen bigint not null default 0,
  topup_balance_sen bigint not null default 0,
  constraint users_status_check check (status in ('active', 'disabled')),
  constraint users_commission_balance_check check (commission_balance_sen >= 0),
  constraint users_topup_balance_check check (topup_balance_sen >= 0)
);

create unique index if not exists users_email_uidx on public.users (email) where email is not null;
create unique index if not exists users_phone_uidx on public.users (phone) where phone is not null;
create unique index if not exists users_referral_code_uidx on public.users (referral_code) where referral_code is not null;

-- ---------------------------------------------------------------------------
-- sessions (hash of bearer only)
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id text primary key,
  user_id text not null references public.users (id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index if not exists sessions_token_hash_uidx on public.sessions (token_hash);
create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists sessions_expires_at_idx on public.sessions (expires_at);

-- ---------------------------------------------------------------------------
-- catalog
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  slug text primary key,
  title text not null,
  title_en text,
  short_title text not null,
  short_title_en text,
  price_cny numeric not null,
  original_price_cny numeric,
  sales integer not null default 0,
  category_id text not null,
  cover text not null,
  href text not null,
  subtitle text,
  subtitle_en text,
  gift_note text,
  gift_note_en text,
  description text,
  description_en text,
  outline text,
  outline_en text,
  cover_image text,
  detail_images text[],
  detail jsonb,
  constraint products_category_check check (category_id in ('opc', 'compute'))
);

create table if not exists public.posters (
  id text primary key,
  title text not null,
  title_en text,
  href text not null,
  sort integer not null default 0,
  placement text not null,
  image text,
  subtitle text,
  subtitle_en text,
  kicker text,
  kicker_en text,
  price_label text,
  price_label_en text,
  theme text,
  constraint posters_placement_check check (placement in ('home-carousel', 'home-banner'))
);

create table if not exists public.videos (
  id text primary key,
  title text not null,
  title_en text,
  poster text,
  video_url text,
  duration text,
  product_slug text references public.products (slug) on delete set null,
  overlay text,
  overlay_en text,
  placement text not null,
  constraint videos_placement_check check (placement in ('home-intro', 'home-case', 'product-hero', 'library'))
);

create table if not exists public.settings (
  id integer primary key check (id = 1),
  default_currency text not null,
  fx jsonb not null,
  constraint settings_currency_check check (default_currency in ('CNY', 'MYR', 'USD', 'SGD'))
);

create table if not exists public.referral_plan (
  id integer primary key check (id = 1),
  compression boolean not null default false,
  max_payout_sen bigint,
  tiers jsonb not null
);

-- ---------------------------------------------------------------------------
-- payments (fulfillment + idempotency root)
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id text primary key,
  user_id text not null references public.users (id) on delete restrict,
  kind text not null,
  provider text not null,
  status text not null,
  amount_sen bigint not null,
  checkout_id text,
  created_at timestamptz not null,
  paid_at timestamptz,
  cancelled_at timestamptz,
  note text,
  expected_amount_sen bigint,
  received_amount_sen bigint,
  mismatch_billplz_bill_id text,
  callback_received_at timestamptz,
  constraint payments_kind_check check (kind in ('order_cart', 'topup', 'wallet_cart', 'demo_cart', 'grant_cart')),
  constraint payments_provider_check check (provider in ('billplz', 'wallet', 'demo', 'grant')),
  constraint payments_status_check check (status in ('pending', 'paid', 'cancelled', 'failed', 'amount_mismatch')),
  constraint payments_amount_check check (amount_sen >= 0),
  constraint payments_checkout_kind_check check (
    (kind = 'topup' and checkout_id is null)
    or (kind in ('order_cart', 'wallet_cart', 'demo_cart', 'grant_cart') and checkout_id is not null)
  ),
  constraint payments_provider_kind_check check (
    (provider = 'billplz' and kind in ('order_cart', 'topup'))
    or (provider <> 'billplz')
  ),
  constraint payments_paid_at_check check (status <> 'paid' or paid_at is not null)
);

create unique index if not exists payments_checkout_id_uidx on public.payments (checkout_id) where checkout_id is not null;
create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_created_at_idx on public.payments (created_at);

create table if not exists public.billplz_bills (
  id text primary key,
  payment_id text not null unique references public.payments (id) on delete restrict,
  url text,
  collection_id text,
  amount_sen bigint not null,
  status text not null,
  paid_at timestamptz,
  last_callback_at timestamptz,
  created_at timestamptz not null default now(),
  constraint billplz_bills_status_check check (status in ('created', 'paid', 'failed'))
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id text primary key,
  order_no text not null,
  user_id text not null references public.users (id) on delete restrict,
  payment_id text not null references public.payments (id) on delete restrict,
  checkout_id text not null,
  product_slug text not null references public.products (slug) on delete restrict,
  product_title text not null,
  price numeric not null,
  price_cny numeric not null,
  currency text not null,
  qty integer not null,
  created_at timestamptz not null,
  verify_code text,
  status text not null,
  paid_at timestamptz,
  pay_method text,
  amount_myr numeric,
  amount_sen bigint not null,
  referral_settled jsonb,
  referral_skip jsonb,
  constraint orders_qty_check check (qty >= 1),
  constraint orders_status_check check (status in ('pending', 'paid')),
  constraint orders_currency_check check (currency in ('CNY', 'MYR', 'USD', 'SGD')),
  constraint orders_pay_method_check check (pay_method is null or pay_method in ('billplz', 'demo', 'grant', 'wallet'))
);

create unique index if not exists orders_order_no_uidx on public.orders (order_no);
create unique index if not exists orders_verify_code_uidx on public.orders (verify_code) where verify_code is not null;
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_payment_id_idx on public.orders (payment_id);
create index if not exists orders_checkout_id_idx on public.orders (checkout_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at);

create or replace function public.forbid_order_no_update()
returns trigger
language plpgsql
as $$
begin
  if new.order_no is distinct from old.order_no then
    raise exception 'orders.order_no is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_order_no_immutable on public.orders;
create trigger orders_order_no_immutable
before update on public.orders
for each row
execute function public.forbid_order_no_update();

-- ---------------------------------------------------------------------------
-- finance
-- ---------------------------------------------------------------------------
create table if not exists public.commission_ledger (
  id text primary key,
  kind text not null,
  user_id text references public.users (id) on delete restrict,
  order_id text references public.orders (id) on delete restrict,
  buyer_id text references public.users (id) on delete restrict,
  buyer_name text,
  tier integer,
  rate_percent numeric,
  payout_type text,
  fixed_sen bigint,
  base_sen bigint,
  amount_sen bigint not null,
  paid boolean not null default false,
  reason text,
  created_at timestamptz not null,
  note text,
  relationship_snapshot jsonb,
  constraint commission_kind_check check (kind in ('earn', 'payout', 'adjust'))
);

create unique index if not exists commission_earn_order_tier_uidx
  on public.commission_ledger (order_id, tier)
  where kind = 'earn' and order_id is not null and tier is not null;
create index if not exists commission_user_id_idx on public.commission_ledger (user_id);
create index if not exists commission_order_id_idx on public.commission_ledger (order_id);

create table if not exists public.wallet_transactions (
  id text primary key,
  user_id text not null references public.users (id) on delete restrict,
  amount_sen bigint not null,
  bucket text not null,
  kind text not null,
  source_type text not null,
  source_id text not null,
  note text,
  created_at timestamptz not null,
  balance_after_sen bigint not null,
  constraint wallet_tx_bucket_check check (bucket in ('topup', 'commission')),
  constraint wallet_tx_kind_check check (kind in (
    'topup_credit',
    'commission_earn',
    'withdrawal_hold',
    'withdrawal_release',
    'withdrawal_paid',
    'admin_adjust',
    'purchase_debit'
  ))
);

create unique index if not exists wallet_tx_source_uidx
  on public.wallet_transactions (source_type, source_id, kind);
create index if not exists wallet_tx_user_id_idx on public.wallet_transactions (user_id);

create table if not exists public.withdrawals (
  id text primary key,
  user_id text not null references public.users (id) on delete restrict,
  amount_sen bigint not null,
  status text not null,
  created_at timestamptz not null,
  approved_at timestamptz,
  paid_at timestamptz,
  rejected_at timestamptz,
  settled_at timestamptz,
  note text,
  payout_bank text,
  payout_holder text,
  payout_account text,
  constraint withdrawals_amount_check check (amount_sen >= 1),
  constraint withdrawals_status_check check (status in ('pending', 'approved', 'paid', 'rejected'))
);

create index if not exists withdrawals_user_id_idx on public.withdrawals (user_id);

create table if not exists public.top_ups (
  id text primary key,
  user_id text not null references public.users (id) on delete restrict,
  payment_id text not null unique references public.payments (id) on delete restrict,
  amount_sen bigint not null,
  status text not null,
  created_at timestamptz not null,
  credited_at timestamptz,
  note text,
  constraint top_ups_status_check check (status in ('pending', 'credited', 'failed')),
  constraint top_ups_amount_check check (amount_sen >= 0)
);

-- ---------------------------------------------------------------------------
-- RLS: service role only (no anon / authenticated policies)
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.products enable row level security;
alter table public.posters enable row level security;
alter table public.videos enable row level security;
alter table public.settings enable row level security;
alter table public.referral_plan enable row level security;
alter table public.payments enable row level security;
alter table public.billplz_bills enable row level security;
alter table public.orders enable row level security;
alter table public.commission_ledger enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.top_ups enable row level security;
