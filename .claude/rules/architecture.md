# Hexagonal Architecture Rules

## Layer map
shared/domain/entities        → plain TypeScript, zero external deps
shared/domain/value-objects   → immutable, plain TypeScript
shared/domain/ports           → interfaces only, no implementation
shared/domain/services        → pure functions, no side effects
shared/domain/config          → constants and thresholds only
shared/application/use-cases  → orchestrates ports, no framework code
shared/application/dto        → plain data shapes, no logic
app/adapters/*                → implements ports, external libs allowed here
app/composables/*             → Vue logic, calls use-cases only
app/components/*              → Vue only, no direct domain imports
app/pages/*                   → Vue only, composes components and composables

## Allowed import directions
app/pages
  → app/composables
    → shared/application/use-cases
      → shared/domain (entities, ports, services, config)

app/adapters
  → shared/domain/ports (to implement)
  → external libs (chess.js, Stockfish, IndexedDB client)

## Strictly forbidden
- Any import of Vue (ref, computed, watch, etc.) inside shared/
- Any import of chessground inside shared/
- Any use of browser APIs (window, document, navigator) inside shared/
- Calling chess.js, Stockfish, or IndexedDB directly from a domain service
- app/components importing directly from shared/domain (must go via composables)

## Ports rule
Every external dependency (parser, engine, repository)
must have a corresponding interface in shared/domain/ports.
No adapter may be instantiated inside domain or application code.
Dependency injection only — pass the port implementation in from outside.

## Red flags (stop and ask before proceeding)
- "import { ref }" anywhere inside shared/
- A domain service that calls an adapter method directly
- A component that imports from shared/domain/services directly
- Any new external library added to shared/ without a decision entry

## Value objects
LeakType, Phase, TerminationType, GameResult are immutable enums or
readonly objects. Never mutate them. Never extend them without a decision entry.

## Config
All numeric thresholds (eval swing cutoffs, time loss thresholds, leak score
weights) live exclusively in shared/domain/config/leakRules.ts.
No magic numbers anywhere else in the codebase.
