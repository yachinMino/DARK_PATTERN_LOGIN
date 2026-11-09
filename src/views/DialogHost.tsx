import { useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { stepConfig } from '../game/config'
import type { Run } from '../game/engine'
import type { EventId, GameAction } from '../game/types'

type Modal = EventId | 'failure'
type Dispatch = (action: GameAction) => void

interface DialogProps {
  modal: Modal | undefined
  page: number
  run: Run
  dispatch: Dispatch
}

function Action({ children, onClick, primary = false, disabled = false, focus = false }: {
  children: ReactNode
  onClick: () => void
  primary?: boolean
  disabled?: boolean
  focus?: boolean
}) {
  return <button type="button" className={`btn ${primary ? 'btn--primary' : 'btn--subtle'}`}
    onClick={onClick} disabled={disabled} data-dialog-focus={focus ? '' : undefined}>{children}</button>
}

function Title({ children }: { children: ReactNode }) {
  return <h2 id="game-dialog-title" tabIndex={-1}>{children}</h2>
}

function CookieReview({ dispatch }: { dispatch: Dispatch }) {
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState(false)
  const confirmTitle = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => {
    if (confirm) confirmTitle.current?.focus()
  }, [confirm])
  const choices = ['必要なCookieのみを使用する', '閲覧履歴の共有を希望しない', '理由を回答しない']

  if (confirm) {
    return (
      <>
        <h2 id="game-dialog-title" ref={confirmTitle} tabIndex={-1}>Cookieの拒否内容を確認</h2>
        <p>任意のCookieを拒否すると、おすすめ商品の表示や入荷案内が最適化されなくなります。</p>
        <div className="dialog-actions dialog-actions--between">
          <Action onClick={() => dispatch({ type: 'close', event: 'cookie-review' })}>任意のCookieを拒否する</Action>
          <Action primary onClick={() => {
            dispatch({ type: 'consent', pattern: 14 })
            dispatch({ type: 'close', event: 'cookie-review' })
          }}>同意して設定を保存する</Action>
        </div>
      </>
    )
  }

  return (
    <>
      <Title>Cookieの利用設定</Title>
      <p>拒否する場合は、利用設定の変更理由を選択してください。</p>
      <fieldset className="dialog-options">
        <legend>拒否の理由を選ぶ</legend>
        {choices.map(choice => <label key={choice}><input type="radio" name="cookie-reason"
          checked={reason === choice} onChange={() => setReason(choice)} />{choice}</label>)}
      </fieldset>
      <div className="dialog-actions"><Action primary disabled={!reason} onClick={() => setConfirm(true)}>拒否内容を確認する</Action></div>
    </>
  )
}

const ads = [
  { title: '会員だけの先行ご招待', line: '季節の紙ものを会員価格で。先行受付のお知らせです。', mark: '先行', close: '広告を閉じる' },
  { title: 'お届け便の受付を開始しました', line: '毎月届く紙ものと文具の定期便です。', mark: '定期便', close: '続けて表示された広告を閉じる' },
  { title: 'ご案内をお見逃しなく', line: '新刊と再入荷の情報をまとめてお届けします。', mark: '新着', close: '最後の広告を閉じる' },
]

function Ad({ page, dispatch }: { page: number; dispatch: Dispatch }) {
  const [enlarged, setEnlarged] = useState(false)
  const ad = ads[page] ?? ads[0]!
  return (
    <>
      <div className="ad-dialog-top">
        <span>余白ストアからのご案内</span>
        <button className="ad-close" type="button" data-dialog-focus aria-label={ad.close}
          onClick={() => dispatch({ type: 'ad-next' })}>×</button>
      </div>
      <div className="dialog-ad" data-enlarged={enlarged}>
        <button className="ad-lookalike" type="button" aria-label="広告枠内の×"
          onClick={() => { setEnlarged(true); dispatch({ type: 'mistake', pattern: 2 }) }}>×</button>
        <span className="eyebrow">会員限定・広告</span>
        <span className="dialog-ad-stamp" aria-hidden="true">{ad.mark}</span>
        <Title>{ad.title}</Title>
        <p>{ad.line}</p>
        <Action primary onClick={() => dispatch({ type: 'offer', event: 'fake-login' })}>広告の会員ページを開く</Action>
      </div>
    </>
  )
}

function FakeLogin({ dispatch }: { dispatch: Dispatch }) {
  const [filled, setFilled] = useState(false)
  return (
    <>
      <p className="eyebrow">余白ストア提携企画</p>
      <Title>特典受取用ログイン</Title>
      <p>先行特典の受け取りには、企画専用の会員番号で照合してください。</p>
      <label className="fake-field">企画専用の会員番号<input type="text" readOnly autoComplete="off"
        value={filled ? 'DEMO-024' : ''} /></label>
      <div className="dialog-actions">
        <Action onClick={() => setFilled(true)}>架空の会員番号を入力する</Action>
        <Action disabled={!filled} primary onClick={() => dispatch({
          type: 'fail', pattern: 1, cause: '仮情報でログインする',
        })}>仮情報でログインする</Action>
      </div>
      <Action onClick={() => dispatch({ type: 'close', event: 'fake-login' })}>広告に戻る</Action>
    </>
  )
}

