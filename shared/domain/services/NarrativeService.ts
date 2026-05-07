export const NARRATIVE = {
  loading: {
    starting: [
      "Waking up the engine, bro. Let's see what you've got.",
      "Prepping the analysis board. Time for the truth.",
      "Getting things ready for a deep dive into your game.",
      "Initializing Stockfish WASM. It's about to get tactical.",
      "Clearing the hash tables. Fresh start for a fresh run."
    ],
    parsing: [
      "Scanning your history... I see some interesting choices.",
      "Deconstructing your recent form. Buckle up.",
      "Reading between the lines of your PGN. Spooky.",
      "Extracting those critical games for the lab.",
      "Reconstructing move trees. Your midgame is... a journey.",
      "Normalizing PGN metadata. Keeping it clean.",
      "Indexing your opening choices. The theory is strong here."
    ],
    detecting: [
      "Isolating tactical patterns. This might sting a bit.",
      "Identifying where the ELO is leaking. Let's patch it up.",
      "Spotting the critical moments you might have missed.",
      "Filtering for your biggest blunders. No judgment, bro.",
      "Mapping your tactical blind spots. We'll fix 'em.",
      "Analyzing pawn structure transitions. Complex stuff.",
      "Flagging unusual time-management dips. Keep your cool."
    ],
    evaluating: [
      "Benchmarking your decision making. Stockfish is sweating.",
      "Quantifying those tactical blind spots... ouch.",
      "Running the engine on key positions. High voltage.",
      "Synthesizing your metrics. The math of the road to 2000.",
      "Calculating centipawn loss. Every point counts, bro.",
      "Simulating better alternatives. There's always a way.",
      "Searching for the 'Why' behind the 'What'.",
      "Comparing your moves to the masters. You're getting there."
    ],
    finalizing: [
      "Calibrating your training plan. Custom-built for you.",
      "Wrapping up the insights. The report is looking spicy.",
      "Finalizing your leak report, bro. Knowledge is power.",
      "Polishing the personalized puzzles. Get ready.",
      "Synthesizing the road to 2000. It's within reach."
    ]
  },
  warnings: {
    clockless: "Timeless analysis! 🕒 We couldn't find clock data, so we're focusing purely on your tactical execution. Leaks like 'Flag Risk' are taking the day off."
  },
  empty: {
    noPuzzles: "No puzzles yet? Upload a PGN and let's find some tactical gems in your blunders! 💎",
    noHistory: "Your history is a blank page. Go write some tactical brilliance! 🖊️",
    allCaughtUp: "All caught up! You're a tactical monster today. Upload more games to keep the fire going. 🔥"
  }
} as const

export function getRandomNarrative(category: keyof typeof NARRATIVE, subCategory?: string): string {
  const cat = NARRATIVE[category] as any
  if (subCategory && cat[subCategory]) {
    const list = cat[subCategory] as string[]
    return list[Math.floor(Math.random() * list.length)]
  }
  if (typeof cat === 'string') return cat
  return "Keep grinding, bro."
}
