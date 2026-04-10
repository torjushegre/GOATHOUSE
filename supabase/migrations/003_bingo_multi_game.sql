-- ============================================================
-- GOATHOUSE v4 migration: multi-game bingo
--   - Introduces bingo_games (name, size, archived_at).
--   - Links bingo_boards to a game (backfilled into a seed
--     "Alicante 2026" game that is immediately archived so the
--     existing 5x5 boards are preserved as an earlier game).
--   - Supports 4x4 and 5x5 boards going forward.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. New bingo_games table
create table bingo_games (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  size        smallint not null check (size in (4, 5)),
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);

alter table bingo_games enable row level security;
create policy "open_bingo_games" on bingo_games
  for all using (true) with check (true);

-- 2. Seed the "earlier game" row that the existing boards will belong to.
--    It is archived immediately so the UI treats it as read-only history.
insert into bingo_games (name, size, archived_at)
values ('Alicante 2026', 5, now());

-- 3. Add game_id to bingo_boards, backfill from the seed game, then lock it down.
alter table bingo_boards
  add column game_id uuid references bingo_games(id) on delete cascade;

update bingo_boards
  set game_id = (select id from bingo_games where name = 'Alicante 2026')
  where game_id is null;

alter table bingo_boards
  alter column game_id set not null;

-- 4. Swap uniqueness: a player may now have one board per game.
alter table bingo_boards drop constraint bingo_boards_player_id_key;
alter table bingo_boards
  add constraint bingo_boards_player_game_key unique (player_id, game_id);

-- 5. Realtime on bingo_games so game creation/rename propagates across tabs.
alter publication supabase_realtime add table bingo_games;
