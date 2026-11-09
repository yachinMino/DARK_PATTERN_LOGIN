import { useState, type FormEvent, type PointerEvent, type ReactNode } from 'react'
import type { SceneProps } from '../game/types'
import './authentication.css'

type Dispatch = SceneProps['dispatch']

function AuthFrame({ category, title, description, children }: {
  category: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <article className="auth-panel" aria-labelledby="auth-heading">
      <header className="auth-panel__header">
        <p className="auth-panel__category"><span aria-hidden="true" />{category}</p>
        <h1 id="auth-heading">{title}</h1>
        <p className="auth-panel__description">{description}</p>
      </header>
      {children}
    </article>
  )
}

function Warning({ dispatch }: { dispatch: Dispatch }) {
  return (
    <AuthFrame category="接続を確認します" title="接続の保護が必要です"
      description="端末保護サービスを追加すると、ログイン時の接続を継続的に確認できます。">
      <div className="auth-warning">
        <span className="auth-warning__icon" aria-hidden="true">!</span>
        <div>
          <p className="auth-warning__title">端末保護サービスが有効になっていません。</p>
          <p>ログインする前に保護の追加を推奨します。</p>
        </div>
      </div>
      <div className="auth-offer">
        <div><span>端末保護プラン</span><p><strong>480円</strong>／月</p></div>
        <button className="btn btn--primary" type="button" onClick={() => dispatch({
          type: 'fail', pattern: 20, cause: '端末保護を追加する操作で、有料保護プランに申し込みました。',
        })}>端末保護を追加する</button>
      </div>
      <details className="auth-details">
        <summary>警告の詳細</summary>
        <p>この表示は保護サービスの契約状況を示しています。契約の有無にかかわらず会員認証をご利用いただけます。</p>
        <button className="btn btn--subtle" type="button" onClick={() => dispatch({ type: 'next' })}>
          保護サービスを利用せず続ける
        </button>
      </details>
    </AuthFrame>
  )
}

function Loading({ dispatch, elapsedMs, reducedMotion }: Pick<SceneProps, 'dispatch' | 'elapsedMs' | 'reducedMotion'>) {
  const phase = Math.floor(elapsedMs / 3500) % 3
  const progress = reducedMotion ? 88 : ([76, 88, 93][phase] ?? 76)
  const [retried, setRetried] = useState(false)

  return (
    <AuthFrame category="認証を準備しています" title="認証サービスに接続しています"
      description="接続の準備が完了するまでお待ちください。">
      <div className="auth-progress">
        <div><label htmlFor="auth-loading">照合サービスの応答を待っています。</label><span>{progress}%</span></div>
        <progress id="auth-loading" max={100} value={progress} />
      </div>
      <details className="auth-details">
        <summary>処理状況を表示</summary>
        <dl className="auth-diagnostics">
          <div><dt>応答状況</dt><dd>応答待ちです。</dd></div>
          <div><dt>未完了の処理</dt><dd>おすすめ設定を取得しています。</dd></div>
          <div><dt>会員認証への影響</dt><dd>ありません。</dd></div>
        </dl>
        <div className="auth-actions">
          <button className="btn btn--subtle" type="button" onClick={() => {
            setRetried(true)
            dispatch({ type: 'mistake', pattern: 15 })
          }}>接続を再試行する</button>
          <button className="btn btn--subtle" type="button" onClick={() => dispatch({ type: 'next' })}>
            待機を終了して続ける
          </button>
        </div>
        {retried && <p role="status">接続を再試行しました。応答を待っています。</p>}
      </details>
    </AuthFrame>
  )
}

function Captcha({ dispatch }: { dispatch: Dispatch }) {
  const [checked, setChecked] = useState(false)
  const [registered, setRegistered] = useState(false)

  return (
    <AuthFrame category="認証を準備しています" title="アクセスを確認します"
      description="アクセス制限を解除するには、以下の確認を完了してください。">
      <div className="auth-captcha">
        <label className="auth-check">
          <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
          <span>私は自動プログラムではありません。</span>
        </label>
        <div className="auth-captcha__seal" aria-hidden="true"><span>▧</span>会員アクセス確認</div>
      </div>
      <div className="auth-actions auth-actions--main">
        <button className="btn btn--primary" type="button" disabled={!checked || registered} onClick={() => {
          dispatch({ type: 'consent', pattern: 4 })
          setRegistered(true)
        }}>確認して続ける</button>
      </div>
      {registered && <p className="auth-notice" role="status">商品案内への登録を受け付けました。</p>}
      <details className="auth-details">
        <summary>認証サービスについて</summary>
        <p>この確認を送信すると、余白ストアの商品案内に登録されます。会員認証では広告登録を省略できます。</p>
        <button className="btn btn--subtle" type="button" onClick={() => dispatch({ type: 'next' })}>
          {registered ? '広告登録を取り消して認証する' : '広告登録をせず認証する'}
        </button>
      </details>
    </AuthFrame>
  )
}

