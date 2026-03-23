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

  // 3.5 Fill contact details
  await page.locator('#name').fill('Test User');
  await page.locator('#email').fill('test@example.com');
  await page.locator('#phone').fill('+1234567890');

  // 4. Click continue
  const continueBtn = page.getByRole('button', { name: 'Continue to Payment' });
  await expect(continueBtn).toBeEnabled();
  await continueBtn.click();

  // 5. Verify error is shown since we don't have real stripe keys or db seeded in integration test
  // Our server action detects the lack of configuration and returns an error
  // The UI then displays the error message.
  await expect(page.locator('.text-red-600, .dark\\:text-red-400').first()).toBeVisible();
});
