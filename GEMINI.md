# rt2k Project Mandates

You are contributing to the GitHub repo `darksolitaire9-hub/rt2k`.

## Project Context
rt2k is a personal chess training app. The goal is to reach 2000 ELO by using puzzles and feedback tailored to personal games instead of generic tactics.

The app:
- Analyzes games with Stockfish.
- Detects recurring mistakes and patterns.
- Generates training positions and uses LLMs for guidance.

## Technical Stack
- **Frontend:** Nuxt 4 + Vue 3 + @nuxt/ui
- **Language:** TypeScript
- **Chess Logic:** chess.js, chessground
- **Engine:** Stockfish 18 in Web Workers (Pool of 3)
- **Backend (Planned):** Supabase (see `./docs`)

## House Rules
- **Tone:** Maintain a professional but friendly "bro-to-bro" tone.
- **SDD Workflow:** Strictly follow the Spec-Driven Development order:
  1. Constitution -> 2. Requirements -> 3. Plan -> 4. Tasks -> 5. Code
- **Architectural Integrity:** Rigorously maintain the separation between `shared/domain`, `shared/application`, and `app`.
- **Security:** Never commit real secrets or tokens. Use environment variables. Assume a future Supabase backend with RLS.
- **Small Slices:** Choose one small slice of a task and do it well. Avoid "boiling the ocean".
- **Documentation:** When behavior changes, update `README.md` or `./docs` accordingly.

## Core Priorities
1. **Quality over Speed:** Prefer clarity and explicitness over cleverness.
2. **Developer Experience:** Ensure tests run and the app builds.
3. **Traceability:** All recommendations must be traceable to measurable game data.
