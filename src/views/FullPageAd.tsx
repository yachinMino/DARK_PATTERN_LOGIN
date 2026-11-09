import { useState } from 'react'
import type { GameAction } from '../game/types'
import './fullPageAd.css'

export function FullPageAd({ dispatch }: { dispatch: (action: GameAction) => void }) {
  const [expanded, setExpanded] = useState(false)

  function expandOffer() {
    if (expanded) return
    setExpanded(true)
    dispatch({ type: 'mistake', pattern: 34 })
  }

  return (
    <div className="full-ad" data-expanded={expanded}>
      <div className="full-ad__banner">
        <span>余白ストア｜会員限定のご案内</span>
        <button type="button" className="full-ad__decoy" aria-label="広告の右上にある×" onClick={expandOffer}>×</button>
      </div>
      <div className="full-ad__poster">
        <div className="full-ad__copy">
          <p className="full-ad__label">季節のお届け便</p>
          <h2 id="game-dialog-title" aria-label="まるごと文具祭" tabIndex={-1}>まるごと<span>文具祭</span></h2>
          <p className="full-ad__description">人気のノートと筆記具を、毎月まとめてお届けします。</p>
          <button type="button" className="btn full-ad__offer" onClick={() => dispatch({ type: 'offer', event: 'fake-login' })}>
            広告の会員ページを開く
          </button>
          {expanded && (
            <div className="full-ad__details" role="status">
              特典の詳細を表示しました。初回の特典は定期便のお申し込みに適用されます。
            </div>
          )}
        </div>
        <div className="full-ad__display">
          <div className="full-ad__notebook full-ad__notebook--pink" aria-hidden="true" />
          <div className="full-ad__notebook full-ad__notebook--cream" aria-hidden="true" />
          <p className="full-ad__seal">定期便の初回<strong>半額</strong></p>
        </div>
      </div>
    </div>
  )
}
