import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import type { PatternId, SceneProps } from '../game/types'
import './storefront.css'

type Art = 'notebooks' | 'pens' | 'papers'
type FeedEntry = { label: string; title: string; description: string; art: Art }

const feedEntries: FeedEntry[] = [
  { label: '入荷情報', title: '方眼ノートを再入荷しました', description: '淡い罫線の方眼ノートを、A5・B6の2サイズで取り扱っています。', art: 'notebooks' },
  { label: '読みもの', title: '便箋と封筒の組み合わせ', description: '定形郵便で送れる封筒と、二つ折りで収まる便箋を紹介します。', art: 'papers' },
  { label: '商品案内', title: 'ペン先とインクの選び方', description: '字幅とインクの種類から、用途に合った筆記具を選べます。', art: 'pens' },
  { label: '入荷情報', title: '綴じ手帳の新色が入荷しました', description: '苔色と墨色の表紙を追加しました。中紙は既存品と同じ無地です。', art: 'notebooks' },
  { label: '商品案内', title: '交換用の替芯を追加しました', description: '品番はペンの軸に刻印しています。交換前にご確認ください。', art: 'pens' },
  { label: '読みもの', title: '薄葉紙の保管方法', description: '湿度の高い場所を避け、折り目が付かないよう平置きで保管してください。', art: 'papers' },
  { label: '商品案内', title: '保管箱の内寸を掲載しました', description: '手帳を収納する場合は、表紙や留め具を含む寸法をご確認ください。', art: 'papers' },
]

const editionEnds = [3, 5, feedEntries.length]

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" width="18" height="18" fill="none">
      <path d={diagonal ? 'M4 14 14 4M6 4h8v8' : 'M3 9h12m-5-5 5 5-5 5'} stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProductArt({ art }: { art: Art }) {
  return (
    <svg aria-hidden="true" className={`shop-product-art shop-product-art--${art}`} viewBox="0 0 300 156">
      {art === 'notebooks' && <>
        <path fill="#a09c79" opacity=".2" d="m51 128 98-94 82 10 19 66-101 32z" />
        <g transform="translate(139 22) rotate(13 46 57)">
          <rect x="5" y="7" width="88" height="108" rx="4" fill="#536c5b" />
          <rect x="4" y="3" width="88" height="109" rx="4" fill="#e5d6b7" />
          <rect width="90" height="109" rx="4" fill="#79917a" />
          <path d="M9 2v105m70-105v105" stroke="#57725f" />
          <rect x="24" y="24" width="39" height="29" rx="1" fill="#d6d6b4" />
          <path d="M30 36h27m-22 5h17" stroke="#62775e" strokeLinecap="round" />
        </g>
        <g transform="translate(67 24) rotate(-13 46 57)">
          <rect x="3" y="5" width="98" height="114" rx="3" fill="#ad8e66" />
          <rect x="2" y="2" width="97" height="114" rx="3" fill="#f3e8cb" />
          <rect width="97" height="113" rx="3" fill="#dabb8f" />
          <path d="M10 2v109m11-45h60m-60 8h60m-60 8h60m-60 8h60m-60 8h60" stroke="#ad8e66" />
          <path d="M21 39h33m-33 6h23" stroke="#7c6848" strokeLinecap="round" />
        </g>
      </>}
      {art === 'pens' && <>
        <path fill="#8a705f" opacity=".18" d="m58 119 177-86 12 24-177 86zM76 144l154-50 4 15-150 43z" />
        <g transform="translate(47 113) rotate(-29)">
          <path d="M20 0h189a7 7 0 0 1 0 14H20z" fill="#394f45" />
          <path d="M19 0 0 7l19 7h10V0z" fill="#b99863" />
          <path d="M3 7h15m87-7v14m10-12h94" stroke="#e2c79a" />
          <path d="M181 4h24" stroke="#f4dfb1" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g transform="translate(73 130) rotate(-13)">
          <path d="M20 0h155a5 5 0 0 1 0 10H20z" fill="#ab6551" />
          <path d="M0 5 20 0v10z" fill="#e4bb92" />
          <path d="M0 5 6 3v4z" fill="#565348" />
          <path d="M21 3h154" stroke="#d59777" />
        </g>
      </>}
      {art === 'papers' && <>
        <path fill="#6e7b63" opacity=".18" d="m58 121 27-92 151 22 15 67-71 24z" />
        <g transform="translate(108 45) rotate(10 63 43)">
          <rect width="125" height="79" rx="2" fill="#809781" />
          <path d="m1 77 61-46 62 46M1 2l61 46L124 2" fill="#8ba48d" stroke="#68836e" />
        </g>
        <g transform="translate(73 24) rotate(-13 54 50)">
          <rect width="113" height="105" rx="2" fill="#f3e9d3" />
          <path d="M11 35h91M11 44h91M11 53h91M11 62h91M11 71h91M11 80h91" stroke="#c0ae8f" strokeWidth=".8" />
          <circle cx="92" cy="19" r="6" stroke="#b37b60" />
          <path d="M89 19h6m-3-3v6" stroke="#b37b60" />
        </g>
      </>}
    </svg>
  )
}

