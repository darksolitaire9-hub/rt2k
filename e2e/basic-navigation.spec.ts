import { test, expect } from '@playwright/test';

test('basic navigation and smoke test', async ({ page }) => {
  // Go to index, which should redirect to /analyze
  await page.goto('/');
  
  // Wait for redirect and check URL
  await expect(page).toHaveURL(/.*analyze/);
  
  // Check for the main heading on the analyze page
  await expect(page.getByRole('heading', { name: /Analyze your form/i })).toBeVisible();
  
  // Check for PGN upload card area
  await expect(page.getByText(/Upload your PGN/i)).toBeVisible();
});
