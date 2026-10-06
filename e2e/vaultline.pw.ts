import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const shot = async (page: import('@playwright/test').Page, name: string, width: number, height: number) => {
  await page.setViewportSize({ width, height });
  await page.screenshot({ path: `screenshots/${name}-${width}x${height}.png`, fullPage: true });
};

test.beforeEach(async () => { await mkdir('screenshots', { recursive: true }); });

const checkAxe = async (page: import('@playwright/test').Page, screen: string) => {
  await page.waitForTimeout(2000); // let staggered entrance transitions settle before measuring contrast
  const violations = await page.evaluate(async () => {
    const axe = (window as any).axe;
    const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return result.violations.map((violation: any) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node: any) => ({ target: node.target, summary: node.failureSummary })),
    }));
  });
  expect(violations, `axe violations on ${screen}: ${JSON.stringify(violations)}`).toEqual([]);
};

test('axe finds no WCAG 2.1 A/AA violations on app screens and drawers', async ({ page }) => {
  await page.goto('/');
  await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
  await checkAxe(page, 'landing');
  await page.getByRole('button', { name: 'Open app' }).click();
  await checkAxe(page, 'Play Explore');
  await page.getByRole('button', { name: 'Challenge' }).click();
  await checkAxe(page, 'Play Challenge');
  await page.getByRole('link', { name: 'Plan' }).click();
  await page.getByRole('button', { name: 'Find the best plan' }).click();
  await checkAxe(page, 'Plan');
  await page.getByRole('button', { name: 'Algorithm', exact: true }).click();
  await checkAxe(page, 'Algorithm drawer');
  await page.getByRole('button', { name: 'Close drawer' }).last().click();
  await page.getByRole('button', { name: 'Files', exact: true }).click();
  await checkAxe(page, 'Files drawer');
  await page.getByRole('button', { name: 'Close drawer' }).last().click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await checkAxe(page, 'Settings');
  await page.getByRole('button', { name: 'Close settings' }).click();
  await page.getByRole('button', { name: 'Exports' }).click();
  await checkAxe(page, 'Reports');
});

test('landing enters Play and slider changes the displayed plan', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Decide what to keep.' })).toBeVisible();
  await shot(page, 'landing', 1366, 768);
  await shot(page, 'landing', 390, 844);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByRole('button', { name: 'Open app' }).click();
  await expect(page.getByRole('slider', { name: 'Drive capacity' })).toBeVisible();
  const primary = await page.getByRole('button', { name: 'Open plan' }).boundingBox();
  expect(primary).not.toBeNull();
  expect(primary!.y).toBeLessThan(768);
  await shot(page, 'play-explore', 1366, 768);
  const score = await page.locator('.play-scoreline').innerText();
  const slider = page.getByRole('slider', { name: 'Drive capacity' });
  await slider.evaluate((el: HTMLInputElement) => {
    el.value = String(Number(el.max) * 0.4);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(slider).not.toHaveValue('16106127360');
  await expect(page.locator('.play-scoreline')).not.toHaveText(await score);
  await shot(page, 'play-explore', 390, 844);
});

test('Challenge reveals your, greedy, and optimal scores', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open app' }).click();
  await page.getByRole('button', { name: 'Challenge' }).click();
  await page.getByRole('button', { name: 'Reveal comparison' }).click();
  await expect(page.getByText('Yours', { exact: true })).toBeVisible();
  await expect(page.getByText('Greedy', { exact: true })).toBeVisible();
  await expect(page.getByText('Dynamic programming', { exact: true })).toBeVisible();
  await shot(page, 'play-challenge', 1366, 768);
  await shot(page, 'play-challenge', 390, 844);
});

test('Plan route renders, and Algorithm and Files open responsive drawers', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open app' }).click();
  await page.getByRole('link', { name: 'Plan' }).click();
  await expect(page.locator('main')).toBeVisible();
  await shot(page, 'plan', 1366, 768);
  await shot(page, 'plan', 390, 844);

  await page.getByRole('button', { name: 'Algorithm', exact: true }).click();
  const algorithmDrawer = page.getByRole('dialog', { name: 'Algorithm drawer' });
  await expect(algorithmDrawer).toBeVisible();
  await shot(page, 'algorithm-drawer', 1366, 768);
  await shot(page, 'algorithm-drawer', 390, 844);
  await page.getByRole('button', { name: 'Close drawer' }).last().click();

  await page.getByRole('button', { name: 'Files', exact: true }).click();
  const filesDrawer = page.getByRole('dialog', { name: 'Files drawer' });
  await expect(filesDrawer).toBeVisible();
  await shot(page, 'files-drawer', 1366, 768);
  await shot(page, 'files-drawer', 390, 844);
});

test('Settings dialog stays within desktop and mobile viewports', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open app' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();
  for (const [width, height] of [[1366, 768], [390, 844]]) {
    await page.setViewportSize({ width, height });
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(height);
    await shot(page, 'settings', width, height);
  }
});

test('Files score can be overridden and reset to the suggestion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open app' }).click();
  await page.getByRole('button', { name: 'Files', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Files drawer' })).toBeVisible();
  const row = page.locator('tbody tr').filter({ hasText: 'Algorithms_Final_Report.pdf' }).first();
  const score = row.locator('select');
  await score.selectOption('1');
  const reset = row.getByRole('button', { name: 'Edited · Reset' });
  await expect(reset).toBeVisible();
  await reset.click();
  await expect(row.getByRole('button', { name: 'Edited · Reset' })).toHaveCount(0);
});

test('Algorithm walkthrough can advance to traceback', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open app' }).click();
  await page.getByRole('button', { name: 'Algorithm', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Algorithm drawer' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip to end' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip to end' }).click();
  await expect(page.getByText(/This file is part of the best plan|The best plan does not need this file/)).toBeVisible();
});

test('Plan exports download a CSV file', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open app' }).click();
  await page.getByRole('link', { name: 'Plan' }).click();
  await page.getByRole('button', { name: 'Find the best plan' }).click();
  await expect(page.getByRole('button', { name: 'Exports' })).toBeVisible();
  await page.getByRole('button', { name: 'Exports' }).click();
  await expect(page.getByRole('heading', { name: 'Reports & Exports' })).toBeVisible();
  await shot(page, 'reports', 1366, 768);
  await shot(page, 'reports', 390, 844);
  await page.getByRole('button', { name: /CSV Spreadsheet Export/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .csv' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
});
