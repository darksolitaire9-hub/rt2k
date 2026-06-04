import { describe, it, expect, bench } from 'vitest'
import { ChessopsPgnParserAdapter } from '../../../app/adapters/pgn/ChessopsPgnParserAdapter'

// A small sample game to duplicate for benchmarks
const sampleGame = `[Event "FIDE World Cup 2023"]
[Site "Baku AZE"]
[Date "2023.08.09"]
[Round "4.1"]
[White "Carlsen, M."]
[Black "Keymer, Vincent"]
[Result "0-1"]
[WhiteElo "2835"]
[BlackElo "2690"]
[EventDate "2023.07.30"]
[ECO "C02"]

1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. a3 Nh6 7. b4 cxd4 8. cxd4 Nf5
9. Bb2 Bd7 10. g4 Nfe7 11. Nc3 Na5 12. Na4 Qc6 13. b5 Qc7 14. Rc1 Nc4 15. Bxc4 dxc4
16. Nc3 Nd5 17. Nxd5 exd5 18. O-O Bxg4 19. Rc3 Qd7 20. Re1 Be7 21. a4 O-O
22. Ba3 Bxa3 23. Rxa3 Qf5 24. Ree3 Rac8 25. Qd2 Bxf3 26. Rxf3 Qb1+ 27. Kg2 Qe4
28. h3 f6 29. Re3 Qg6+ 30. Rg3 Qe4+ 31. Kh2 fxe5 32. dxe5 Qxe5 33. Kg1 d4
34. Ref3 c3 35. Qc2 Rxf3 36. Rxf3 Qe1+ 37. Kg2 Qd2 38. Qf5 h6 39. Qxc8+ Kh7
40. Qf5+ Kh8 41. Qg6 Kg8 42. Qe8+ Kh7 43. Rf8 Qg5+ 44. Kf3 Qd5+ 45. Qe4+
0-1`

// Generate a massive PGN block by repeating the sample game
function generateSyntheticPgn(count: number): string {
  return Array.from({ length: count }, () => sampleGame).join('\n\n')
}

describe('ChessopsPgnParserAdapter Benchmarks', () => {
  const parser = new ChessopsPgnParserAdapter()
  const pgn100 = generateSyntheticPgn(100)
  const pgn500 = generateSyntheticPgn(500)

  // Standard correctness test
  it('correctly parses 100 synthetic games', () => {
    const results = parser.parse(pgn100, 'Carlsen, M.')
    expect(results.length).toBe(100)
    expect(results[0]?.record.moveCount).toBe(45)
  })

  // Vitest native bench functionality
  bench('parse 100 games (chessops)', () => {
    parser.parse(pgn100, 'Carlsen, M.')
  }, { time: 5000 })

  bench('parse 500 games (chessops)', () => {
    parser.parse(pgn500, 'Carlsen, M.')
  }, { time: 10000 })
})