function ModalContent({ modal, page, run, dispatch }: Omit<DialogProps, 'modal'> & { modal: Modal }) {
  const close = () => dispatch({ type: 'close', event: modal as EventId })
  switch (modal) {
    case 'cookie-review':
      return <CookieReview dispatch={dispatch} />
    case 'ad':
      return <Ad key={page} page={page} dispatch={dispatch} />
    case 'fake-login':
      return <FakeLogin dispatch={dispatch} />
    case 'campaign':
      return (
        <><p className="eyebrow">期間限定・広告</p><Title>紙もの特集を公開しました</Title>
          <p>離席中のお客様に、会員向けの季節特集をご案内しています。</p>
          <div className="dialog-actions"><Action onClick={close}>ご案内を閉じる</Action></div></>
      )
    case 'cancel-extras':
      return (
        <><Title>追加サービスの取り消し</Title>
          <p>選択した追加サービスを受け付けました。会員情報の引き継ぎは、追加サービスを取り消してから再開できます。</p>
          <div className="dialog-actions"><Action onClick={() => dispatch({ type: 'undo-extras' })}>追加サービスを取り消す</Action></div></>
      )
    case 'back':
      return (
        <><Title>前の手続きに戻りますか</Title>
          <p>この画面の入力内容は失われます。</p>
          <div className="dialog-actions dialog-actions--between">
            <Action onClick={() => dispatch({ type: 'confirm-back' })}>前の手続きへ戻る</Action>
            <Action primary onClick={close}>現在の手続きを続ける</Action>
          </div></>
      )
    case 'hint':
      return (
        <><Title>手続きのヒント</Title><p>{stepConfig[run.step].hint}</p>
          <div className="dialog-actions"><Action onClick={close}>ヒントを閉じる</Action></div></>
      )
    case 'settings':
      return (
        <><Title>ゲーム設定</Title>
          <div className="settings-box"><label><input type="checkbox" checked={run.reducedMotion}
            onChange={event => dispatch({ type: 'motion', reduced: event.target.checked })} />画面の動きを減らす</label>
            <p>現在のシード <code>{run.seed}</code></p></div>
          <div className="dialog-actions dialog-actions--between">
            <Action onClick={() => dispatch({ type: 'offer', event: 'reset' })}>最初からやり直す</Action>
            <Action primary onClick={close}>設定を閉じる</Action>
          </div></>
      )
    case 'reset':
      return (
        <><Title>進行をリセットしますか</Title>
          <p>現在のプレイを最初からやり直します。設定とクリア記録は保存されます。</p>
          <div className="dialog-actions dialog-actions--between">
            <Action onClick={close}>リセットを取り消す</Action>
            <Action primary onClick={() => dispatch({ type: 'reset' })}>進行をリセットする</Action>
          </div></>
      )
    case 'failure':
      return (
        <><p className="eyebrow">手続きエラー</p><Title>手続きを中断しました</Title>
          <p>{run.failure?.pattern === 1 ? '広告の会員ページに仮の会員番号を送信しました。' : '会員ログインに不要な支払いまたは有料サービスを申し込みました。'}</p>
          <dl className="failure-cause"><dt>原因となった操作</dt><dd>{run.failure?.cause}</dd></dl>
          <div className="dialog-actions"><Action primary onClick={() => dispatch({ type: 'retry' })}>チェックポイントから再開</Action></div></>
      )
  }
}

function focusable(dialog: HTMLDialogElement) {
  return [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), summary, a[href]')]
    .filter(node => node.getClientRects().length > 0 && node.tabIndex >= 0)
}

export function DialogHost({ modal, page, run, dispatch }: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const origin = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    const element = dialog.current
    if (!element) return
    if (modal) {
      if (!element.open) {
        origin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        element.showModal()
      }
      element.querySelector<HTMLElement>('[data-dialog-focus], h2')?.focus({ preventScroll: true })
    } else if (element.open) {
      element.close()
      if (origin.current?.isConnected) origin.current.focus({ preventScroll: true })
      else document.querySelector<HTMLElement>('.game-main')?.focus({ preventScroll: true })
      origin.current = null
    }
  }, [modal, page])

  function trap(event: KeyboardEvent<HTMLDialogElement>) {
    const element = dialog.current
    if (event.key !== 'Tab' || !element) return
    const stops = focusable(element)
    const first = stops[0]
    const last = stops.at(-1)
    if (!first || !last) return
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
    if (event.shiftKey && (document.activeElement === first || !stops.includes(document.activeElement as HTMLElement))) {
      event.preventDefault()
      last.focus()
    }
  }

  function escape() {
    if (!modal || modal === 'failure' || modal === 'cookie-review') return
    if (modal === 'ad') dispatch({ type: 'ad-next' })
    else if (modal === 'cancel-extras') dispatch({ type: 'undo-extras' })
    else dispatch({ type: 'close', event: modal })
  }

  return (
    <dialog ref={dialog} className="game-dialog" data-dialog={modal} aria-labelledby="game-dialog-title"
      onKeyDown={trap} onCancel={event => { event.preventDefault(); escape() }}>
      {modal && <ModalContent key={modal} modal={modal} page={page} run={run} dispatch={dispatch} />}
      {modal && modal !== 'settings' && modal !== 'reset' && (
        <div className="dialog-utility">
          <button type="button" className="tool-button" onClick={() => dispatch({ type: 'offer', event: 'reset' })}>
            最初からやり直す
          </button>
        </div>
      )}
    </dialog>
  )
}
