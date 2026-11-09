export interface Stats {
  mistakes: number
  consents: number
  hints: number
  retries: number
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D'

export const scoring = {
  maximum: 100,
  patternCount: 30,
  mistake: 3,
  consent: 13,
  hint: 4,
  retry: 6,
  graceMinutes: 30,
  overtimeIntervalMinutes: 5,
  overtimeLimit: 9,
  grades: [
    { grade: 'S', minimum: 95 },
    { grade: 'A', minimum: 85 },
    { grade: 'B', minimum: 70 },
    { grade: 'C', minimum: 55 },
    { grade: 'D', minimum: 0 },
  ] satisfies { grade: Grade; minimum: number }[],
}

export function evaluate(stats: Stats, avoided: number, elapsedMs: number): { points: number; grade: Grade } {
  const overtime = Math.max(0, elapsedMs / 60_000 - scoring.graceMinutes)
  const timePenalty = Math.min(scoring.overtimeLimit, Math.floor(overtime / scoring.overtimeIntervalMinutes))
  const points = Math.max(0, scoring.maximum - timePenalty - Math.max(0, scoring.patternCount - avoided)
    - stats.mistakes * scoring.mistake - stats.consents * scoring.consent
    - stats.hints * scoring.hint - stats.retries * scoring.retry)
  return { points, grade: scoring.grades.find(entry => points >= entry.minimum)?.grade ?? 'D' }
}

export function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60)}分${String(seconds % 60).padStart(2, '0')}秒`
}
