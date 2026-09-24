create table if not exists public.feedback (
  id text primary key,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
