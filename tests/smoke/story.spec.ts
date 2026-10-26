import { expect, test } from '@playwright/test';

test('chapter select lists 8 chapters with ch1 open', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./games/egara/?select=1');
  await expect(page.locator('canvas')).toBeVisible();

  const dialog = page.getByRole('dialog', { name: 'Story' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('button[data-chapter]')).toHaveCount(8);

  const ch1 = dialog.locator('button[data-chapter="ch1"]');
  const ch2 = dialog.locator('button[data-chapter="ch2"]');
  await expect(ch1).toBeEnabled();
  await expect(ch2).toBeDisabled();

  await ch1.click();
  await expect(page).toHaveURL(/ch=ch1/);
  await expect(page.getByRole('dialog')).toContainText('Gather 3 petals');

  expect(errors).toEqual([]);
});

test('saved progress unlocks later chapters and NG+ appears with the amulet', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'tollywood-arcade.save',
      JSON.stringify({
        v: 2,
        lang: 'en',
        muted: false,
        best: {},
        remaps: {},
        chapters: { ch1: { unlocked: true, best: 500 } },
        shards: ['petal-1'],
        unlocks: { needle: false, armor: false, cannon: false },
        amulet: true
      })
    );
  });

  await page.goto('./games/egara/?select=1');
  const dialog = page.getByRole('dialog', { name: 'Story' });
  await expect(dialog.locator('button[data-chapter="ch2"]')).toBeEnabled();
  await expect(dialog.locator('button[data-chapter="ch3"]')).toBeDisabled();
  await expect(dialog.getByRole('button', { name: /New Game/ })).toBeVisible();

  await dialog.locator('button[data-chapter="ch2"]').click();
  await expect(page).toHaveURL(/ch=ch2/);
  await expect(page.getByRole('dialog')).toContainText('memory shards');
});
