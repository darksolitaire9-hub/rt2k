# UI & UX Guidelines — rt2k

## Design principles

- Mobile-first:
  - Design for a ~360–400px wide screen first.
  - No horizontal scrolling on key flows.
  - Large tap targets and readable text.
- Clarity over cleverness:
  - Show leaks as simple cards with clear labels and metrics.
  - Use plain language (“You lose many games on time”) instead of jargon.
- Consistency:
  - Use Nuxt UI components for buttons, inputs, cards, tables where possible.
  - Use a small, consistent color palette for win/loss/leak severity.

## Libraries

- **Nuxt UI** for base components (buttons, inputs, cards, modals).
- **chessground** for the chessboard.
- **Tailwind or Nuxt UI’s utility classes** for layout and spacing (if enabled).

---

## Screen 1 — Analyze (upload PGN)

**Route:** `/analyze`

### Mobile layout

- Single column, full-width content.
- Sections in order:

  1. **Header**
     - App name and short subtitle: “Upload your games, find your leaks.”
  2. **PGN Upload card**
     - Nuxt UI card with:
       - file input (drop area + “Choose file” button),
       - text: “We analyze games locally in your browser.”
     - After file selected: show file name and “Analyze” button.
  3. **Progress + basic stats (after analysis)**
     - Small card showing:
       - total games parsed,
       - win/loss/draw counts,
       - time-loss count.

### Desktop layout

- Same sections, but:
  - Optionally place upload + stats side-by-side in two columns.
  - Keep a single clear flow; do not rely on hover-only UI.

### Nuxt UI components to use

- `UCard` for upload and stats.
- `UButton` for “Analyze” action.
- `UAlert` for errors (invalid PGN, too large, etc.).

---

## Screen 2 — Leak report

**Route:** `/analyze` (same page, below upload) or `/analyses/[id]`

### Mobile layout

Order:

1. **Summary card**
   - Rating range, game count, general win rate.
2. **Leak cards (top 3)**
   - Each leak as a `UCard`:
     - title: e.g., “Time trouble”, “Opening problems (Pirc, Philidor)”.
     - score (0–100) with severity color:
       - green (0–40), amber (40–70), red (70–100).
     - 1–2 bullet evidence lines:
       - “60% of losses are on time.”
       - “Worst results in Pirc Defense: 33% win rate.”
     - “Train this” button that scrolls to / filters relevant puzzles.
3. **Opening breakdown**
   - Collapsible card showing:
     - top openings (table with name, games, win rate).
     - highlight worst/best openings with color.

All stacked vertically, full width.

### Desktop layout

- Two-column on larger screens:
  - Left: summary + leaks.
  - Right: opening breakdown + maybe a small chart later.
- Avoid dense tables; keep leak cards prominent.

### Nuxt UI components

- `UCard` for leaks and summary.
- `UBadge` for leak severity.
- Optional: `UTabs` if you split into “Leaks / Openings / Puzzles” sections.

---

## Screen 3 — Puzzle training

**Route:** `/puzzles` and `/puzzles/[id]`

### Mobile layout

- **Puzzle list view (`/puzzles`)**
  - Vertical list of puzzle cards:
    - source (e.g., “From your game vs Alice, 2025‑04‑12” or “From database”),
    - leak type (time, tactics, opening),
    - theme (fork, pin, back-rank),
    - “Solve” button.
- **Single puzzle view (`/puzzles/[id]`)**
  - Top: chessboard (chessground) full-width, square ratio.
  - Below the board:
    - description: “White to move and win. From your game vs …”
    - controls:
      - “Reset”
      - “Show hint”
      - “Show solution”
    - feedback area: “Correct”, “Try again”, or brief explanation.

Everything scrolls vertically; no side-by-side boards on mobile.

### Desktop layout

- Puzzle board on the left, controls and move list on the right.
- Ensure mobile design still works responsively.

### Nuxt UI components

- `UCard` for puzzle list items.
- `UButton` for puzzle actions.
- `UModal` for showing full solution if desired.

---

## Color and states

- **Leak severity**:
  - Green: minor issue.
  - Amber: moderate issue.
  - Red: major leak.
- **Puzzles**:
  - Neutral base color for unsolved.
  - Subtle indicator for solved vs unsolved (icon or small badge).

---

## UX rules

- Always show an explicit “Analysis incomplete” banner when evals/clocks are missing.
- Never block the UI while analysis runs: use a loading indicator in the analysis card instead of a full-page spinner.
- Prefer text explanations alongside numbers:
  - “You lose many games on time (60% of losses)” instead of just “Time leak: 60%”.

---

## Testing checklist

- Verify `/analyze` works and is readable on:
  - ~375px width (mobile),
  - ~768px (tablet),
  - ~1440px (desktop).
- Verify leak cards are readable and tappable on mobile.
- Verify puzzle board fits screen without horizontal scrolling.
- Verify all actions are possible with touch only (no hover required).
