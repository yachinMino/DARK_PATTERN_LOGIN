import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

export type Mode = 'pointer' | 'keyboard'
export const fullPageAdClose = '元のページへ戻る（続けて表示された広告を閉じる）'

export function button(page: Page, name: string): Locator {
  return page.getByRole('button', { name, exact: true })
}

export async function tabTo(page: Page, target: Locator) {
  await expect(target).toBeVisible()
  for (let count = 0; count < 160; count++) {
    if (await target.evaluate(element => element === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  throw new Error(`Tabキーで対象に到達できませんでした: ${await target.textContent()}`)
}

export async function activate(page: Page, target: Locator, mode: Mode = 'pointer', key = 'Enter') {
  if (mode === 'pointer') return target.click()
  await tabTo(page, target)
  await page.keyboard.press(key)
}

export async function startGame(page: Page, seed?: number) {
  await page.goto(seed === undefined ? '/' : `/?seed=${seed}`)
}

export async function refuseCookies(page: Page, mode: Mode = 'pointer') {
  await activate(page, button(page, 'Cookieの設定を管理'), mode)
  await activate(page, page.getByRole('radio', { name: '必要なCookieのみを使用する', exact: true }), mode, 'Space')
  await activate(page, button(page, '拒否内容を確認する'), mode)
  await activate(page, button(page, '任意のCookieを拒否する'), mode)
}

export async function dismissAds(page: Page, mode: Mode = 'pointer') {
  for (const label of ['広告を閉じる', fullPageAdClose, '最後の広告を閉じる']) {
    const control = button(page, label)
    if (await control.isVisible()) await activate(page, control, mode)
  }
}

export async function throughStorefront(page: Page, mode: Mode = 'pointer') {
  await refuseCookies(page, mode)
  await activate(page, button(page, '会員ログイン'), mode)
  await expect(page.getByRole('dialog')).toBeVisible()
  await dismissAds(page, mode)
  await activate(page, page.getByText('サイト情報へ', { exact: true }), mode)
  await activate(page, button(page, '既存会員の方はこちら'), mode)
  await expect(page.getByRole('heading', { name: '会員プランを選ぶ' })).toBeVisible()
}

export async function dismissOrder(page: Page, mode: Mode = 'pointer') {
  for (const label of ['お届け予定を変更する', '定期便を取り消す', '追加注文なしで続ける']) {
    await activate(page, button(page, label), mode)
  }
}

export async function toAuthentication(page: Page, mode: Mode = 'pointer') {
  await throughStorefront(page, mode)
  const choose = (label: string) => activate(page, button(page, label), mode)
  await choose('基本会員で続ける')
  await choose('手数料を支払わずに続ける')
  for (const label of ['新刊・入荷のお知らせを受け取る', '共同企画先に閲覧傾向を提供する', '余白お届け便を申し込む']) {
    await activate(page, page.getByRole('checkbox', { name: label, exact: true }), mode, 'Space')
  }
  await choose('選択内容で続ける')
  await dismissOrder(page, mode)
  await choose('会員特典の自動適用を解除する')
  await choose('個別設定へ進む')
  const mail = page.getByRole('group', { name: '商品案内を受け取らない設定の解除を希望しません。' })
  await activate(page, mail.getByRole('radio', { name: '該当する', exact: true }), mode, 'Space')
  const data = page.getByRole('group', { name: '閲覧履歴の提供を拒否しない設定を希望します。' })
  const no = data.getByRole('radio', { name: '該当しない', exact: true })
  if (mode === 'keyboard') {
    const yes = data.getByRole('radio', { name: '該当する', exact: true })
    await tabTo(page, yes)
    await page.keyboard.press('ArrowRight')
    await expect(no).toBeChecked()
  } else {
    await no.check()
  }
  await choose('個別設定を保存する')
  await choose('会員特典を放棄して続ける')
}

export async function throughCaptcha(page: Page, mode: Mode = 'pointer') {
  for (const label of [
    '警告の詳細', '保護サービスを利用せず続ける',
    '処理状況を表示', '待機を終了して続ける',
    '認証サービスについて', '広告登録をせず認証する',
  ]) {
    await activate(page, page.getByText(label, { exact: true }), mode)
  }
}

export async function throughAuthentication(page: Page, mode: Mode = 'pointer') {
  await throughCaptcha(page, mode)
  const code = await page.locator('.auth-synthetic-id').textContent()
  const id = code?.match(/YM-\d{4}/)?.[0]
  if (!id) throw new Error('仮IDを確認できませんでした。')
  const input = page.getByRole('textbox', { name: '認証用の仮ID' })
  if (mode === 'keyboard') {
    await tabTo(page, input)
    await page.keyboard.type(id)
  } else {
    await input.fill(id)
  }
  await activate(page, page.getByRole('checkbox', { name: 'このIDで商品案内を受け取る' }), mode, 'Space')
  for (const label of [
    '仮IDを確認する', 'エラーの詳細', '認証記録で照合する',
    '認証記録を読み出す', '記録の照合条件', '認証記録だけを使用する',
  ]) {
    await activate(page, page.getByText(label, { exact: true }), mode)
  }
}
