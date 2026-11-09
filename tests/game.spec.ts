import { devices, expect, test } from '@playwright/test'
import { activate, button, dismissAds, refuseCookies, startGame, throughAuthentication, throughStorefront, toAuthentication } from './route'

for (const seed of [undefined, 7, 29]) {
  test(`最初からログインを完了できる（シード ${seed ?? '初回'}）`, async ({ page }) => {
    await startGame(page, seed)
    await toAuthentication(page)
    await throughAuthentication(page)
    await button(page, '登録せずログインする').press('Enter')
    await expect(page.getByRole('heading', { name: 'ログインしました' })).toBeVisible()
    await expect(page.getByText('総合評価')).toBeVisible()
    await expect(page.getByText('32 / 33')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'ログインしました' })).toBeVisible()
  })
}

test('Tab、Enter、方向キー、Spaceだけでクリアできる', async ({ page }) => {
  await startGame(page)
  await toAuthentication(page, 'keyboard')
  await throughAuthentication(page, 'keyboard')
  await activate(page, button(page, '登録せずログインする'), 'keyboard')
  await expect(page.getByRole('heading', { name: 'ログインしました' })).toBeVisible()
})

test.describe('タッチ端末', () => {
  test.use({ viewport: devices['iPhone 13'].viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 3 })
  test('390pxの画面とタッチでクリアできる', async ({ page }) => {
    await startGame(page, 29)
    await toAuthentication(page)
    await throughAuthentication(page)
    await button(page, '登録せずログインする').tap()
    await expect(page.getByRole('heading', { name: 'ログインしました' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  })
})

test('偽のログイン先で仮情報を送信してもステージの先頭から再開できる', async ({ page }) => {
  await startGame(page)
  await refuseCookies(page)
  await button(page, 'かんたんログイン').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toHaveCount(1)
  await button(page, '広告の会員ページを開く').click()
  await expect(dialog).toHaveCount(1)
  await expect(dialog.getByRole('heading', { name: '特典受取用ログイン' })).toBeVisible()
  await button(page, '架空の会員番号を入力する').click()
  await button(page, '仮情報でログインする').click()
  await expect(dialog.getByRole('heading', { name: '手続きを中断しました' })).toBeVisible()
  await page.reload()
  await button(page, 'チェックポイントから再開').click()
  await expect(button(page, 'Cookieの設定を管理')).toBeVisible()
})

test('再読込で広告の表示順を復元し、フォーカスをダイアログ内に保つ', async ({ page }) => {
  await startGame(page)
  await refuseCookies(page)
  await button(page, '会員ログイン').click()
  await button(page, '広告を閉じる').click()
  await page.reload()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toHaveCount(1)
  await expect(dialog.getByRole('button', { name: '続けて表示された広告を閉じる' })).toBeFocused()
  for (let count = 0; count < 7; count++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true)
  }
  await dismissAds(page)
  await expect(dialog).toHaveCount(0)
})

test('戻る確認から戻り、設定で保存した進行をリセットできる', async ({ page }) => {
  await startGame(page)
  await throughStorefront(page)
  await button(page, '基本会員で続ける').click()
  await button(page, '前の手続きに戻る').click()
  await button(page, '前の手続きへ戻る').click()
  await expect(button(page, '基本会員で続ける')).toBeVisible()
  await button(page, 'ゲーム設定').click()
  await page.getByRole('checkbox', { name: '画面の動きを減らす' }).check()
  await button(page, '最初からやり直す').click()
  await button(page, '進行をリセットする').click()
  await expect(button(page, 'Cookieの設定を管理')).toBeVisible()
  await page.reload()
  await button(page, 'ゲーム設定').click()
  await expect(page.getByRole('checkbox', { name: '画面の動きを減らす' })).toBeChecked()
})

test('別のタブに残っていた進行でリセットを上書きしない', async ({ page, context }) => {
  await startGame(page)
  await throughStorefront(page)
  const second = await context.newPage()
  await startGame(second)
  await expect(button(second, '基本会員で続ける')).toBeVisible()
  await button(second, 'ゲーム設定').click()
  await button(second, '最初からやり直す').click()
  await button(second, '進行をリセットする').click()
  await expect(button(page, 'Cookieの設定を管理')).toBeVisible({ timeout: 2000 })
  await page.reload()
  await expect(button(page, 'Cookieの設定を管理')).toBeVisible()
})
