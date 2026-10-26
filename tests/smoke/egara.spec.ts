import { expect, test } from '@playwright/test';

test('Egara boots, runs, pauses and resumes without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./games/egara/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('[data-hud="score"]')).toHaveCount(0);
  await expect(page.locator('.ta-hud__stat').first()).toContainText('0');

  await page.locator('canvas').click({ position: { x: 480, y: 400 } });
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1200);
  await page.keyboard.up('ArrowRight');

  const clock = page.locator('.ta-hud__stat').nth(2);
  await expect(clock).not.toContainText('1:30');

  await page.keyboard.press('Escape');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Pause');

  await dialog.getByRole('button', { name: 'Resume' }).click();
  await expect(dialog).toBeHidden();

  expect(errors).toEqual([]);
});

test('mute state persists across reloads', async ({ page }) => {
  await page.goto('./games/egara/');
  const mute = page.getByRole('button', { name: 'Mute', exact: true });

  await expect(mute).toHaveAttribute('aria-pressed', 'false');
  await mute.click();
  await expect(page.getByRole('button', { name: 'Unmute', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  await page.reload();
  await expect(page.getByRole('button', { name: 'Unmute', exact: true })).toBeVisible();
});

test('a key can be remapped and survives reload', async ({ page }) => {
  await page.goto('./games/egara/');
  await page.keyboard.press('Escape');

  const dialog = page.getByRole('dialog');
  const stingRow = dialog.locator('.ta-controls__row').filter({ hasText: 'Sting' });
  await stingRow.getByRole('button', { name: 'Change' }).click();
  await expect(stingRow.getByRole('button', { name: 'Press a key…' })).toBeVisible();

  await page.keyboard.press('KeyJ');
  await expect(stingRow.locator('.ta-controls__keys')).toContainText('J');

  const saved = await page.evaluate(() => {
    const raw = localStorage.getItem('tollywood-arcade.save');
    return raw ? JSON.parse(raw) : null;
  });
  expect(saved.remaps.sting).toContain('KeyJ');

  await page.reload();
  await page.keyboard.press('Escape');
  const reloaded = page
    .getByRole('dialog')
    .locator('.ta-controls__row')
    .filter({ hasText: 'Sting' });
  await expect(reloaded.locator('.ta-controls__keys')).toContainText('J');
});
