import { describe, expect, it } from 'vitest'
import { activeEvent, createRun, reduce, variantFor } from './engine'
import { patterns } from './config'
import { evaluate } from './scoring'
import { parseSave, serialize } from './storage'
import type { GameAction } from './types'

const start = 1_700_000_000_000
const make = () => createRun(start, 165)
const play = (actions: GameAction[], run = make(), now = start + 1000) =>
  actions.reduce((state, action) => reduce(state, action, now), run)
const next: GameAction = { type: 'next' }

function reachPlans() {
  return play([next, next, { type: 'ad-next' }, { type: 'ad-next' }, next])
}

describe('ゲーム進行', () => {
  it('広告が終了するまでログイン画面の先に進まない', () => {
    const ad = play([next, next, next])
    expect(ad.step).toBe('home')
    expect(activeEvent(ad)?.id).toBe('ad')
    expect(play([{ type: 'ad-next' }, { type: 'ad-next' }], ad).step).toBe('feed')
  })

  it('各ステージの先頭をチェックポイントに保存する', () => {
    const plans = reachPlans()
    expect(plans.checkpoint.step).toBe('plans')
    const terms = play([next, next, next], plans)
    expect(terms.checkpoint.step).toBe('terms')
    expect(play([next, next, next], terms).checkpoint.step).toBe('warning')
  })

  it('最終確認後にクリア結果を一度だけ保存する', () => {
    const final = play(Array<GameAction>(11).fill(next), reachPlans())
    expect(final.step).toBe('final')
    expect(final.status).toBe('playing')
    const cleared = play([next, next], final)
    expect(cleared.status).toBe('cleared')
    expect(cleared.records).toHaveLength(1)
    expect(cleared.records[0]?.elapsedMs).toBe(1000)
  })

  it('重大な失敗後は累積指標を保持してステージ先頭に戻す', () => {
    const fees = play([next], reachPlans())
    const failed = play([{ type: 'fail', pattern: 21, cause: '手数料の支払い' }], fees)
    expect(failed.status).toBe('failed')
    expect(play([next], failed).step).toBe('fees')
    const restored = play([{ type: 'retry' }, { type: 'retry' }], failed)
    expect(restored.step).toBe('plans')
    expect(restored.status).toBe('playing')
    expect(restored.stats).toMatchObject({ consents: 1, mistakes: 1, retries: 1 })
  })

  it('確認で戻り、進行を繰り返しても回避数を二重計上しない', () => {
    const fees = play([next], reachPlans())
    const revisited = play([
      { type: 'offer', event: 'back' }, { type: 'confirm-back' },
    ], fees)
    expect(revisited.step).toBe('plans')
    expect(play([next], revisited).avoided.filter(id => id === 22)).toHaveLength(1)
  })
})

describe('イベント', () => {
  it('対象外のステップで拒否確認を発動しない', () => {
    expect(activeEvent(play([{ type: 'offer', event: 'cookie-review' }], reachPlans()))).toBeUndefined()
  })

  it('無操作条件と優先順位を適用し、同じキャンペーンを一度だけ表示する', () => {
    const plans = reachPlans()
    expect(activeEvent(play([{ type: 'tick' }], plans, start + 10_000))).toBeUndefined()
    const idle = play([{ type: 'tick' }, { type: 'offer', event: 'settings' }], plans, start + 120_000)
    expect(activeEvent(idle)?.id).toBe('settings')
    expect(activeEvent(play([{ type: 'close', event: 'campaign' }], idle))?.id).toBe('settings')
    const restored = play([{ type: 'close', event: 'settings' }], idle)
    expect(activeEvent(restored)?.id).toBe('campaign')
    const closed = play([{ type: 'close', event: 'campaign' }, { type: 'tick' }], restored, start + 240_000)
    expect(activeEvent(closed)).toBeUndefined()
  })

  it('拒否の再確認中は背後のステップを進行させない', () => {
    const reviewing = play([{ type: 'offer', event: 'cookie-review' }, next])
    expect(reviewing.step).toBe('cookie')
    expect(play([{ type: 'close', event: 'cookie-review' }], reviewing).step).toBe('home')
  })

  it('登録取り消しが終わるまで次のステージへ移動しない', () => {
    const extras = play([next, next], reachPlans())
    const cancellation = play([{ type: 'consent', pattern: 7 }, { type: 'offer', event: 'cancel-extras' }, next], extras)
    expect(cancellation.step).toBe('extras')
    expect(play([{ type: 'undo-extras' }], cancellation).step).toBe('terms')
  })

  it('すべての仕掛けを固有IDで定義する', () => {
    expect(new Set(patterns.map(pattern => pattern.id)).size).toBe(30)
  })
})

