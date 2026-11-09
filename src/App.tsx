import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { hintNudgeSeconds, stageNames, stages, stepConfig } from './game/config'
import { activeEvent, variantFor } from './game/engine'
import { useGame } from './game/store'
import type { SceneProps } from './game/types'
import { AnswerReview } from './views/AnswerReview'
import { Authentication } from './views/Authentication'
import { DialogHost } from './views/DialogHost'
import { Membership } from './views/Membership'
import { Result } from './views/Result'
import { Storefront } from './views/Storefront'

function subscribeHash(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function currentHash() {
  return window.location.hash
}

export function App() {
  const { run, dispatch } = useGame()
  const hash = useSyncExternalStore(subscribeHash, currentHash)
  const answerRoute = /^#answers(?:-stage-[1-5])?$/.test(hash)
  const stage = stepConfig[run.step].stage
  const event = activeEvent(run)
  const modal = event?.id ?? (run.status === 'failed' ? 'failure' : undefined)
  const storefront = stage === 1
  const scene = run.status === 'cleared' ? (answerRoute ? 'answers' : 'result') : run.step
  const main = useRef<HTMLElement>(null)
  const previousScene = useRef(scene)
  const props: SceneProps = {
    step: run.step, seed: run.seed, variant: variantFor(run.seed),
    elapsedMs: run.startedAt + run.elapsedMs - run.lastProgressAt, reducedMotion: run.reducedMotion, dispatch,
  }

  useEffect(() => {
    function tick() {
      if (document.visibilityState === 'visible') dispatch({ type: 'tick' })
    }
    function activity() {
      dispatch({ type: 'activity' })
    }
    document.addEventListener('pointerdown', activity)
    document.addEventListener('keydown', activity)
    document.addEventListener('visibilitychange', tick)
    const timer = window.setInterval(tick, 1000)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('pointerdown', activity)
      document.removeEventListener('keydown', activity)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [dispatch])

  useLayoutEffect(() => {
    const changedScene = previousScene.current !== scene
    previousScene.current = scene
    if (scene === 'answers' && hash !== '#answers') {
      const target = document.getElementById(hash.slice(1))
      target?.focus({ preventScroll: true })
      target?.scrollIntoView()
      return
    }
    if (!changedScene) return
    window.scrollTo(0, 0)
    main.current?.focus({ preventScroll: true })
  }, [hash, scene])

  const nudge = run.startedAt + run.elapsedMs - run.lastProgressAt >= hintNudgeSeconds * 1000

  return (
    <div className="app-shell" data-reduced-motion={run.reducedMotion} data-stage={stage}>
      <aside className="game-toolbar" aria-label="ゲーム操作">
        <div className="toolbar-inner">
          <span className="game-name">ログインさせてください</span>
          <span className="fiction-badge">架空のサービス</span>
          <div className="toolbar-actions">
            {run.status === 'playing' && (
              <button type="button" className="tool-button" data-nudge={nudge}
                onClick={() => dispatch({ type: 'show-hint' })}>ヒント</button>
            )}
            <button type="button" className="tool-button" onClick={() => dispatch({ type: 'offer', event: 'settings' })}>
              ゲーム設定
            </button>
          </div>
        </div>
      </aside>
      <header className="brand-header">
        <div className="brand-inner">
          <div className="brand-mark">
            <img src="/yohaku.svg" alt="" width="40" height="40" />
            <div><span className="brand-name">余白ストア</span><span className="brand-category">文具と紙ものの店</span></div>
          </div>
          {!storefront && <span className="brand-context">{run.status === 'cleared' ? '会員ページ' : '会員手続き'}</span>}
        </div>
      </header>
      {!storefront && run.status !== 'cleared' && (
        <div className="stage-bar">
          <nav className="stage-inner" aria-label="手続きの進行状況">
            <ol>
              {stages.map(number => (
                <li key={number} aria-current={number === stage ? 'step' : undefined}
                  className={number <= stage ? 'stage-reached' : undefined}>
                  <span className="stage-number">{number}</span><span className="stage-name">{stageNames[number]}</span>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}
      <main ref={main} tabIndex={-1} className={storefront ? 'game-main game-main--storefront' : 'game-main'}>
        {scene === 'answers' ? <AnswerReview run={run} /> : scene === 'result' ? <Result run={run} dispatch={dispatch} /> : (
          <div key={`${run.revision}-${run.step}`}>
            {stage === 1 ? <Storefront {...props} /> : stage < 4 ? <Membership {...props} /> : <Authentication {...props} />}
          </div>
        )}
        {!storefront && run.status === 'playing' && (
          <div className="step-back">
            <button type="button" className="btn btn--subtle" onClick={() => dispatch({ type: 'offer', event: 'back' })}>
              前の手続きに戻る
            </button>
          </div>
        )}
      </main>
      <footer className="brand-footer">
        <div className="brand-footer-inner">
          <div><span className="footer-name">余白ストア</span><span className="footer-caption">文具と紙ものの店</span></div>
          <small>ゲーム内で表示される広告、料金、認証はすべて架空です。</small>
        </div>
      </footer>
      <DialogHost modal={modal} page={event?.page ?? 0} run={run} dispatch={dispatch} />
    </div>
  )
}
