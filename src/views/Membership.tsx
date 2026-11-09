import { useCallback, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { SceneProps } from '../game/types'
import { termsChapters } from './memberTerms'
import './membership.css'

type Advance = Pick<SceneProps, 'dispatch'>

const paidPlanAction = '優待会員で登録する'
const paidFeeAction = '手数料を含めて引き継ぐ'
const extrasAction = '選択内容で続ける'

function MemberPage({ title, description, children }: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="member-scene" aria-labelledby="membership-heading">
      <header className="member-heading">
        <p className="member-kicker">余白ストア 会員窓口</p>
        <h1 id="membership-heading" tabIndex={-1}>{title}</h1>
        <p className="member-description">{description}</p>
      </header>
      {children}
    </section>
  )
}

function Plans({ elapsedMs, dispatch }: Pick<SceneProps, 'elapsedMs' | 'dispatch'>) {
  const seconds = Math.max(0, Math.ceil((75_000 - (elapsedMs)) / 1000))
  const countdown = [Math.floor(seconds / 60), seconds % 60]
    .map(part => String(part).padStart(2, '0')).join(':')

  return (
    <MemberPage title="会員プランを選ぶ" description="引き継ぎ後にご利用になる会員プランをお選びください。">
      <div className="member-window">
        <div>
          <p className="member-window__label">基本会員の受付状況</p>
          <p className="member-window__count">残り <strong>1</strong> 件</p>
          <p className="member-window__visitors">現在824名が会員手続き中です。</p>
        </div>
        <div className="member-window__clock">
          <span>受付終了まで</span>
          <span role="timer" aria-label="受付の残り時間" className="member-window__time">{countdown}</span>
        </div>
      </div>
      <div className="member-plans">
        <article className="member-plan">
          <p className="member-plan__badge">会員サービス</p>
          <h2>基本会員</h2>
          <p className="member-plan__price"><strong>0</strong> 円</p>
          <ul>
            <li>注文履歴を確認できます。</li>
            <li>商品を保存リストに登録できます。</li>
            <li>店頭受取の予定を確認できます。</li>
          </ul>
          <button className="btn member-plan__basic" type="button" onClick={() => dispatch({ type: 'next' })}>
            基本会員で続ける
          </button>
        </article>
        <article className="member-plan member-plan--featured">
          <p className="member-plan__badge">おすすめ</p>
          <h2>優待会員</h2>
          <p className="member-plan__price"><strong>680</strong> 円<span>／月</span></p>
          <ul>
            <li>基本会員のサービスをご利用いただけます。</li>
            <li>季節の新商品を先行注文できます。</li>
            <li>対象のご注文で配送料の優待を受けられます。</li>
          </ul>
          <button className="btn btn--primary" type="button"
            onClick={() => dispatch({ type: 'fail', pattern: 22, cause: paidPlanAction })}>
            {paidPlanAction}
          </button>
          <small>登録時に初月分が発生します。利用期間は毎月更新され、終了手続きがない限り翌月分が発生します。</small>
        </article>
      </div>
    </MemberPage>
  )
}

function Fees({ dispatch }: Advance) {
  return (
    <MemberPage title="会員情報の引き継ぎ" description="基本会員への引き継ぎ方法をご確認ください。">
      <div className="member-card member-fees">
        <h2>優先引き継ぎのお申し込み</h2>
        <p>注文履歴と保存リストの移行を優先して受け付けます。</p>
        <dl className="member-fees__list">
          <div><dt>基本会員の月額料金</dt><dd>0 円</dd></div>
          <div><dt>優先引き継ぎ手数料</dt><dd>440 円</dd></div>
          <div><dt>今回のお支払い</dt><dd>440 円</dd></div>
        </dl>
        <div className="member-fees__actions">
          <button type="button" className="btn btn--primary"
            onClick={() => dispatch({ type: 'fail', pattern: 21, cause: paidFeeAction })}>
            {paidFeeAction}
          </button>
          <button type="button" className="btn member-fees__decline" onClick={() => dispatch({ type: 'next' })}>
            手数料を支払わずに続ける
          </button>
        </div>
      </div>
    </MemberPage>
  )
}

