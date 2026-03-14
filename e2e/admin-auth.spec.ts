import { test, expect } from '@playwright/test';

test.describe('Admin Auth Flow', () => {

  test('should display login page correctly', async ({ page }) => {
    // 1. Visit the admin login page
    await page.goto('/es/admin/login');

    // 2. Verify UI elements
    await expect(page.locator('h1')).toContainText('Welcome back');
    
    // Check for the Google Login button
    const googleBtn = page.locator('button', { hasText: /Google/i });
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toBeEnabled();
  });

  test('should restrict access to dashboard without session', async ({ page }) => {
    // 1. Try to access the dashboard directly without being logged in
    await page.goto('/es/admin/dashboard');

    // 2. The middleware or the page layout should redirect back to login
    await page.waitForURL('**/admin/login*');
    
    // We expect the URL to include the redirect target and the title to be the login page
    await expect(page.url()).toContain('/admin/login');
    await expect(page.locator('h1')).toContainText('Welcome back');
  });

  test('should restrict access to onboarding without session', async ({ page }) => {
     // Try to access onboarding
     await page.goto('/es/admin/onboarding');

     // Should be redirected to login
     await page.waitForURL('**/admin/login*');
     await expect(page.url()).toContain('/admin/login');
  });

});
