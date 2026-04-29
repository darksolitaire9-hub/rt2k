import { describe, it, expect } from 'vitest'
import { StockfishWasmAdapter, type StockfishEngine } from './StockfishWasmAdapter'

type MessageHandler = (event: { data: string }) => void

function makeMockEngine(
  responseScript: Record<string, string[]>,
): StockfishEngine & { sentMessages: string[] } {
  const sentMessages: string[] = []
  const handlers: MessageHandler[] = []

  function emit(lines: string[]) {
    for (const line of lines) {
      for (const h of handlers) h({ data: line })
    }
  }

  return {
    sentMessages,
    postMessage(msg: string) {
      sentMessages.push(msg)
      const key = msg.split(' ')[0]
      const responses = responseScript[key]
      if (responses) emit(responses)
    },
    addEventListener(type, handler) {
      if (type === 'message') handlers.push(handler)
    },
    terminate() {},
  }
}

const FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'

function makeDefaultEngine(bestMove = 'e7e5', score = 17) {
  return makeMockEngine({
    uci: ['uciok'],
    isready: ['readyok'],
    go: [
      `info depth 18 score cp ${score} nodes 123456 time 100 pv ${bestMove}`,
      `bestmove ${bestMove} ponder d2d4`,
    ],
  })
}

describe('StockfishWasmAdapter', () => {
  it('returns the best move from the engine response', async () => {
    const engine = makeDefaultEngine('e7e5')
    const adapter = new StockfishWasmAdapter(() => engine)
    const result = await adapter.evaluate(FEN, 18)
    expect(result.bestMove).toBe('e7e5')
  })

  it('returns the centipawn score from the engine response', async () => {
    const engine = makeDefaultEngine('e7e5', 42)
    const adapter = new StockfishWasmAdapter(() => engine)
    const result = await adapter.evaluate(FEN, 18)
    expect(result.score).toBe(42)
  })

  it('uses the latest score when multiple info lines arrive', async () => {
    const engine = makeMockEngine({
      uci: ['uciok'],
      isready: ['readyok'],
      go: [
        'info depth 1 score cp 10 pv e7e5',
        'info depth 18 score cp 55 pv e7e5',
        'bestmove e7e5 ponder d2d4',
      ],
    })
    const adapter = new StockfishWasmAdapter(() => engine)
    const result = await adapter.evaluate(FEN, 18)
    expect(result.score).toBe(55)
  })

  it('resolves to 9999 for a white-side mate score', async () => {
    const engine = makeMockEngine({
      uci: ['uciok'],
      isready: ['readyok'],
      go: [
        'info depth 5 score mate 3 pv e7e5',
        'bestmove e7e5',
      ],
    })
    const adapter = new StockfishWasmAdapter(() => engine)
    const result = await adapter.evaluate(FEN, 18)
    expect(result.score).toBe(9999)
  })

  it('resolves to -9999 for a black-side mate score', async () => {
    const engine = makeMockEngine({
      uci: ['uciok'],
      isready: ['readyok'],
      go: [
        'info depth 5 score mate -3 pv e7e5',
        'bestmove e7e5',
      ],
    })
    const adapter = new StockfishWasmAdapter(() => engine)
    const result = await adapter.evaluate(FEN, 18)
    expect(result.score).toBe(-9999)
  })

  it('sends uci handshake before the position command', async () => {
    const engine = makeDefaultEngine()
    const adapter = new StockfishWasmAdapter(() => engine)
    await adapter.evaluate(FEN, 18)
    expect(engine.sentMessages[0]).toBe('uci')
    expect(engine.sentMessages[1]).toBe('isready')
  })

  it('sends the correct position fen command', async () => {
    const engine = makeDefaultEngine()
    const adapter = new StockfishWasmAdapter(() => engine)
    await adapter.evaluate(FEN, 18)
    expect(engine.sentMessages).toContain(`position fen ${FEN}`)
  })

  it('sends go depth with the requested depth', async () => {
    const engine = makeDefaultEngine()
    const adapter = new StockfishWasmAdapter(() => engine)
    await adapter.evaluate(FEN, 12)
    expect(engine.sentMessages).toContain('go depth 12')
  })

  it('creates a fresh engine instance per evaluate call', async () => {
    let callCount = 0
    const adapter = new StockfishWasmAdapter(() => {
      callCount++
      return makeDefaultEngine()
    })
    await adapter.evaluate(FEN, 18)
    await adapter.evaluate(FEN, 18)
    expect(callCount).toBe(2)
  })
})
