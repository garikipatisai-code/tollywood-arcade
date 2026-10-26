import { expect, test } from '@playwright/test';

const liveUrl = process.env.LIVE_URL;

test.skip(!liveUrl, 'set LIVE_URL to smoke-test the deployed site');

test('deployed hub responds and mounts a game', async ({ page }) => {
  const response = await page.goto(liveUrl!);
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#game-list > li')).toHaveCount(6);
  await expect(page.locator('#game-list a')).toHaveAttribute('href', './games/egara/');

  await page.goto(`${liveUrl!.replace(/\/$/, '')}/games/egara/`);
  await expect(page.locator('canvas')).toBeVisible();
});
