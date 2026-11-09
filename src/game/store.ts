import { create } from 'zustand'
import { activeEvent, createRun, reduce } from './engine'
import type { Run } from './engine'
import { parseSave, serialize, storageKey } from './storage'
import type { GameAction } from './types'

let knownSave: string | null | undefined

function readChangedSave(): Run | undefined {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw === knownSave) return undefined
    knownSave = raw
    return parseSave(raw)
  } catch {
    return undefined
  }
}

function writeSave(run: Run) {
  try {
    const raw = serialize(run)
    localStorage.setItem(storageKey, raw)
    knownSave = raw
  } catch {
    // ストレージが無効でも現在のタブで進行を続けます。
  }
}

function initialRun(): Run {
  const saved = readChangedSave()
  if (saved) return saved
  const seed = new URLSearchParams(location.search).get('seed')
  if (seed && /^\d{1,10}$/.test(seed) && Number(seed) <= 0xffffffff) {
    return createRun(Date.now(), Number(seed))
  }
  return createRun(Date.now())
}

interface GameStore {
  run: Run
  dispatch: (action: GameAction) => void
}

function sameScreen(a: Run, b: Run): boolean {
  const first = activeEvent(a)
  const second = activeEvent(b)
  return a.revision === b.revision && a.step === b.step && a.status === b.status
    && first?.id === second?.id && first?.page === second?.page
}

export const useGame = create<GameStore>(set => ({
  run: initialRun(),
  dispatch: action => set(state => {
    const current = readChangedSave() ?? state.run
    if (current !== state.run && !sameScreen(current, state.run)) return { run: current }
    const run = reduce(current, action, Date.now())
    if (run !== current) writeSave(run)
    return run === state.run ? state : { run }
  }),
}))

function syncSave(event: StorageEvent) {
  if (event.key !== storageKey) return
  const run = readChangedSave()
  if (run) useGame.setState({ run })
}

window.addEventListener('storage', syncSave)
import.meta.hot?.dispose(() => window.removeEventListener('storage', syncSave))
