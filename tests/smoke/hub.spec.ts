import { expect, test } from '@playwright/test';

test('hub lists six games and Egara mounts', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Tollywood Arcade' })).toBeVisible();
  await expect(page.locator('#game-list > li')).toHaveCount(6);
  await expect(page.locator('#game-list a')).toHaveAttribute('href', './games/egara/');

  await page.goto('./games/egara/');
  await expect(page.locator('canvas')).toBeVisible();

  expect(errors).toEqual([]);
});

test('language toggle switches to Telugu and persists', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tollywood Arcade');

  await page.getByRole('button', { name: 'Switch to Telugu' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('టాలీవుడ్ ఆర్కేడ్');
  await expect(page.locator('html')).toHaveAttribute('lang', 'te');
  await expect(page.getByRole('button', { name: 'Switch to English' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('టాలీవుడ్ ఆర్కేడ్');
});
