import { expect, test } from '@playwright/test'
import { startGame, throughAuthentication, throughCaptcha, toAuthentication } from './route'

test.beforeEach(async ({ page }) => {
  await startGame(page)
  await toAuthentication(page)
})

test('仮ID欄が移動しても入力とフォーカスが保持されます', async ({ page }) => {
  await throughCaptcha(page)

  const input = page.getByRole('textbox', { name: '認証用の仮ID' })
  const issuedId = await page.locator('.auth-synthetic-id').innerText()
  await input.focus()
  const initialBox = await input.boundingBox()
  await input.pressSequentially(issuedId)

  await expect(input).toBeFocused()
  await expect(input).toHaveValue(issuedId)
  const shiftedBox = await input.boundingBox()
  expect(shiftedBox?.y).not.toBe(initialBox?.y)

  const marketing = page.getByRole('checkbox', { name: 'このIDで商品案内を受け取る' })
  await expect(marketing).toBeChecked()
  await marketing.uncheck()
  await input.fill('')
  await input.pressSequentially(issuedId)
  await expect(marketing).not.toBeChecked()
  expect((await input.boundingBox())?.y).toBe(shiftedBox?.y)
})

test('正しい仮IDでも照合エラーが発生し、記録から認証できます', async ({ page }) => {
  await throughCaptcha(page)

  await page.getByRole('textbox', { name: '認証用の仮ID' })
    .fill(await page.locator('.auth-synthetic-id').innerText())
  await page.getByRole('checkbox', { name: 'このIDで商品案内を受け取る' }).uncheck()
  await page.getByRole('button', { name: '仮IDを確認する' }).click()

  await expect(page.getByRole('alert')).toContainText('照合できませんでした')
  const compare = page.getByRole('button', { name: '認証記録で照合する' })
  await expect(compare).toBeHidden()
  await page.getByText('エラーの詳細', { exact: true }).click()
  await compare.click()

  const read = page.getByRole('button', { name: '認証記録を読み出す' })
  await read.hover()
  await page.mouse.down()
  await expect(read).toBeVisible()
  await page.mouse.up()
  await expect(page.getByRole('button', { name: '認証記録を配信設定に使用する' })).toBeVisible()
  await page.getByText('記録の照合条件', { exact: true }).click()
  await page.getByRole('button', { name: '認証記録だけを使用する' }).click()
  await expect(page.getByRole('button', { name: '登録せずログインする' })).toBeVisible()
})

test('最終拒否の移動回数は有限で、キーボードフォーカスを得ると停止します', async ({ page }) => {
  await throughAuthentication(page)

  const refusal = page.getByRole('button', { name: '登録せずログインする' })
  await refusal.scrollIntoViewIfNeeded()
  async function movePointerToRefusal() {
    const target = await refusal.boundingBox()
    if (!target) throw new Error('最終拒否ボタンが表示されていません。')
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2)
    return target
  }

  await refusal.focus()
  const focusedPosition = await movePointerToRefusal()
  expect(await refusal.boundingBox()).toEqual(focusedPosition)
  await page.mouse.move(0, 0)
  await page.getByRole('button', { name: '商品案内に登録する' }).focus()

  const initialPosition = await movePointerToRefusal()
  await expect.poll(async () => (await refusal.boundingBox())?.x).not.toBe(initialPosition.x)
  const secondPosition = await movePointerToRefusal()
  await expect.poll(async () => (await refusal.boundingBox())?.x).not.toBe(secondPosition.x)
  const finalPosition = await movePointerToRefusal()
  expect(await refusal.boundingBox()).toEqual(finalPosition)

  await refusal.focus()
  await expect(refusal).toBeFocused()
  await refusal.press('Enter')
  await expect(page.getByRole('heading', { name: 'ログインしました', exact: true })).toBeVisible()
})
