import { adPages, eventAppliesToStep, eventRules, stepConfig } from './config'
import { historyLimit, recordLimit, variantFor } from './engine'
import type { Run } from './engine'
import { eventIds, steps } from './types'

export const storageKey = 'yohaku-login.save'
const version = 1

const actionTypes = new Set([
  'next', 'mistake', 'consent', 'offer', 'close', 'ad-next', 'undo-extras',
  'confirm-back', 'retry', 'show-hint', 'tick', 'activity', 'reset', 'replay', 'fail', 'motion',
])

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function integer(value: unknown, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max
}

function inList<T>(values: readonly T[]) {
  return (value: unknown): value is T => values.some(item => item === value)
}

const step = inList(steps)
const event = inList(eventIds)
const grade = inList(['S', 'A', 'B', 'C', 'D'])
const status = inList(['playing', 'failed', 'cleared'])
const pattern = (value: unknown) => integer(value, 30) && value > 0
const bool = (value: unknown) => typeof value === 'boolean'

function list(value: unknown, item: (entry: unknown) => boolean, limit: number, unique = false): value is unknown[] {
  return Array.isArray(value) && value.length <= limit && value.every(item)
    && (!unique || new Set(value).size === value.length)
}

function stats(value: unknown): boolean {
  return object(value) && integer(value.mistakes) && integer(value.consents)
    && integer(value.hints) && integer(value.retries)
}

function record(value: unknown): boolean {
  return object(value) && stats(value) && integer(value.seed, 0xffffffff) && integer(value.clearedAt, 8_640_000_000_000_000)
    && integer(value.elapsedMs) && integer(value.avoided, 30) && integer(value.points, 100) && grade(value.grade)
}

function log(value: unknown): boolean {
  return object(value) && typeof value.action === 'string' && actionTypes.has(value.action)
    && step(value.step) && integer(value.elapsedMs)
    && (value.event === undefined || event(value.event))
    && (value.pattern === undefined || pattern(value.pattern))
}

function pending(value: unknown): boolean {
  return object(value) && event(value.id) && integer(value.page, value.id === 'ad' ? 2 : 0)
}

function validShape(value: unknown): value is Run {
  return object(value) && step(value.step) && status(value.status) && integer(value.seed, 0xffffffff)
    && integer(value.playIndex) && integer(value.revision) && bool(value.reducedMotion)
    && integer(value.startedAt) && integer(value.elapsedMs)
    && integer(value.lastActivityAt) && integer(value.lastProgressAt)
    && object(value.checkpoint) && step(value.checkpoint.step) && bool(value.checkpoint.adCompleted)
    && list(value.pending, pending, eventIds.length)
    && list(value.fired, event, eventIds.length, true) && list(value.dismissed, event, eventIds.length, true)
    && bool(value.adCompleted) && bool(value.advanceAfterAd)
    && list(value.encountered, pattern, 30, true) && list(value.resolved, pattern, 30, true)
    && list(value.avoided, pattern, 30, true) && list(value.tainted, pattern, 30, true)
    && stats(value.stats) && list(value.history, log, historyLimit) && list(value.hints, step, historyLimit)
    && list(value.records, record, recordLimit)
    && (value.failure === null || object(value.failure) && pattern(value.failure.pattern)
      && typeof value.failure.cause === 'string' && value.failure.cause.length > 0 && value.failure.cause.length <= 200)
}

function consistent(run: Run): boolean {
  const currentStage = stepConfig[run.step].stage
  const pendingIds = run.pending.map(item => item.id)
  const adPageCount = run.adCompleted ? 1 : adPages[variantFor(run.seed)]
  const withinClock = (timestamp: number) => timestamp >= run.startedAt && timestamp <= run.startedAt + run.elapsedMs
  return Number.isSafeInteger(run.startedAt + run.elapsedMs)
    && withinClock(run.lastProgressAt) && withinClock(run.lastActivityAt)
    && steps.find(item => stepConfig[item].stage === currentStage) === run.checkpoint.step
    && new Set(pendingIds).size === pendingIds.length
    && run.pending.every(({ id, page }) => {
      const rule = eventRules[id]
      return run.fired.includes(id) && eventAppliesToStep(id, run.step)
        && (!rule.from || pendingIds.includes(rule.from))
        && (id !== 'ad' || page < adPageCount)
        && (run.status === 'playing' || id === 'settings' || id === 'reset')
    })
    && run.dismissed.every(id => run.fired.includes(id))
    && (!run.advanceAfterAd || !run.adCompleted && pendingIds.includes('ad'))
    && run.resolved.every(id => run.encountered.includes(id))
    && run.avoided.every(id => run.resolved.includes(id) && !run.tainted.includes(id))
    && run.hints.length === Math.min(historyLimit, run.stats.hints)
    && (run.status === 'failed') === (run.failure !== null)
    && (run.status !== 'cleared' || run.step === 'final' && run.records[0]?.seed === run.seed
      && run.records[0].elapsedMs === run.elapsedMs)
}

export function serialize(run: Run): string {
  return JSON.stringify({ version, data: run })
}

export function parseSave(raw: string | null): Run | undefined {
  if (!raw || raw.length > 150_000) return undefined
  try {
    const value: unknown = JSON.parse(raw)
    if (object(value) && value.version === version && validShape(value.data) && consistent(value.data)) {
      return value.data
    }
  } catch {
    return undefined
  }
  return undefined
}
