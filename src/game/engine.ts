import { adPages, defaultSeed, eventAppliesToStep, eventRules, fullPageAdIndex, legacyPatternCount, patterns, relatedPatterns, stepConfig } from './config'
import { evaluate } from './scoring'
import type { Grade, Stats } from './scoring'
import { steps } from './types'
import type { EventId, GameAction, PatternId, SceneProps, StepId } from './types'

export interface PendingEvent {
  id: EventId
  page: number
}

export interface ClearRecord extends Stats {
  seed: number
  clearedAt: number
  elapsedMs: number
  avoided: number
  patternCount?: number
  points: number
  grade: Grade
}

export interface LogEntry {
  action: GameAction['type']
  step: StepId
  elapsedMs: number
  event?: EventId
  pattern?: PatternId
}

export interface Run {
  step: StepId
  status: 'playing' | 'failed' | 'cleared'
  seed: number
  playIndex: number
  revision: number
  reducedMotion: boolean
  startedAt: number
  elapsedMs: number
  lastActivityAt: number
  lastProgressAt: number
  checkpoint: { step: StepId; adCompleted: boolean }
  pending: PendingEvent[]
  fired: EventId[]
  dismissed: EventId[]
  adCompleted: boolean
  advanceAfterAd: boolean
  encountered: PatternId[]
  resolved: PatternId[]
  avoided: PatternId[]
  tainted: PatternId[]
  stats: Stats
  history: LogEntry[]
  hints: StepId[]
  records: ClearRecord[]
  failure: { pattern: PatternId; cause: string } | null
}

export const historyLimit = 180
export const recordLimit = 20

function mixSeed(seed: number): number {
  let mixed = seed >>> 0
  mixed ^= mixed >>> 16
  mixed = Math.imul(mixed, 0x21f0aaad)
  mixed ^= mixed >>> 15
  mixed = Math.imul(mixed, 0x735a2d97)
  return (mixed ^ (mixed >>> 15)) >>> 0
}

export function variantFor(seed: number): SceneProps['variant'] {
  return (seed % 3) as SceneProps['variant']
}

function replaySeed(run: Run): number {
  const candidate = mixSeed(run.seed + run.playIndex + 1)
  if (variantFor(candidate) !== variantFor(run.seed)) return candidate
  return candidate === 0xffffffff ? 1 : candidate + 1
}

function addUnique<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item]
}

function withEncounter(run: Run, step: StepId) {
  return patterns.filter(pattern => pattern.step === step && pattern.credit === 'next')
    .reduce((ids, pattern) => addUnique(ids, pattern.id), run.encountered)
}

export function createRun(now: number, seed = defaultSeed, playIndex = 0): Run {
  const run: Run = {
    step: 'cookie', status: 'playing', seed, playIndex, revision: 0, reducedMotion: false,
    startedAt: now, elapsedMs: 0, lastActivityAt: now, lastProgressAt: now,
    checkpoint: { step: 'cookie', adCompleted: false }, pending: [], fired: [], dismissed: [],
    adCompleted: false, advanceAfterAd: false, encountered: [], resolved: [], avoided: [], tainted: [],
    stats: { mistakes: 0, consents: 0, hints: 0, retries: 0 },
    history: [], hints: [], records: [], failure: null,
  }
  return { ...run, encountered: withEncounter(run, run.step) }
}

export function activeEvent(run: Run): PendingEvent | undefined {
  return run.pending.reduce<PendingEvent | undefined>((active, item) =>
    !active || eventRules[item.id].priority > eventRules[active.id].priority ? item : active, undefined)
}

