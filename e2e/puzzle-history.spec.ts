import { test, expect } from '@playwright/test';

test('puzzle history tabs visibility', async ({ page }) => {
  await page.goto('/puzzles');
  
  // If no puzzles yet, tabs shouldn't show (as per my v-if="allPuzzles.length > 0" logic)
  await expect(page.getByRole('heading', { name: /No puzzles yet/i })).toBeVisible();
  const tabs = page.locator('.rounded-\\[--radius-stm\\]').filter({ hasText: /To Do/ });
  await expect(tabs).not.toBeVisible();
});