const additionalServices = [
  { id: 'newsletter', title: '新刊・入荷のお知らせを受け取る', description: '新しい文具や入荷予定をメールでお送りします。' },
  { id: 'sharing', title: '共同企画先に閲覧傾向を提供する', description: 'ご覧になった商品の分類を共同企画先に提供します。' },
  { id: 'delivery', title: '余白お届け便を申し込む', description: '月替わりの紙製品を月額480円でお届けします。' },
]

function Extras({ dispatch }: Advance) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const choices = new FormData(event.currentTarget)
    if (choices.has('delivery')) {
      dispatch({ type: 'fail', pattern: 7, cause: extrasAction })
    } else if (choices.has('newsletter') || choices.has('sharing')) {
      dispatch({ type: 'consent', pattern: 7 })
      dispatch({ type: 'offer', event: 'cancel-extras' })
    } else {
      dispatch({ type: 'next' })
    }
  }

  return (
    <MemberPage title="会員サービスの設定" description="引き継ぎ時に利用するサービスをお選びください。">
      <form className="member-card member-extras" onSubmit={submit}>
        <fieldset>
          <legend>追加サービス</legend>
          {additionalServices.map(service => (
            <div key={service.id} className="member-choice">
              <input type="checkbox" name={service.id} id={service.id} defaultChecked
                aria-describedby={`${service.id}-description`} />
              <div>
                <label htmlFor={service.id}>{service.title}</label>
                <p id={`${service.id}-description`}>{service.description}</p>
              </div>
            </div>
          ))}
        </fieldset>
        <button type="submit" className="btn btn--primary">{extrasAction}</button>
      </form>
    </MemberPage>
  )
}