function CookieBanner({ dispatch }: Pick<SceneProps, 'dispatch'>) {
  function accept() {
    dispatch({ type: 'consent', pattern: 5 })
    dispatch({ type: 'next' })
  }

  return (
    <section className="shop-cookie" aria-labelledby="shop-cookie-title">
      <div className="shop-cookie-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
          <path d="M28 17A12 12 0 1 1 15 4a6 6 0 0 0 6 6 6 6 0 0 0 7 7Z" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="11.5" cy="15" r="1.5" fill="currentColor" />
          <circle cx="17.5" cy="20.5" r="1.5" fill="currentColor" />
          <circle cx="11" cy="22" r="1" fill="currentColor" />
        </svg>
      </div>
      <div className="shop-cookie-copy">
        <h2 id="shop-cookie-title">Cookieの利用について</h2>
        <p>サイトの運営と利用状況の分析、商品案内の表示にCookieを使用します。設定から利用目的ごとの選択ができます。</p>
      </div>
      <div className="shop-cookie-actions">
        <button className="shop-button shop-cookie-accept" type="button" onClick={accept}>すべてのCookieを許可</button>
        <button className="shop-quiet shop-cookie-settings" type="button" onClick={() => dispatch({ type: 'offer', event: 'cookie-review' })}>Cookieの設定を管理</button>
      </div>
    </section>
  )
}

