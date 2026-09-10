alter table public.posters drop constraint if exists posters_placement_check;
alter table public.posters
  add constraint posters_placement_check
  check (placement in ('home-carousel', 'home-banner', 'workshop', 'events', 'member', 'home-ai', 'ai-tools'));

update public.posters set placement = 'ai-tools' where placement = 'home-ai';