function Terms({ dispatch }: Advance) {
  const [benefitChoice, setBenefitChoice] = useState<'individual' | 'bundle' | null>(null)
  const [blocked, setBlocked] = useState(false)
  const focusStatus = useCallback((node: HTMLParagraphElement | null) => {
    node?.focus({ preventScroll: true })
  }, [])

  function openPrivacy() {
    if (benefitChoice === null) {
      setBlocked(true)
      dispatch({ type: 'mistake', pattern: 23 })
      return
    }
    dispatch({ type: 'next' })
  }

  function jumpToChapter(id: string) {
    const chapter = document.getElementById(`member-terms-${id}`)
    chapter?.scrollIntoView({ block: 'start' })
    chapter?.focus({ preventScroll: true })
  }

  return (
    <MemberPage title="会員利用規約" description="アカウントを引き継ぐ前に、会員利用規約をご確認ください。">
      <div className="member-card member-terms">
        <nav aria-label="利用規約の目次" className="member-terms__index">
          <p>目次</p>
          <ol>
            {termsChapters.map(chapter => (
              <li key={chapter.id}>
                <button type="button" onClick={() => jumpToChapter(chapter.id)}>{chapter.title}</button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="member-terms__document" role="region" aria-label="会員利用規約の本文" tabIndex={0}>
          <p className="member-terms__meta">余白ストア会員利用規約　2026年11月1日改定</p>
          {termsChapters.map((chapter, index) => (
            <section key={chapter.id} className="member-terms__chapter">
              <h2 id={`member-terms-${chapter.id}`} tabIndex={-1}>第{index + 1}章　{chapter.title}</h2>
              {chapter.clauses.map(clause => (
                <article key={clause.number} className="member-terms__clause">
                  <h3>第{clause.number}条　{clause.title}</h3>
                  <p>{clause.body}</p>
                  {clause.control === 'benefits' && (
                    <div className="member-terms__control">
                      {benefitChoice !== 'individual' ? (
                        <button type="button" className="member-terms__link"
                          onClick={() => setBenefitChoice('individual')}>会員特典の自動適用を解除する</button>
                      ) : <p role="status" tabIndex={-1} ref={focusStatus}>
                        会員特典の自動適用を解除しました。
                      </p>}
                    </div>
                  )}
                  {clause.control === 'continue' && (
                    <div className="member-terms__control">
                      <button type="button" className="member-terms__link" onClick={openPrivacy}>
                        個別設定へ進む
                      </button>
                      {blocked && benefitChoice === null && <p className="member-terms__alert" role="alert">
                        会員特典の自動適用が有効です。第8条の適用条件をご確認ください。
                      </p>}
                    </div>
                  )}
                </article>
              ))}
            </section>
          ))}
        </div>
      </div>
      <div className="member-terms__actions">
        {benefitChoice === 'bundle' ? (
          <p role="status" tabIndex={-1} ref={focusStatus}>
            一括同意を受け付けました。第14条から個別設定へお進みください。
          </p>
        ) : (
          <button type="button" className="btn btn--primary" onClick={() => {
            setBenefitChoice('bundle')
            dispatch({ type: 'consent', pattern: 13 })
          }}>
            特典を含めて一括同意する
          </button>
        )}
      </div>
    </MemberPage>
  )
}

const privacyQuestions = [
  { id: 'mail', topic: '商品案内の受信', statement: '商品案内を受け取らない設定の解除を希望しません。' },
  { id: 'history', topic: '閲覧履歴の提供', statement: '閲覧履歴の提供を拒否しない設定を希望します。' },
]

function Privacy({ dispatch }: Advance) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const answers = new FormData(event.currentTarget)
    if (answers.get('mail') !== 'yes' || answers.get('history') !== 'no') {
      dispatch({ type: 'consent', pattern: 6 })
    }
    dispatch({ type: 'next' })
  }

  return (
    <MemberPage title="個人情報の個別設定" description="各項目の文章が、ご希望の設定に該当するかお答えください。">
      <form className="member-privacy" onSubmit={submit}>
        {privacyQuestions.map(question => (
          <section className="member-card member-privacy__item" key={question.id}>
            <h2>{question.topic}</h2>
            <fieldset>
              <legend>{question.statement}</legend>
              <div className="member-privacy__options">
                <label><input name={question.id} type="radio" value="yes" required />該当する</label>
                <label><input name={question.id} type="radio" value="no" />該当しない</label>
              </div>
            </fieldset>
          </section>
        ))}
        <div className="member-privacy__actions">
          <button className="btn btn--primary" type="submit">個別設定を保存する</button>
        </div>
      </form>
    </MemberPage>
  )
}

function Review({ variant, dispatch }: Pick<SceneProps, 'variant' | 'dispatch'>) {
  const choices = [
    <button type="button" className="btn btn--primary" key="accept" onClick={() => {
      dispatch({ type: 'consent', pattern: 8 })
      dispatch({ type: 'next' })
    }}>特典を受け取って続ける</button>,
    <button type="button" className="btn btn--subtle" key="decline" onClick={() => dispatch({ type: 'next' })}>
      会員特典を放棄して続ける
    </button>,
  ]

  return (
    <MemberPage title="設定内容の確認" description="認証に進む前に、会員特典の受け取りをご確認ください。">
      <div className="member-card member-review">
        <p className="member-plan__badge">会員限定</p>
        <h2>次回のお買い物に使える300円分の特典</h2>
        <p>商品案内の受信と共同企画先への閲覧履歴の提供を有効にすると、特典を受け取れます。</p>
        <p className="member-review__note">放棄すると、この手続きでの受け取り機会を失います。</p>
        <div className="member-review__actions">
          {variant === 1 ? choices.reverse() : choices}
        </div>
      </div>
    </MemberPage>
  )
}

export function Membership({ step, variant, elapsedMs, dispatch }: SceneProps) {
  switch (step) {
    case 'plans':
      return <Plans elapsedMs={elapsedMs} dispatch={dispatch} />
    case 'fees':
      return <Fees dispatch={dispatch} />
    case 'extras':
      return <Extras dispatch={dispatch} />
    case 'terms':
      return <Terms dispatch={dispatch} />
    case 'privacy':
      return <Privacy dispatch={dispatch} />
    case 'review':
      return <Review variant={variant} dispatch={dispatch} />
    default:
      return null
  }
}
