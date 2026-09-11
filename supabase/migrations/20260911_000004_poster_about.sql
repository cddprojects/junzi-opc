alter table public.posters drop constraint if exists posters_placement_check;
alter table public.posters
  add constraint posters_placement_check
  check (placement in ('home-carousel', 'home-banner', 'workshop', 'events', 'member', 'about', 'home-ai', 'ai-tools'));