function Credentials({ dispatch, seed }: { dispatch: Dispatch; seed: number }) {
  const issuedId = `YM-${String((seed >>> 0) % 10_000).padStart(4, '0')}`
  const [value, setValue] = useState('')
  const [autofilled, setAutofilled] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [marketingRecorded, setMarketingRecorded] = useState(false)
  const [response, setResponse] = useState<'invalid' | 'interrupted'>()

  function updateValue(nextValue: string) {
    setValue(nextValue)
    setResponse(undefined)
    if (!autofilled && nextValue.length >= 4) {
      setAutofilled(true)
      setMarketing(true)
    }
  }

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (value.trim().toUpperCase() !== issuedId) {
      dispatch({ type: 'mistake', pattern: 24 })
      setResponse('invalid')
      return
    }
    if (marketing && !marketingRecorded) {
      dispatch({ type: 'consent', pattern: 28 })
      setMarketingRecorded(true)
    }
    setResponse('interrupted')
  }

  return (
    <AuthFrame category="仮IDで認証します" title="会員認証を行います"
      description="この画面で発行した架空のIDを使用してください。個人情報は入力しないでください。">
      <div className="auth-receipt"><span>発行した仮ID</span><code className="auth-synthetic-id">{issuedId}</code></div>
      <form className="auth-form" onSubmit={verify}>
        {autofilled && <p className="auth-autofill" role="status">仮IDに関連する設定を補完しました。</p>}
        <label className="auth-field">
          認証用の仮ID
          <input type="text" value={value} onChange={(event) => updateValue(event.target.value)}
            autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={12} required />
        </label>
        {autofilled && <label className="auth-check auth-form__check">
          <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />
          <span>このIDで商品案内を受け取る</span>
        </label>}
        <button className="btn btn--primary" type="submit">仮IDを確認する</button>
      </form>
      {response === 'invalid' && <p role="alert" className="auth-notice auth-notice--error">発行した仮IDと一致しません。入力内容をご確認ください。</p>}
      {response === 'interrupted' && <>
        <div className="auth-notice auth-notice--error" role="alert">
          <p>仮IDを照合できませんでした。</p>
          <code>認証コード ERR-024</code>
        </div>
        <details className="auth-details">
          <summary>エラーの詳細</summary>
          <dl className="auth-diagnostics">
            <div><dt>仮IDの確認</dt><dd>発行したIDと一致しました。</dd></div>
            <div><dt>通常の照合先</dt><dd>応答がありません。</dd></div>
            <div><dt>別の照合先</dt><dd>現在の認証記録を利用できます。</dd></div>
          </dl>
          <button className="btn btn--subtle" type="button" onClick={() => dispatch({ type: 'next' })}>
            認証記録で照合する
          </button>
        </details>
      </>}
    </AuthFrame>
  )
}

function Fallback({ dispatch }: { dispatch: Dispatch }) {
  const [recordRead, setRecordRead] = useState(false)
  const [marketing, setMarketing] = useState(false)

  function activatePrimary() {
    if (!recordRead) {
      setRecordRead(true)
      return
    }
    dispatch({ type: 'consent', pattern: 27 })
    setMarketing(true)
  }

  return (
    <AuthFrame category="別の照合先を使用します" title="認証記録を照合します"
      description="今回発行した仮IDの記録を読み出してください。">
      <div className="auth-receipt" role="status">
        <span>認証記録</span><span>{recordRead ? '今回の記録を取得しました。' : '読み出していません。'}</span>
      </div>
      <div className="auth-actions auth-actions--main">
        <button className="btn btn--primary" type="button" disabled={marketing} onClick={activatePrimary}>
          {recordRead ? '認証記録を配信設定に使用する' : '認証記録を読み出す'}
        </button>
      </div>
      {marketing && <p className="auth-notice" role="status">商品案内の配信設定に使用しました。</p>}
      {recordRead && <details className="auth-details">
        <summary>記録の照合条件</summary>
        <p>発行した仮IDの記録だけで照合できます。商品案内の配信設定は任意です。</p>
        <button className="btn btn--subtle" type="button" onClick={() => dispatch({ type: 'next' })}>
          認証記録だけを使用する
        </button>
      </details>}
    </AuthFrame>
  )
}

function Final({ dispatch, variant, reducedMotion }: Pick<SceneProps, 'dispatch' | 'variant' | 'reducedMotion'>) {
  const [moves, setMoves] = useState(0)
  const [registered, setRegistered] = useState(false)

  function avoidPointer(event: PointerEvent<HTMLButtonElement>) {
    if (reducedMotion || event.pointerType !== 'mouse' || event.buttons !== 0 || event.currentTarget === document.activeElement
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setMoves((count) => Math.min(count + 1, 2))
  }

  return (
    <AuthFrame category="認証が完了しました" title="ログイン前の最終確認を行います"
      description="会員向けの商品案内を登録すると、取り扱い商品の入荷情報を受け取れます。">
      <div className="auth-final-offer">
        <div><p className="auth-final-offer__title">余白ストアの商品案内</p><p>配信頻度は月に数回です。</p></div>
        <button className="btn btn--primary" type="button" disabled={registered} onClick={() => {
          dispatch({ type: 'consent', pattern: 30 })
          setRegistered(true)
        }}>商品案内に登録する</button>
      </div>
      {registered && <p className="auth-notice" role="status">商品案内を選択しました。ログインの前に登録を取り消せます。</p>}
      <div className="auth-refusal-area" data-alignment={variant === 1 ? 'end' : 'start'}>
        <button className="btn btn--subtle auth-refusal" type="button" data-position={moves}
          onPointerMove={avoidPointer} onClick={() => dispatch({ type: 'next' })}>
          登録せずログインする
        </button>
      </div>
    </AuthFrame>
  )
}

export function Authentication({ step, seed, variant, elapsedMs, reducedMotion, dispatch }: SceneProps) {
  switch (step) {
    case 'warning': return <Warning dispatch={dispatch} />
    case 'loading': return <Loading dispatch={dispatch} elapsedMs={elapsedMs} reducedMotion={reducedMotion} />
    case 'captcha': return <Captcha dispatch={dispatch} />
    case 'credentials': return <Credentials dispatch={dispatch} seed={seed} />
    case 'fallback': return <Fallback dispatch={dispatch} />
    case 'final': return <Final dispatch={dispatch} variant={variant} reducedMotion={reducedMotion} />
    default: return null
  }
}