function StoreHome({ dispatch, step, variant }: Pick<SceneProps, 'dispatch' | 'step' | 'variant'>) {
  const [showMembership, setShowMembership] = useState(false)
  const membershipTitle = useRef<HTMLHeadingElement>(null)
  const hasCookieChoice = step === 'cookie'

  useEffect(() => {
    if (showMembership) membershipTitle.current?.focus()
  }, [showMembership])

  function offerAd(pattern: PatternId) {
    dispatch({ type: 'mistake', pattern })
    dispatch({ type: 'offer', event: 'ad' })
  }

  function login() {
    dispatch({ type: 'next' })
  }

  const featured = [
    { label: '紙製品', title: 'ノート・手帳', description: '無地、方眼、横罫のノートを取り扱っています。', art: 'notebooks', href: '#shop-notebooks' },
    { label: '筆記具', title: 'ペン・インク', description: '万年筆や鉛筆、交換用の替芯をご覧いただけます。', art: 'pens', href: '#shop-journal' },
    { label: '会員の方へ', title: '会員向け先行販売', description: '今月の対象商品をご確認いただけます。', art: 'papers', href: '' },
  ] as const
  const featuredOrder = variant === 2 ? [featured[0], featured[2], featured[1]] : featured

  return (
    <>
      <div className="shop-page" inert={hasCookieChoice}>
        <nav aria-label="ストアのご案内" className="shop-nav">
          <div className="shop-nav-group">
            <a href="#shop-collection">商品一覧</a>
            <a href="#shop-journal">読みもの</a>
            <a href="#shop-support">ご利用案内</a>
          </div>
          <div className="shop-nav-group shop-nav-account">
            <button type="button" className="shop-button shop-button-outline" onClick={login}>会員ログイン</button>
            <button type="button" className="shop-nav-login" aria-controls="shop-membership" aria-expanded={showMembership} onClick={() => setShowMembership((open) => !open)}>新規登録</button>
          </div>
        </nav>

        <section id="shop-membership" className="shop-membership" hidden={!showMembership}>
          <div>
            <h2 tabIndex={-1} ref={membershipTitle}>会員登録のご案内</h2>
            <p>ご登録の際に会員プランをお選びいただけます。会員の方は、登録済みの会員番号をご用意ください。</p>
          </div>
          <button type="button" className="shop-quiet" onClick={login}>会員登録の手順を見る</button>
        </section>

        <section className="shop-hero" aria-labelledby="shop-hero-title">
          <div className="shop-hero-copy">
            <p className="shop-eyebrow"><span aria-hidden="true" /> 季節の特集</p>
            <h1 id="shop-hero-title">ノートと<span>筆記具の特集</span></h1>
            <p>紙の手触りやインクの色から、用途に合う文房具をお選びいただけます。</p>
            <a className="shop-button" href="#shop-collection">商品を見る <Arrow /></a>
          </div>
          <figure className="shop-hero-figure">
            <img src={`${import.meta.env.BASE_URL}storefront-hero.svg`} width="760" height="500" alt="生成りのノート、緑の手帳、鉛筆を並べた机" />
            <figcaption>特集 01　紙製品・筆記具</figcaption>
          </figure>
        </section>

        <section className="shop-section" id="shop-collection" aria-labelledby="shop-collection-title">
          <div className="shop-section-heading">
            <h2 id="shop-collection-title">商品とお知らせ</h2>
            <span>余白ストア</span>
          </div>
          <div className="shop-collection">
            {featuredOrder.map((product) => {
              const descriptionId = `shop-feature-${product.art}`
              const card = <>
                <ProductArt art={product.art} />
                <span className="shop-card-copy">
                  <span className="shop-card-label">{product.label}</span>
                  <span className="shop-card-title">{product.title} <Arrow diagonal /></span>
                  <span className="shop-card-description" id={descriptionId}>{product.description}</span>
                </span>
              </>
              return product.href
                ? <a key={product.art} className="shop-card" href={product.href} aria-label={product.title} aria-describedby={descriptionId}>{card}</a>
                : <button key={product.art} className="shop-card" type="button" aria-label={product.title} aria-describedby={descriptionId} onClick={() => offerAd(3)}>{card}</button>
            })}
          </div>
        </section>

        <section className="shop-shortcut" aria-labelledby="shop-shortcut-title">
          <div>
            <span className="shop-card-label">会員向けサービス</span>
            <h2 id="shop-shortcut-title">購入履歴・お届け先の確認</h2>
            <p>会員ページからご注文内容や登録情報をご確認いただけます。</p>
          </div>
          <button type="button" className="shop-button" onClick={() => offerAd(1)}>かんたんログイン <Arrow /></button>
        </section>

        <div className="shop-detail-grid">
          <section className="shop-section" id="shop-notebooks" aria-labelledby="shop-notebooks-title">
            <h2 id="shop-notebooks-title">ノート・手帳</h2>
            <h3>綴じノートと携帯用の手帳</h3>
            <p>綴じノートはA5とB6の2サイズです。外出先での記録には、上着のポケットに収まる手帳をご用意しています。</p>
          </section>

          <section className="shop-section" id="shop-journal" aria-labelledby="shop-journal-title">
            <h2 id="shop-journal-title">読みもの</h2>
            <h3>ペン先とインクの選び方</h3>
            <p>手帳のような小さな欄には細字、便箋には中字が適しています。裏抜けを避けるには筆記具に対応した用紙をご確認ください。</p>
          </section>
          <section className="shop-section" id="shop-support" aria-labelledby="shop-support-title">
            <h2 id="shop-support-title">ご利用案内</h2>
            <h3>配送と返品について</h3>
            <p>配送の状況や返品のお手続きは、会員ページの注文履歴からご確認いただけます。</p>
            <button type="button" className="shop-button shop-button-outline" onClick={() => offerAd(1)}>注文履歴にログイン</button>
          </section>
        </div>
      </div>
      {hasCookieChoice && <CookieBanner dispatch={dispatch} />}
    </>
  )
}