function offer(run: Run, event: EventId, now: number): Run {
  const rule = eventRules[event]
  if (run.pending.some(item => item.id === event) || (rule.once && run.fired.includes(event))) return run
  if (!eventAppliesToStep(event, run.step)) return run
  if (rule.from && activeEvent(run)?.id !== rule.from) return run
  if (rule.idleSeconds && now - run.lastActivityAt < rule.idleSeconds[variantFor(run.seed)] * 1000) return run
  if (run.status !== 'playing' && event !== 'settings' && event !== 'reset') return run
  let encountered = run.encountered
  const ids: PatternId[] = event === 'ad' ? [2, 11] : event === 'back' ? [29] : event === 'cookie-review' ? [14] : []
  for (const id of ids) encountered = addUnique(encountered, id)
  return { ...run, encountered, pending: [...run.pending, { id: event, page: 0 }], fired: addUnique(run.fired, event) }
}

function dismiss(run: Run, event: EventId): Run {
  return {
    ...run,
    pending: run.pending.filter(item => item.id !== event),
    dismissed: addUnique(run.dismissed, event),
  }
}

function resolvePattern(run: Run, id: PatternId): Run {
  if (!run.encountered.includes(id)) return run
  return {
    ...run,
    resolved: addUnique(run.resolved, id),
    avoided: run.tainted.includes(id) ? run.avoided : addUnique(run.avoided, id),
  }
}

function resolveOnAdvance(run: Run): Run {
  return patterns.filter(pattern => pattern.step === run.step && pattern.credit === 'next')
    .reduce((current, pattern) => resolvePattern(current, pattern.id), { ...run, encountered: withEncounter(run, run.step) })
}

function move(run: Run, step: StepId, now: number): Run {
  const newStage = stepConfig[step].stage !== stepConfig[run.step].stage
  const checkpointStep = steps.find(item => stepConfig[item].stage === stepConfig[step].stage) ?? step
  const pending = run.pending.filter(item => eventAppliesToStep(item.id, step))
  return {
    ...run, step, pending,
    lastProgressAt: now, lastActivityAt: now,
    encountered: withEncounter(run, step),
    checkpoint: newStage ? { step: checkpointStep, adCompleted: checkpointStep !== 'cookie' && run.adCompleted } : run.checkpoint,
  }
}

function advance(run: Run, now: number): Run {
  const resolved = resolveOnAdvance(run)
  const step = steps[steps.indexOf(run.step) + 1]
  if (step) return move(resolved, step, now)
  const patternCount = patterns.filter(pattern => pattern.id <= legacyPatternCount || resolved.encountered.includes(pattern.id)).length
  const record: ClearRecord = {
    ...resolved.stats,
    seed: resolved.seed,
    elapsedMs: resolved.elapsedMs,
    avoided: resolved.avoided.length,
    patternCount,
    clearedAt: now,
    ...evaluate(resolved.stats, resolved.avoided.length, resolved.elapsedMs, patternCount),
  }
  return {
    ...resolved, pending: [], status: 'cleared',
    records: [record, ...resolved.records].slice(0, recordLimit),
  }
}

function penalize(run: Run, kind: 'mistakes' | 'consents', id: PatternId): Run {
  const affected = [id, ...(relatedPatterns[id] ?? [])]
  return {
    ...run,
    stats: { ...run.stats, [kind]: run.stats[kind] + 1 },
    tainted: affected.reduce(addUnique, run.tainted),
    avoided: run.avoided.filter(pattern => !affected.includes(pattern)),
  }
}

