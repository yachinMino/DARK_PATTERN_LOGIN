import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { button, dismissOrder, startGame, throughStorefront } from './route'

async function reachPlans(page: Page) {
  await startGame(page)
  await throughStorefront(page)
}

async function reachExtras(page: Page) {
  await reachPlans(page)
  await page.getByRole('button', { name: '基本会員で続ける' }).click()
  await page.getByRole('button', { name: '手数料を支払わずに続ける' }).click()
}

async function reachOrder(page: Page) {
  await reachExtras(page)
  await page.getByRole('checkbox', { name: '余白お届け便を申し込む' }).uncheck()
  await page.getByRole('checkbox', { name: '新刊・入荷のお知らせを受け取る' }).uncheck()
  await page.getByRole('checkbox', { name: '共同企画先に閲覧傾向を提供する' }).uncheck()
  await page.getByRole('button', { name: '選択内容で続ける' }).click()
}

async function reachTerms(page: Page) {
  await reachOrder(page)
  await dismissOrder(page)
}

test('ポイント表示の手数料は換算額を確認でき、承認すると再開画面が出ます', async ({ page }) => {
  await reachPlans(page)
  await button(page, '基本会員で続ける').click()
  await page.getByText('ポイントの換算条件', { exact: true }).click()
  await expect(page.getByText('220ポイントは440円分です。')).toBeVisible()
  await button(page, '220ポイントで引き継ぐ').click()
  await expect(page.getByRole('dialog', { name: '手続きを中断しました' })).toBeVisible()
})

test('今月分を停止しても次回分は残り、定期便を取り消して進めます', async ({ page }) => {
  await reachOrder(page)
  await expect(page.getByText('紙もの見本セット', { exact: true })).toBeVisible()
  await button(page, 'お届け予定を変更する').click()
  await button(page, '今月分を停止する').click()
  await expect(page.getByText('次回以降は月額330円でお届けします。')).toBeVisible()
  await button(page, '定期便を取り消す').click()
  await expect(page.getByText('追加商品はありません。')).toBeVisible()
  await button(page, '追加注文なしで続ける').click()
  await expect(page.getByRole('heading', { name: '会員利用規約' })).toBeVisible()
})

test('受付の表示が終了しても基本会員を選べます', async ({ page }) => {
  await page.clock.install()
  await reachPlans(page)

  const countdown = page.getByRole('timer', { name: '受付の残り時間' })
  await expect(countdown).not.toHaveText('00:00')
  await page.clock.fastForward(40_000)
  await page.getByRole('heading', { name: '会員プランを選ぶ' }).click()
  await page.clock.fastForward(36_000)
  await expect(countdown).toHaveText('00:00')
  await page.getByRole('button', { name: '基本会員で続ける' }).click()
  await expect(page.getByRole('heading', { name: '会員情報の引き継ぎ' })).toBeVisible()
})

test('基本会員を選んだあとに提示される手数料を承認すると再開画面が出ます', async ({ page }) => {
  await reachPlans(page)
  await page.getByRole('button', { name: '基本会員で続ける' }).click()
  await page.getByRole('button', { name: '手数料を含めて引き継ぐ' }).click()

  const failure = page.getByRole('dialog', { name: '手続きを中断しました' })
  await expect(failure.getByText('手数料を含めて引き継ぐ', { exact: false })).toBeVisible()
  await failure.getByRole('button', { name: 'チェックポイントから再開' }).click()
  await expect(page.getByRole('heading', { name: '会員プランを選ぶ' })).toBeVisible()
})

test('有料のお届け便を外して進むと、残りの任意登録を取り消せます', async ({ page }) => {
  await reachExtras(page)
  const delivery = page.getByRole('checkbox', { name: '余白お届け便を申し込む' })
  await expect(delivery).toBeChecked()
  await delivery.uncheck()
  await page.getByRole('button', { name: '選択内容で続ける' }).click()

  const cancel = page.getByRole('dialog', { name: '追加サービスの取り消し' })
  await cancel.getByRole('button', { name: '追加サービスを取り消す' }).click()
  await dismissOrder(page)
  await expect(page.getByRole('heading', { name: '会員利用規約' })).toBeVisible()
})

test('モバイルで規約内の自動適用を解除し、提供を拒否して進めます', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await reachTerms(page)

  const continueInTerms = page.getByRole('button', { name: '個別設定へ進む' })
  await continueInTerms.click()
  await expect(page.getByRole('heading', { name: '会員利用規約' })).toBeVisible()
  await expect(page.getByRole('alert').getByText('会員特典の自動適用が有効です。', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: '会員特典の自動適用を解除する' }).click()
  await continueInTerms.click()

  const mail = page.getByRole('group', { name: '商品案内を受け取らない設定の解除を希望しません。' })
  const data = page.getByRole('group', { name: '閲覧履歴の提供を拒否しない設定を希望します。' })
  await mail.getByRole('radio', { name: '該当する', exact: true }).check()
  await data.getByRole('radio', { name: '該当しない', exact: true }).check()
  await page.getByRole('button', { name: '個別設定を保存する' }).click()
  await expect(page.getByRole('heading', { name: '設定内容の確認' })).toBeVisible()
  await expect(page.getByRole('button', { name: '会員特典を放棄して続ける' })).toBeEnabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
})

test('一括同意した場合も規約内のリンクで個別設定を開きます', async ({ page }) => {
  await reachTerms(page)
  await page.getByRole('button', { name: '特典を含めて一括同意する' }).click()
  await expect(page.getByRole('heading', { name: '会員利用規約' })).toBeVisible()
  await expect(page.getByText('一括同意を受け付けました。', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: '個別設定へ進む' }).click()
  await expect(page.getByRole('heading', { name: '個人情報の個別設定' })).toBeVisible()
})
