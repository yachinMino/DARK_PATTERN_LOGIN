import type { EventId, PatternId, Stage, StepId } from './types'

export const stageNames: Record<Stage, string> = {
  1: 'トップページ',
  2: '会員登録・プラン選択',
  3: '利用規約・プライバシー設定',
  4: 'ログイン認証',
  5: '最終確認',
}

interface StepDefinition {
  stage: Stage
  hint: string
}

export const stepConfig: Record<StepId, StepDefinition> = {
  cookie: { stage: 1, hint: 'Cookieの許可範囲は、設定の管理画面から変更できます。' },
  home: { stage: 1, hint: '店内メニューの会員向けリンクを確認してください。広告から開いた手続きには仮情報も入力しないでください。' },
  feed: { stage: 1, hint: '新着情報の追加を待つ必要はありません。サイト情報に既存会員向けの窓口があります。' },
  plans: { stage: 2, hint: '受付時間と残り人数は表示上の数値です。特典の対象条件と、毎月の支払額を確認してください。' },
  fees: { stage: 2, hint: '手数料の支払いと、会員情報の引き継ぎは別の手続きです。料金明細の下を確認してください。' },
  extras: { stage: 2, hint: 'ログインに追加サービスは不要です。最初から付いているチェックを確認してください。' },
  terms: { stage: 3, hint: '特典を自動適用する条項と、認証を引き継ぐ条項を探してください。条項内に各手続きがあります。' },
  privacy: { stage: 3, hint: '各回答文が、案内の受信と閲覧履歴の提供を最終的に許可するか、順に確認してください。' },
  review: { stage: 3, hint: '会員特典を放棄しても、ログインの申請は取り消されません。' },
  warning: { stage: 4, hint: '警告の詳細には、保護サービスを追加しない経路があります。' },
  loading: { stage: 4, hint: '処理状況を開くと、待機を終了できます。' },
  captcha: { stage: 4, hint: '認証サービスの提供元と登録内容を確認してください。' },
  credentials: { stage: 4, hint: '画面に表示された仮IDを使用してください。入力で追加された選択を解除し、エラーが出たら詳細を確認してください。' },
  fallback: { stage: 4, hint: '記録を読み出した後に操作の用途が変わります。照合条件から認証記録だけを選んでください。' },
  final: { stage: 5, hint: '追加登録を拒否するとログインが完了します。マウスで操作しづらい場合はTabキーで選択し、Enterキーで確定できます。' },
}

interface PatternDefinition {
  id: PatternId
  step: StepId
  credit: 'next' | 'ad' | 'back' | 'cookie'
  title: string
}

export const patterns: readonly PatternDefinition[] = [
  { id: 1, step: 'home', credit: 'next', title: '偽ログインボタン' },
  { id: 2, step: 'home', credit: 'ad', title: '偽の閉じるボタン' },
  { id: 3, step: 'home', credit: 'next', title: '通常コンテンツに偽装した広告' },
  { id: 4, step: 'captcha', credit: 'next', title: '偽CAPTCHA' },
  { id: 5, step: 'cookie', credit: 'next', title: '同意と拒否の視覚的な格差' },
  { id: 6, step: 'privacy', credit: 'next', title: '二重否定' },
  { id: 7, step: 'extras', credit: 'next', title: '初期選択済みチェックボックス' },
  { id: 8, step: 'review', credit: 'next', title: '拒否への罪悪感' },
  { id: 9, step: 'review', credit: 'next', title: '選択肢の位置変更' },
  { id: 10, step: 'fees', credit: 'next', title: '紛らわしい配色' },
  { id: 11, step: 'home', credit: 'ad', title: '連続ポップアップ' },
  { id: 12, step: 'feed', credit: 'next', title: 'スクロール位置の妨害' },
  { id: 13, step: 'terms', credit: 'next', title: '長文の利用規約' },
  { id: 14, step: 'cookie', credit: 'cookie', title: '多段階の拒否確認' },
  { id: 15, step: 'loading', credit: 'next', title: '偽の読み込み画面' },
  { id: 16, step: 'feed', credit: 'next', title: '無限スクロール風の追加' },
  { id: 17, step: 'plans', credit: 'next', title: '偽カウントダウン' },
  { id: 18, step: 'plans', credit: 'next', title: '架空の残席数' },
  { id: 19, step: 'plans', credit: 'next', title: '架空の利用者数' },
  { id: 20, step: 'warning', credit: 'next', title: '架空のセキュリティ警告' },
  { id: 21, step: 'fees', credit: 'next', title: '後出しの料金' },
  { id: 22, step: 'plans', credit: 'next', title: '自動更新条件の隠蔽' },
  { id: 23, step: 'terms', credit: 'next', title: '利用規約に埋め込まれた進行リンク' },
  { id: 24, step: 'credentials', credit: 'next', title: '偽の認証エラー' },
  { id: 25, step: 'final', credit: 'next', title: 'カーソルから逃げるボタン' },
  { id: 26, step: 'credentials', credit: 'next', title: '移動する入力欄' },
  { id: 27, step: 'fallback', credit: 'next', title: 'ボタンの置き換え' },
  { id: 28, step: 'credentials', credit: 'next', title: '自動入力による選択変更' },
  { id: 29, step: 'fallback', credit: 'back', title: '戻る操作の妨害' },
  { id: 30, step: 'final', credit: 'next', title: 'ログイン後の追加認証' },
]

interface EventRule {
  priority: number
  step?: StepId
  minStage?: Stage
  once?: boolean
  idleSeconds?: readonly [number, number, number]
  from?: EventId
}

export const eventRules: Record<EventId, EventRule> = {
  'cookie-review': { priority: 50, step: 'cookie' },
  ad: { priority: 40, step: 'home' },
  'fake-login': { priority: 55, step: 'home', from: 'ad' },
  campaign: { priority: 10, minStage: 2, once: true, idleSeconds: [75, 65, 50] },
  'cancel-extras': { priority: 50, step: 'extras' },
  back: { priority: 60, minStage: 2 },
  hint: { priority: 65 },
  settings: { priority: 70 },
  reset: { priority: 80 },
}

export const adPages = [2, 2, 3] as const
export const hintNudgeSeconds = 90
export const defaultSeed = 165

export function eventAppliesToStep(event: EventId, step: StepId): boolean {
  const rule = eventRules[event]
  return (!rule.step || rule.step === step) && (!rule.minStage || stepConfig[step].stage >= rule.minStage)
}

export const relatedPatterns: Partial<Record<PatternId, PatternId[]>> = {
  8: [9],
  14: [5],
  21: [10],
  22: [17, 18, 19],
}
