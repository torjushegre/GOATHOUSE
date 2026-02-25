-- ============================================
-- GOATHOUSE schema — run in Supabase SQL Editor
-- ============================================

-- Players
create table players (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  is_bingo_participant boolean not null default false,
  created_at timestamptz default now() not null
);

-- ICE events (scores: placer +1, victim -1)
create table ice_events (
  id uuid default gen_random_uuid() primary key,
  placer_id uuid not null references players(id),
  victim_id uuid not null references players(id),
  comment text,
  created_at timestamptz default now() not null,
  constraint different_players check (placer_id != victim_id)
);

-- Bingo boards (one per bingo participant)
create table bingo_boards (
  id uuid default gen_random_uuid() primary key,
  player_id uuid not null references players(id) unique,
  created_at timestamptz default now() not null
);

-- Bingo cells (25 per board)
create table bingo_cells (
  id uuid default gen_random_uuid() primary key,
  board_id uuid not null references bingo_boards(id) on delete cascade,
  "row" smallint not null check ("row" between 0 and 4),
  col smallint not null check (col between 0 and 4),
  challenge_text text not null default '',
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  unique (board_id, "row", col)
);

-- Indexes
create index idx_ice_events_created on ice_events(created_at desc);
create index idx_bingo_cells_board on bingo_cells(board_id);

-- RLS: open policies (no auth, trust-based)
alter table players enable row level security;
alter table ice_events enable row level security;
alter table bingo_boards enable row level security;
alter table bingo_cells enable row level security;

create policy "open_players" on players for all using (true) with check (true);
create policy "open_ice_events" on ice_events for all using (true) with check (true);
create policy "open_bingo_boards" on bingo_boards for all using (true) with check (true);
create policy "open_bingo_cells" on bingo_cells for all using (true) with check (true);

-- Enable realtime
alter publication supabase_realtime add table ice_events;
alter publication supabase_realtime add table bingo_cells;

-- ============================================
-- Seed data
-- ============================================

-- 5 players, 3 are bingo participants
insert into players (name, is_bingo_participant) values
  ('Spansen', true),
  ('Ansen', true),
  ('Hansen', true),
  ('Jansen', false),
  ('Finnansen', false);

-- Create bingo boards + 25 empty cells for each bingo participant
do $$
declare
  p record;
  board_uuid uuid;
  r int;
  c int;
begin
  for p in select id from players where is_bingo_participant = true loop
    insert into bingo_boards (player_id) values (p.id) returning id into board_uuid;
    for r in 0..4 loop
      for c in 0..4 loop
        insert into bingo_cells (board_id, "row", col) values (board_uuid, r, c);
      end loop;
    end loop;
  end loop;
end $$;
