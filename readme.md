# GOATHOUSE

Household fun tracker for the gang — Smirnoff ICE scoreboard and trip bingo boards.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4
- **Database:** Supabase (Postgres + realtime websockets)
- **Hosting:** Vercel

## Project structure

```
GOATHOUSE/
├── .env.example                          # Required env vars
├── index.html                            # Vite entry point
├── package.json
├── vite.config.ts
├── supabase/migrations/
│   └── 001_initial_schema.sql            # Full schema + seed data (run manually)
└── src/
    ├── main.tsx                           # React root
    ├── index.css                          # Tailwind import
    ├── App.tsx                            # Router with 3 routes
    ├── lib/supabase.ts                    # Supabase client singleton
    ├── types/database.ts                  # TS interfaces matching schema
    ├── components/
    │   ├── Layout.tsx                     # Bottom tab nav + Outlet
    │   └── PlayerPicker.tsx               # Reusable player dropdown
    ├── pages/
    │   ├── HomePage.tsx                   # Two cards linking to /ice and /bingo
    │   ├── IcePage.tsx                    # Scoreboard + event feed + log form
    │   └── BingoPage.tsx                  # Player tabs + 5x5 grid + cell editing
    └── hooks/
        ├── usePlayers.ts                  # Fetch all players
        ├── useIceEvents.ts                # Fetch + realtime subscription
        ├── useIceScores.ts                # Compute scores from events
        └── useBingoBoard.ts               # Fetch + manage cells for one board
```

## Local setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Run it — this creates all tables, enables RLS with open policies, enables realtime, and seeds 5 players with bingo boards

### 2. Environment variables

```bash
cp .env.example .env
```

Fill in your Supabase project URL and anon key (found in **Project Settings → API**):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deploy to Vercel

1. Push the repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Vercel auto-detects Vite — no config needed
4. Add the two environment variables in **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

## Features

### Smirnoff ICE (`/ice`)
- Scoreboard ranked by score (placer +1, victim -1)
- Log new icings with placer, victim, and optional comment
- Live event feed with realtime updates

### Trip Bingo (`/bingo`)
- One 5x5 board per bingo participant (3 players)
- Tap empty cell → enter challenge text
- Tap filled cell → toggle completed
- Double-tap filled cell → edit text
- Realtime sync across devices

## Notes

- **No auth** — trust-based, all RLS policies are open
- **Scores are computed client-side** from the event log (few players, few events)
- **Realtime** via Supabase websocket subscriptions on `ice_events` and `bingo_cells`
- Player names in the seed data are placeholders — edit them in Supabase or in the migration SQL before running it