describe('評価と保存', () => {
  it('不要な同意を誤操作や時間より大きく減点する', () => {
    const stats = { mistakes: 0, consents: 0, hints: 0, retries: 0 }
    const clean = evaluate(stats, 30, 120_000)
    expect(clean).toEqual({ points: 100, grade: 'S' })
    expect(evaluate({ ...stats, consents: 3 }, 26, 120_000)).toEqual({ points: 57, grade: 'C' })
    expect(evaluate({ ...stats, mistakes: 3 }, 26, 120_000).points).toBeGreaterThan(57)
    expect(evaluate({ ...stats, consents: 3 }, 26, 120_000).points)
      .toBeLessThan(evaluate(stats, 26, 45 * 60_000).points)
  })

  it('同じシードとプレイ回数から同じ構成を生成する', () => {
    expect(variantFor(165)).toBe(0)
    expect(variantFor(29)).toBe(2)
    expect(new Set([1, 2, 3, 4, 5, 6].map(seed => variantFor(seed))).size).toBeGreaterThan(1)
  })

  it('進行と表示待ちのイベントを再読込で復元する', () => {
    const ad = play([next, next, { type: 'ad-next' }, { type: 'motion', reduced: true }])
    const loaded = parseSave(serialize(ad))
    expect(loaded).toEqual(ad)
    expect(loaded && activeEvent(loaded)?.page).toBe(1)
  })

  it('破損、未知バージョン、矛盾した状態の保存を拒否する', () => {
    const valid = JSON.parse(serialize(make()))
    expect(parseSave('{')).toBeUndefined()
    expect(parseSave(JSON.stringify({ ...valid, version: -1 }))).toBeUndefined()
    expect(parseSave(JSON.stringify({ ...valid, data: { ...valid.data, status: 'cleared' } }))).toBeUndefined()
    expect(parseSave(JSON.stringify({ ...valid, data: { ...valid.data, step: 'unknown' } }))).toBeUndefined()
  })

  it('リセットは設定とクリア履歴を保持して開始地点に戻る', () => {
    const cleared = play([...Array<GameAction>(12).fill(next)], reachPlans())
    const newGame = play([{ type: 'motion', reduced: true }, { type: 'reset' }], cleared)
    expect(newGame.step).toBe('cookie')
    expect(newGame.reducedMotion).toBe(true)
    expect(newGame.records).toHaveLength(1)
    expect(newGame.stats.retries).toBe(0)
  })
})

it('前のステージに戻るとき、対象外になった広告を破棄して保存する', () => {
  const confirming = play([{ type: 'offer', event: 'back' }], reachPlans())
  const idle = play([{ type: 'tick' }], confirming, start + 100_000)
  expect(idle.pending.map(entry => entry.id)).toContain('campaign')
  const previous = play([{ type: 'confirm-back' }], idle, start + 101_000)
  expect(previous.step).toBe('feed')
  expect(activeEvent(previous)).toBeUndefined()
  expect(parseSave(serialize(previous))?.step).toBe('feed')
})

it('ゲーム内で表示するシードから初回を含む構成を再現する', () => {
  const initial = createRun(start)
  expect(variantFor(initial.seed)).toBe(0)
  const replay = play([{ type: 'replay' }], initial)
  expect(variantFor(replay.seed)).not.toBe(variantFor(initial.seed))
})

it('表示できない日時のクリア記録は保存の破損として扱う', () => {
  const cleared = play(Array<GameAction>(12).fill(next), reachPlans())
  const record = cleared.records[0]!
  const corrupt = { ...cleared, records: [record, { ...record, clearedAt: Number.MAX_SAFE_INTEGER }] }
  expect(parseSave(serialize(corrupt))).toBeUndefined()
})

it('一回の操作で複数の誘導に同意しても、同意操作を一回だけ記録する', () => {
  const review = play([{ type: 'offer', event: 'cookie-review' }])
  const agreed = play([{ type: 'consent', pattern: 14 }, { type: 'close', event: 'cookie-review' }], review)
  expect(agreed.stats.consents).toBe(1)
  expect(agreed.avoided).not.toContain(5)
  expect(agreed.avoided).not.toContain(14)
})

it('同じヒントを開き直した回数も記録する', () => {
  const run = play([{ type: 'show-hint' }, { type: 'close', event: 'hint' }, { type: 'show-hint' }])
  expect(run.stats.hints).toBe(2)
  expect(parseSave(serialize(run))?.hints).toEqual(['cookie', 'cookie'])
})
