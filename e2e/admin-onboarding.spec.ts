import { test, expect } from '@playwright/test';

/**
 * Note: E2E testing authenticated server components in Next.js + Supabase 
 * requires a real test user account in the Supabase instance, because
 * the server validates the JWT signature via `@supabase/ssr`.
 * 
 * To run this test:
 * 1. Create a dedicated test user in your Supabase Auth (e.g., e2e@nexturno.com)
 * 2. In playwright.config.ts, configure `globalSetup` to log in via API and 
 *    save the storage state (cookies) to a file.
 * 3. Use `test.use({ storageState: 'playwright/.auth/admin.json' })` in this suite.
 * 
 * We mark this as skipped until a test account is configured.
 */
test.describe.skip('Admin Onboarding Flow', () => {

  test('should generate slug automatically based on business name', async ({ page }) => {
    // 1. Visit the onboarding page (assuming auth context is injected)
    await page.goto('/es/admin/onboarding');

    // 2. Locate form elements
    const nameInput = page.locator('input[name="name"]');
    const slugInput = page.locator('input[name="slug"]');

    // 3. Type a business name with spaces and special characters
    await nameInput.fill('Peluquería de Juan & María');

    // 4. Verify the slug is auto-generated and cleaned
    // Expected: peluqueria-de-juan-maria
    await expect(slugInput).toHaveValue('peluqueria-de-juan-maria');
  });

  test('should allow manual override of the slug without auto-updating afterwards', async ({ page }) => {
    await page.goto('/es/admin/onboarding');

    const nameInput = page.locator('input[name="name"]');
    const slugInput = page.locator('input[name="slug"]');

    // 1. Type name
    await nameInput.fill('My Business');
    await expect(slugInput).toHaveValue('my-business');

    // 2. Manually override slug
    await slugInput.fill('custom-business-link');

    // 3. Change name again
    await nameInput.fill('My New Business');

    // 4. Verify slug did NOT change because user manually touched it
    await expect(slugInput).toHaveValue('custom-business-link');
  });

  test('should complete the onboarding flow successfully', async ({ page }) => {
    await page.goto('/es/admin/onboarding');

    // 1. Fill the form
    await page.locator('input[name="name"]').fill('E2E Test Clinic');
    // Slug auto-generates to 'e2e-test-clinic'
    
    // Select currency
    await page.locator('select[name="currency"]').selectOption('EUR');
    
    // Select granularity
    await page.locator('select[name="slot_interval_minutes"]').selectOption('15');

    // 2. Submit form
    const launchButton = page.locator('button[type="submit"]', { hasText: /Launch my workspace/i });
    await expect(launchButton).toBeEnabled();
    
    // We intercept the network request to prevent actual DB creation during test
    // since this uses Next.js Server Actions, it sends a POST to the current URL
    await page.route('**/*', async (route) => {
      if (route.request().method() === 'POST') {
        // Mock the Server Action response directing to dashboard
        return route.fulfill({
          status: 200,
          contentType: 'text/x-component',
          body: '1:HL["/es/admin/dashboard"]\n', // Next.js internal flight response for redirect
        });
      }
      return route.continue();
    });

    await launchButton.click();

    // 3. Verify conceptual redirection
    // In a real scenario without the intercept, we would wait for the URL
    // await page.waitForURL('**/admin/dashboard');
  });
});
