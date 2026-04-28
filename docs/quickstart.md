# Quickstart

## Objective
Get the first end-to-end flow working: upload PGN → parse games → show summary stats.

## Prerequisites
- Node.js 20+
- pnpm installed globally
- Supabase project created (free tier)

## Setup

```sh
pnpm install
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_ANON_KEY in .env
```

Apply the database schema:
```sh
# Run in Supabase SQL editor or via CLI
supabase db push  # if using Supabase CLI
# or paste supabase/schema.sql into the Supabase dashboard SQL editor
```

Start dev server:
```sh
pnpm dev
```

## First implementation steps
1. Create domain entities and ports (`shared/domain/`)
2. Implement `ChessJsPgnParserAdapter` (`app/adapters/pgn/`)
3. Build the analyze page with file upload (`app/pages/analyze.vue`)
4. Parse a known PGN and verify:
   - total games count matches expected
   - player color is identified correctly
   - opening names are extracted when present

## First validation
Use a known PGN file (e.g. a Lichess export of 10 games):
- Confirm parsed game count
- Confirm player color detection
- Confirm opening names extracted when ECO tags present
- Confirm graceful handling of missing eval/clock data

## Claude Code kickoff
```sh
claude   # open Claude Code at project root
# Toggle Plan Mode: Shift+Tab
# Prompt: "Read CLAUDE.md and .claude/rules/. Confirm understanding.
#          Propose first task from docs/tasks.md."
```
