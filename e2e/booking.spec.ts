import { test, expect } from '@playwright/test';

test('End-to-end Booking Flow', async ({ page }) => {
  // 1. Visit the demo tenant landing page
  await page.goto('/peluqueria-juan');
  
  // Verify basic page load and title
  await expect(page.locator('h1')).toContainText('Peluqueria Juan');

  // 2. Select a service
  // Service 1 is automatically selected per the useState logic, but let's select the second one
  const service2 = page.locator('button', { hasText: 'Beard Trim' });
  await expect(service2).toBeVisible();
  await service2.click();

  // 3. Select a date (default is today, so we'll just use the default grid)
  
  // Wait for the booking grid to load and have at least one slot
  // Mocks generate slots after a brief async pause.
  const timeSlot = page.getByTestId('available-slot').first();
  await expect(timeSlot).toBeVisible({ timeout: 15000 }); // give it a few secs to load mock slots
  
  // Click the first available slot
  await timeSlot.click();
  
  // Verify it got selected (checks for scale-105 class assigned in our JSX)
  await expect(timeSlot).toHaveClass(/scale-105/);

  // 4. Click continue
  const continueBtn = page.getByRole('button', { name: 'Continue to Payment' });
  await expect(continueBtn).toBeEnabled();
  await continueBtn.click();

  // 5. Verify redirection to Success page
  // Since we don't have real stripe keys in integration test, our server action
  // detects the error/lack of session and falls back to /tenantSlug/success redirection for this demo.
  await page.waitForURL('**/success');
  
  // Check success page text
  await expect(page.locator('h1')).toHaveText('Booking Confirmed!');
  await expect(page.getByText('Your appointment has been successfully scheduled')).toBeVisible();

  // Return home
  const returnBtn = page.getByRole('link', { name: 'Return to Home' });
  await returnBtn.click();
  await page.waitForURL('**/peluqueria-juan');
});
