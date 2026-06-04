import { test, expect } from '@playwright/test';

test('basic navigation and smoke test', async ({ page }) => {
  // Go to index, which should now serve the landing page
  await page.goto('/');
  
  // Check for the main heading on the landing page
  await expect(page.getByRole('heading', { name: /Stop solving generic puzzles/i })).toBeVisible();
  
  // Click the CTA to go to analyze
  await page.locator('#start-analyzing-btn').click();

  // Wait for navigation and check URL
  await expect(page).toHaveURL(/.*analyze/);
  
  // Check for the main heading on the analyze page
  await expect(page.getByRole('heading', { name: /Analyze your form/i })).toBeVisible();
});
