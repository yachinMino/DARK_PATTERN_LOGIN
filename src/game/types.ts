export const steps = [
  'cookie', 'home', 'feed',
  'plans', 'fees', 'extras', 'order',
  'terms', 'privacy', 'review',
  'warning', 'loading', 'captcha', 'credentials', 'fallback',
  'final',
] as const

export type StepId = (typeof steps)[number]
export type Stage = 1 | 2 | 3 | 4 | 5
export type PatternId =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30
  | 31 | 32 | 33

export const eventIds = [
  'cookie-review', 'ad', 'fake-login', 'campaign', 'cancel-extras', 'back', 'hint', 'settings', 'reset',
] as const

export type EventId = (typeof eventIds)[number]

export type GameAction =
  | { type: 'next' }
  | { type: 'mistake' | 'consent'; pattern: PatternId }
  | { type: 'offer' | 'close'; event: EventId }
  | { type: 'ad-next' | 'undo-extras' | 'confirm-back' | 'retry' | 'show-hint' | 'tick' | 'activity' | 'reset' | 'replay' }
  | { type: 'fail'; pattern: PatternId; cause: string }
  | { type: 'motion'; reduced: boolean }

export interface SceneProps {
  step: StepId
  seed: number
  variant: 0 | 1 | 2
  elapsedMs: number
  reducedMotion: boolean
  dispatch: (action: GameAction) => void
}
