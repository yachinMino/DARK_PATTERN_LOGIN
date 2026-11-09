import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { button, dismissAds, fullPageAdClose, startGame } from './route'

async function openFeed(page: Page) {
  await startGame(page)
  await button(page, 'すべてのCookieを許可').click()
  await button(page, '会員ログイン').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await dismissAds(page)
}

test('Cookieの選択肢からストアに進めます', async ({ page }) => {
  await startGame(page)

  const settings = button(page, 'Cookieの設定を管理')
  await expect(settings).toBeVisible()
  await button(page, 'すべてのCookieを許可').click()

  await expect(settings).toBeHidden()
  await expect(button(page, '会員ログイン')).toBeEnabled()
})

test('商品欄に紛れた広告を閉じるとストアに戻れます', async ({ page }) => {
  await startGame(page)
  await button(page, 'すべてのCookieを許可').click()
  await button(page, '会員向け先行販売').click()

  await expect(button(page, '広告を閉じる')).toBeVisible()
  await dismissAds(page)
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(button(page, '会員ログイン')).toBeEnabled()
})

test('新着の自動追加を回避して既存会員の案内へ進めます', async ({ page }) => {
  await openFeed(page)

  await page.getByRole('link', { name: 'サイト情報へ', exact: true }).click()
  await expect(button(page, '既存会員の方はこちら')).toBeInViewport()
  await button(page, '既存会員の方はこちら').click()
  await expect(button(page, '基本会員で続ける')).toBeVisible()
})

test('スマートフォンで大型広告の偽の×を押しても本物の操作で閉じられます', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await startGame(page)
  await button(page, 'すべてのCookieを許可').click()
  await button(page, '会員ログイン').click()
  await button(page, '広告を閉じる').click()

  const ad = page.getByRole('dialog', { name: 'まるごと文具祭' })
  const original = await ad.boundingBox()
  expect(original?.width).toBeGreaterThanOrEqual(350)
  expect(original?.height).toBeGreaterThanOrEqual(740)
  await button(page, '広告の右上にある×').click()
  await expect(ad.getByText('特典の詳細を表示しました。')).toBeVisible()
  const expanded = await ad.boundingBox()
  expect(expanded?.width).toBeGreaterThan(original!.width)
  const close = button(page, fullPageAdClose)
  await expect(close).toBeInViewport({ ratio: 1 })
  await close.click()
  await expect(ad).toBeHidden()
  await expect(page.getByRole('link', { name: 'サイト情報へ' })).toBeVisible()
})

test('新着の追加が終了するとスクロールで会員案内へ到達できます', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 570 })
  await openFeed(page)

  const count = page.getByRole('region', { name: '会員向けのお知らせ' }).getByRole('status')
  await expect(count).toHaveText('3件を表示')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(count).toHaveText('5件を表示')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(count).toHaveText('7件を表示')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(button(page, '既存会員の方はこちら')).toBeInViewport()
})
