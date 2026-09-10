alter table public.posters drop constraint if exists posters_placement_check;
alter table public.posters
  add constraint posters_placement_check
  check (placement in ('home-carousel', 'home-banner', 'workshop', 'events', 'member', 'home-ai'));

alter table public.posters add column if not exists product_slug text;
alter table public.posters add column if not exists detail_images text[];
