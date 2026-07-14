-- Τρέξε ολόκληρο το αρχείο στο Supabase Dashboard > SQL Editor > New query.
-- Δημιουργεί μία κοινόχρηστη εγγραφή για όλο το πρόγραμμα.

create table if not exists public.loading_planner_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table public.loading_planner_state enable row level security;

grant select, insert, update, delete on public.loading_planner_state to anon;
grant select, insert, update, delete on public.loading_planner_state to authenticated;

drop policy if exists "public read loading planner" on public.loading_planner_state;
create policy "public read loading planner"
on public.loading_planner_state for select
to anon, authenticated
using (true);

drop policy if exists "public insert loading planner" on public.loading_planner_state;
create policy "public insert loading planner"
on public.loading_planner_state for insert
to anon, authenticated
with check (id = 'shared-loading-planner');

drop policy if exists "public update loading planner" on public.loading_planner_state;
create policy "public update loading planner"
on public.loading_planner_state for update
to anon, authenticated
using (id = 'shared-loading-planner')
with check (id = 'shared-loading-planner');

drop policy if exists "public delete loading planner" on public.loading_planner_state;
create policy "public delete loading planner"
on public.loading_planner_state for delete
to anon, authenticated
using (id = 'shared-loading-planner');

-- Ενεργοποίηση Realtime για άμεση ενημέρωση στις άλλες συσκευές.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='loading_planner_state'
  ) then
    alter publication supabase_realtime add table public.loading_planner_state;
  end if;
end $$;