function StoreFeed({ dispatch, reducedMotion, variant }: Pick<SceneProps, 'dispatch' | 'reducedMotion' | 'variant'>) {
  const [edition, setEdition] = useState(0)
  const [paused, setPaused] = useState(false)
  const marker = useRef<HTMLDivElement>(null)
  const footerTitle = useRef<HTMLHeadingElement>(null)
  const ended = edition === editionEnds.length - 1
  const displayedEntries = feedEntries.slice(0, editionEnds[edition])
  const notice = edition > 0 && (
    <aside className="shop-feed-notice" aria-label="会員サービスのお知らせ">
      <span className="shop-card-label">会員サービス</span>
      <p>各種お手続きのご案内をサイト情報にまとめました。</p>
    </aside>
  )

  useEffect(() => {
    const node = marker.current
    if (!node || paused || ended || reducedMotion ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let previousScroll = window.scrollY
    const appendWhenNearEnd = () => {
      const scroll = window.scrollY
      const movedDown = scroll > previousScroll
      previousScroll = scroll
      if (!movedDown || node.getBoundingClientRect().top > window.innerHeight ||
          footerTitle.current?.parentElement?.contains(document.activeElement)) return

      window.removeEventListener('scroll', appendWhenNearEnd)
      setEdition(edition + 1)
    }

    window.addEventListener('scroll', appendWhenNearEnd, { passive: true })
    return () => window.removeEventListener('scroll', appendWhenNearEnd)
  }, [edition, paused, ended, reducedMotion])

  function goToSiteInformation(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    setPaused(true)
    footerTitle.current?.focus({ preventScroll: true })
    footerTitle.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <section className="shop-page shop-feed" aria-labelledby="shop-feed-title">
      <div className="shop-feed-intro">
        <div>
          <p className="shop-eyebrow"><span aria-hidden="true" /> 会員の方へ</p>
          <h1 id="shop-feed-title">会員向けのお知らせ</h1>
          <p>入荷情報、商品の取り扱い、会員サービスをご案内します。</p>
        </div>
        <a href="#shop-feed-footer" className="shop-quiet" onClick={goToSiteInformation}>サイト情報へ</a>
      </div>

      <div className="shop-feed-bar">
        <p>新着順<span aria-hidden="true"> ／ </span><span role="status">{displayedEntries.length}件を表示</span></p>
        {!ended && !reducedMotion && (
          <button className="shop-quiet" type="button" onClick={() => setPaused((current) => !current)}>
            {paused ? '自動追加を再開する' : '自動追加を停止する'}
          </button>
        )}
      </div>

      {variant !== 2 && notice}
      <div className="shop-feed-list">
        {displayedEntries.map((entry) => (
          <article className="shop-feed-entry" key={entry.title}>
            <ProductArt art={entry.art} />
            <div>
              <p className="shop-card-label">{entry.label}</p>
              <h2>{entry.title}</h2>
              <p>{entry.description}</p>
            </div>
          </article>
        ))}
      </div>
      {variant === 2 && notice}
      <div id="shop-feed-more" ref={marker} className="shop-feed-marker" aria-hidden="true" />
      <footer className="shop-feed-footer" aria-labelledby="shop-feed-footer">
        <h2 id="shop-feed-footer" tabIndex={-1} ref={footerTitle}>サイト情報</h2>
        <p>登録情報の確認とログインのお手続きは、会員案内からご利用いただけます。</p>
        <button type="button" className="shop-button shop-button-outline" onClick={() => dispatch({ type: 'next' })}>既存会員の方はこちら <Arrow /></button>
      </footer>
    </section>
  )
}

export function Storefront({ step, variant, dispatch, reducedMotion }: SceneProps) {
  if (step === 'feed') return <StoreFeed variant={variant} dispatch={dispatch} reducedMotion={reducedMotion} />
  return <StoreHome step={step} variant={variant} dispatch={dispatch} />
}
