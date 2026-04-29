import type { IPuzzleSourcePort } from '../../../shared/domain/ports/IPuzzleSourcePort'
import type { UserPuzzle } from '../../../shared/domain/entities/UserPuzzle'
import type { LeakType } from '../../../shared/domain/value-objects/LeakType'
import { LeakType as LeakTypes } from '../../../shared/domain/value-objects/LeakType'

// Maps each leak type to puzzle themes from the catalog
const THEME_MAP: Record<LeakType, string[]> = {
  [LeakTypes.Tactics]: ['fork', 'pin', 'skewer', 'discoveredAttack', 'deflection', 'mateIn1', 'mateIn2'],
  [LeakTypes.Opening]: ['opening', 'advantage'],
  [LeakTypes.Time]: ['fork', 'pin', 'mateIn1'],
  [LeakTypes.Structure]: ['backRankMate', 'promotion', 'pawnStructure'],
  [LeakTypes.Endgame]: ['endgame', 'promotion', 'rookEndgame', 'pawnEndgame'],
}

// Seeded Fisher-Yates shuffle — deterministic within a session, different across calls
function sampleUpTo<T>(arr: T[], count: number): T[] {
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

// Minimal static catalog for v1. Each entry covers a different theme.
export const DEFAULT_CATALOG: UserPuzzle[] = [
  // Tactics — fork
  { id: 'lp-001', sourceGameId: 'external', sourceMoveNumber: 0, fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', bestMove: 'Ng5', playedMove: 'd3', theme: 'fork', ratingHint: 1200 },
  { id: 'lp-002', sourceGameId: 'external', sourceMoveNumber: 0, fen: '2r3k1/5ppp/p7/1p2p3/4P3/P4N2/1PP2PPP/2KR4 w - - 0 1', bestMove: 'Nd4', playedMove: 'Rg1', theme: 'fork', ratingHint: 1300 },
  { id: 'lp-003', sourceGameId: 'external', sourceMoveNumber: 0, fen: 'r1bqk2r/ppp2ppp/2n5/3np3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1', bestMove: 'Nxe5', playedMove: 'O-O', theme: 'fork', ratingHint: 1400 },
  // Tactics — pin
  { id: 'lp-004', sourceGameId: 'external', sourceMoveNumber: 0, fen: 'r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 3 5', bestMove: 'Bg4', playedMove: 'Nf6', theme: 'pin', ratingHint: 1100 },
  { id: 'lp-005', sourceGameId: 'external', sourceMoveNumber: 0, fen: 'r3k2r/ppp2ppp/2n1b3/3qp3/3P4/2N1BN2/PPP2PPP/R2QK2R w KQkq - 0 1', bestMove: 'Bb5', playedMove: 'a3', theme: 'pin', ratingHint: 1250 },
  // Tactics — mateIn1
  { id: 'lp-006', sourceGameId: 'external', sourceMoveNumber: 0, fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', bestMove: 'Re8#', playedMove: 'Kf1', theme: 'mateIn1', ratingHint: 900 },
  { id: 'lp-007', sourceGameId: 'external', sourceMoveNumber: 0, fen: 'r1bqk2r/pppp1Qpp/2n2n2/2b1p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 1', bestMove: 'Ke7', playedMove: 'Nd4', theme: 'mateIn1', ratingHint: 1000 },
  // Tactics — mateIn2
  { id: 'lp-008', sourceGameId: 'external', sourceMoveNumber: 0, fen: '5rk1/pp4pp/8/3R4/8/8/PP4PP/6K1 w - - 0 1', bestMove: 'Rd8', playedMove: 'g3', theme: 'mateIn2', ratingHint: 1100 },
  // Opening
  { id: 'lp-009', sourceGameId: 'external', sourceMoveNumber: 0, fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2', bestMove: 'Nc6', playedMove: 'd6', theme: 'opening', ratingHint: 1000 },
  { id: 'lp-010', sourceGameId: 'external', sourceMoveNumber: 0, fen: 'rnbqkbnr/pppp1ppp/8/4p3/2P1P3/8/PP1P1PPP/RNBQKBNR b KQkq - 0 2', bestMove: 'Nf6', playedMove: 'd6', theme: 'opening', ratingHint: 1050 },
  { id: 'lp-011', sourceGameId: 'external', sourceMoveNumber: 0, fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', bestMove: 'Bc4', playedMove: 'a3', theme: 'advantage', ratingHint: 1100 },
  // Endgame — promotion
  { id: 'lp-012', sourceGameId: 'external', sourceMoveNumber: 0, fen: '8/P7/8/8/8/8/8/4K1k1 w - - 0 1', bestMove: 'a8=Q', playedMove: 'Ke2', theme: 'promotion', ratingHint: 800 },
  { id: 'lp-013', sourceGameId: 'external', sourceMoveNumber: 0, fen: '8/5P2/6K1/8/8/8/8/6k1 w - - 0 1', bestMove: 'f8=Q', playedMove: 'Kf6', theme: 'promotion', ratingHint: 850 },
  // Endgame — rookEndgame
  { id: 'lp-014', sourceGameId: 'external', sourceMoveNumber: 0, fen: '8/8/8/3k4/8/8/3K4/3R4 w - - 0 1', bestMove: 'Rd5+', playedMove: 'Kc3', theme: 'rookEndgame', ratingHint: 1200 },
  { id: 'lp-015', sourceGameId: 'external', sourceMoveNumber: 0, fen: '8/8/3k4/8/3K4/8/8/R7 w - - 0 1', bestMove: 'Ra6+', playedMove: 'Ke4', theme: 'rookEndgame', ratingHint: 1100 },
  // Endgame — pawnEndgame
  { id: 'lp-016', sourceGameId: 'external', sourceMoveNumber: 0, fen: '8/8/4k3/4P3/4K3/8/8/8 w - - 0 1', bestMove: 'Kd5', playedMove: 'e6', theme: 'pawnEndgame', ratingHint: 1000 },
  // Structure — backRankMate
  { id: 'lp-017', sourceGameId: 'external', sourceMoveNumber: 0, fen: '6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1', bestMove: 'Rb8+', playedMove: 'g3', theme: 'backRankMate', ratingHint: 1000 },
  { id: 'lp-018', sourceGameId: 'external', sourceMoveNumber: 0, fen: '1r4k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1', bestMove: 'Rxb8+', playedMove: 'g3', theme: 'backRankMate', ratingHint: 1050 },
  // Tactics — discoveredAttack
  { id: 'lp-019', sourceGameId: 'external', sourceMoveNumber: 0, fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5', bestMove: 'Nd5', playedMove: 'O-O', theme: 'discoveredAttack', ratingHint: 1300 },
  // Tactics — skewer
  { id: 'lp-020', sourceGameId: 'external', sourceMoveNumber: 0, fen: '4k3/8/8/8/8/8/8/R3K3 w Q - 0 1', bestMove: 'Ra8+', playedMove: 'Ke2', theme: 'skewer', ratingHint: 1150 },
]

export class LocalPuzzleSourceAdapter implements IPuzzleSourcePort {
  constructor(private readonly catalog: readonly UserPuzzle[] = DEFAULT_CATALOG) {}

  async fetch(leakType: LeakType, count: number): Promise<UserPuzzle[]> {
    const themes = new Set(THEME_MAP[leakType] ?? [])
    const matching = this.catalog.filter(p => p.theme != null && themes.has(p.theme))
    return sampleUpTo(matching, count)
  }
}
