import { expect, test } from '@playwright/test'
import { button, startGame, throughAuthentication, toAuthentication } from './route'

test('クリア後に全33種類の攻略と今回の判定を確認できる', async ({ page }) => {
  await startGame(page)
  await toAuthentication(page)
  await throughAuthentication(page)
  await button(page, '商品案内に登録する').click()
  await button(page, '登録せずログインする').press('Enter')

  await page.getByRole('link', { name: '答え合わせを見る' }).click()
  await expect(page.getByRole('heading', { name: '答え合わせ', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(5)
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(33)
  const cancellation = page.getByRole('article', { name: /解約に見せかけた一時停止/ })
  await expect(cancellation.getByText('回避済み', { exact: true })).toBeVisible()
  await expect(cancellation.getByText(/定期便を取り消す/)).toBeVisible()
  const cookie = page.getByRole('article', { name: /同意と拒否の視覚的な格差/ })
  await expect(cookie.getByText('回避済み', { exact: true })).toBeVisible()
  await expect(cookie.getByText(/Cookieの設定を管理/)).toBeVisible()
  const registered = page.getByRole('article', { name: /ログイン後の追加認証/ })
  await expect(registered.getByText('減点対象', { exact: true })).toBeVisible()
  const back = page.getByRole('article', { name: /戻る操作の妨害/ })
  await expect(back.getByText('未遭遇', { exact: true })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByRole('heading', { name: '答え合わせ', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  await page.getByRole('navigation', { name: 'ステージ別の答え' }).getByRole('link', { name: /最終確認/ }).click()
  await expect(page.getByRole('heading', { name: /最終確認/ })).toBeInViewport()
  await page.getByRole('link', { name: 'クリア結果に戻る' }).click()
  await expect(page.getByRole('heading', { name: 'ログインしました' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: '答え合わせ', exact: true })).toBeVisible()
})

test('クリア前は答え合わせのURLを開いても答えを表示しない', async ({ page }) => {
  await page.goto('/#answers')
  await expect(button(page, 'Cookieの設定を管理')).toBeVisible()
  await expect(page.getByRole('heading', { name: '答え合わせ', exact: true })).toHaveCount(0)
})
