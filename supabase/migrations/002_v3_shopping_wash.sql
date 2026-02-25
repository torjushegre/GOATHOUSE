-- ============================================================
-- GOATHOUSE v3 migration: Shopping List + Wash Schedule
-- Run this in Supabase SQL Editor before deploying v3.
-- ============================================================

-- 1. Shopping items
create table shopping_items (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  checked    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table shopping_items enable row level security;
create policy "shopping_items open" on shopping_items
  for all using (true) with check (true);

-- 2. Wash weeks (one row per assigned week)
create table wash_weeks (
  id          uuid primary key default gen_random_uuid(),
  week_number int not null check (week_number between 1 and 53),
  year        int not null,
  player_id   uuid references players(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (week_number, year)
);

alter table wash_weeks enable row level security;
create policy "wash_weeks open" on wash_weeks
  for all using (true) with check (true);

-- 3. Wash tasks (5 per week)
create table wash_tasks (
  id            uuid primary key default gen_random_uuid(),
  wash_week_id  uuid not null references wash_weeks(id) on delete cascade,
  task_index    int not null check (task_index between 0 and 4),
  completed     boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (wash_week_id, task_index)
);

alter table wash_tasks enable row level security;
create policy "wash_tasks open" on wash_tasks
  for all using (true) with check (true);

-- 4. Enable realtime
alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table wash_tasks;

-- 5. REPLICA IDENTITY FULL on ice_events (needed for realtime DELETE)
alter table ice_events replica identity full;