function apply(run: Run, action: GameAction, now: number): Run {
  const active = activeEvent(run)
  switch (action.type) {
    case 'tick':
      return offer(run, 'campaign', now)
    case 'activity':
      return run.status !== 'playing' || now - run.lastActivityAt < 1000 ? run : { ...run, lastActivityAt: now }
    case 'offer':
      return offer(run, action.event, now)
    case 'motion':
      return { ...run, reducedMotion: action.reduced }
    case 'reset':
    case 'replay': {
      const replay = action.type === 'replay'
      const seed = replay ? replaySeed(run) : run.seed
      const playIndex = run.playIndex + Number(replay)
      return {
        ...createRun(now, seed, playIndex),
        revision: run.revision + 1, records: run.records, reducedMotion: run.reducedMotion,
      }
    }
    case 'retry':
      if (run.status !== 'failed' || active) return run
      return {
        ...run, status: 'playing', failure: null, revision: run.revision + 1,
        pending: [], step: run.checkpoint.step, adCompleted: run.checkpoint.adCompleted, advanceAfterAd: false,
        elapsedMs: now - run.startedAt, lastActivityAt: now, lastProgressAt: now, stats: { ...run.stats, retries: run.stats.retries + 1 },
      }
    case 'close': {
      if (active?.id !== action.event || ['ad', 'cancel-extras'].includes(action.event)) return run
      const closed = dismiss(run, action.event)
      if (action.event === 'cookie-review') return advance(resolvePattern(closed, 14), now)
      return closed
    }
    case 'show-hint': {
      const offered = offer(run, 'hint', now)
      if (offered === run) return run
      return { ...offered, hints: [...run.hints, run.step].slice(-historyLimit), stats: { ...run.stats, hints: run.stats.hints + 1 } }
    }
  }
  if (run.status !== 'playing') return run
  switch (action.type) {
    case 'next':
      if (active) return run
      if (run.step === 'home' && !run.adCompleted) {
        return { ...offer(run, 'ad', now), advanceAfterAd: true }
      }
      return advance(run, now)
    case 'ad-next': {
      if (active?.id !== 'ad') return run
      const count = run.adCompleted ? 1 : adPages[variantFor(run.seed)]
      const current = active.page === fullPageAdIndex
        ? resolvePattern({ ...run, encountered: addUnique(run.encountered, 34) }, 34)
        : run
      const page = active.page + 1
      if (page < count) {
        return {
          ...current,
          encountered: page === fullPageAdIndex ? addUnique(current.encountered, 34) : current.encountered,
          pending: current.pending.map(item => item.id === 'ad' ? { ...item, page } : item),
        }
      }
      const closed = resolvePattern(resolvePattern(dismiss(current, 'ad'), 2), 11)
      const finished = { ...closed, adCompleted: true, advanceAfterAd: false }
      return run.advanceAfterAd ? advance(finished, now) : finished
    }
    case 'undo-extras':
      return active?.id === 'cancel-extras' ? advance(dismiss(run, 'cancel-extras'), now) : run
    case 'confirm-back': {
      if (active?.id !== 'back') return run
      const previous = steps[steps.indexOf(run.step) - 1]
      return previous ? move(resolvePattern(dismiss(run, 'back'), 29), previous, now) : run
    }
    case 'mistake':
      return penalize(run, 'mistakes', action.pattern)
    case 'consent':
      return penalize(run, 'consents', action.pattern)
    case 'fail': {
      const penalized = penalize(run, 'mistakes', action.pattern)
      return {
        ...(action.pattern === 1 ? penalized : penalize(penalized, 'consents', action.pattern)),
        status: 'failed', pending: [], advanceAfterAd: false, failure: { pattern: action.pattern, cause: action.cause },
      }
    }
  }
}

export function reduce(run: Run, action: GameAction, now: number): Run {
  const time = Math.max(now, run.startedAt + run.elapsedMs)
  const timed = run.status === 'playing' && run.elapsedMs !== time - run.startedAt
    ? { ...run, elapsedMs: time - run.startedAt }
    : run
  const updated = apply(timed, action, time)
  if (updated === timed || action.type === 'tick' && updated.pending.length === timed.pending.length
    || action.type === 'activity' || action.type === 'reset' || action.type === 'replay') return updated

  const entry: LogEntry = { action: action.type, step: run.step, elapsedMs: updated.elapsedMs }
  if ('pattern' in action) entry.pattern = action.pattern
  if ('event' in action) entry.event = action.event
  if (action.type === 'tick') entry.event = 'campaign'
  return { ...updated, history: [...updated.history, entry].slice(-historyLimit) }
}
