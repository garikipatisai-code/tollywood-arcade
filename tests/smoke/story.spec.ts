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
  await expect(page.getByRole('dialog')).toContainText('Gali ran petals');
  await page.getByRole('button', { name: 'Skip' }).click();
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
  await expect(page.getByRole('dialog')).toContainText('Magnate');
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByRole('dialog')).toContainText('memory shards');
});

test('chapter opens with its comic cutscene', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'tollywood-arcade.save',
      JSON.stringify({
        v: 2, lang: 'en', muted: true, best: {}, remaps: {}, chapters: {},
        shards: [], unlocks: { needle: false, armor: false, cannon: false }, amulet: false
      })
    );
  });

  await page.goto('./games/egara/?ch=ch1');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Gali ran petals');
  await expect(dialog).toContainText('1 / 3');

  await dialog.getByRole('button', { name: 'Continue' }).click();
  await expect(dialog).toContainText('2 / 3');

  await dialog.getByRole('button', { name: 'Skip' }).click();
  await expect(dialog).toContainText('Ordinary Skies');
});

test('fresh landing welcomes with a story door', async ({ page }) => {
  await page.goto('./games/egara/');
  const welcome = page.locator('.ta-welcome');
  await expect(welcome).toContainText('New here?');
  await welcome.getByRole('button', { name: 'Story →' }).click();
  await expect(page).toHaveURL(/select=1/);
  await expect(page.getByRole('dialog', { name: 'Story' })).toBeVisible();
});

test('select marks locked chapters and offers quick play', async ({ page }) => {
  await page.goto('./games/egara/?select=1');
  const dialog = page.getByRole('dialog', { name: 'Story' });
  await expect(dialog.locator('button[data-chapter]')).toHaveCount(8);

  const locked = dialog.locator('button[data-chapter="ch2"]');
  await expect(locked).toBeDisabled();
  await expect(locked).toContainText('🔒');
  await expect(locked).toHaveCSS('opacity', '0.55');

  await dialog.getByRole('button', { name: '▶ Quick Play' }).click();
  await expect(page).not.toHaveURL(/select=1/);
  await expect(page.locator('canvas')).toBeVisible();
});

test('pause menu leads home to chapters', async ({ page }) => {
  await page.goto('./games/egara/');
  await page.locator('canvas').click({ position: { x: 480, y: 300 } });
  await page.keyboard.press('Escape');
  const dialog = page.getByRole('dialog');
  const home = dialog.getByRole('link', { name: '☰ Chapters' });
  await expect(home).toHaveAttribute('href', './?select=1');
  await home.click();
  await expect(page).toHaveURL(/select=1/);
});
