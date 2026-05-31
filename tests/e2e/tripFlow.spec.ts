import { test, expect } from '@playwright/test';

test.describe('Traveler AI App Flow Validation', () => {

  test('User can navigate landing page, login via demo bypass, and plan a trip', async ({ page }) => {
    // 1. Visit Landing Page
    await page.goto('/');
    await expect(page).toHaveTitle(/Travel Planner AI/);
    
    // Check main accessible H1 title
    const headerTitle = page.locator('h1');
    await expect(headerTitle).toContainText('Intelligent Travel Planning & Experience Engine');

    // 2. Click Start Planning CTA to go to Auth Page
    const startCta = page.getByRole('button', { name: 'Start Planning Now' });
    await startCta.click();
    await expect(page).toHaveURL(/\/auth/);

    // 3. Perform One-Click Demo Bypass Login
    const demoBtn = page.getByRole('button', { name: 'One-Click Demo Login' });
    await demoBtn.click();
    
    // Auth shifts dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h2')).toContainText('Your Saved Trips');

    // 4. Navigate to Planning Wizard
    const newTripBtn = page.getByRole('button', { name: 'Plan New Trip' });
    await newTripBtn.click();
    await expect(page).toHaveURL(/\/planner/);

    // 5. Fill Planning inputs
    await page.getByLabel('Starting Location').fill('New York, USA');
    await page.getByLabel('Destination Location').fill('Paris, France');
    
    // Dates
    await page.getByLabel('Start Date').fill('2026-07-01');
    await page.getByLabel('End Date').fill('2026-07-05');
    
    // Budget & Style
    await page.getByLabel('Number of Travelers').fill('2');
    
    // Select travel style
    await page.getByLabel('Travel Style').click();
    await page.getByRole('option', { name: 'Balanced' }).click();

    // Select interest chips
    await page.getByRole('button', { name: 'Museums' }).click();
    await page.getByRole('button', { name: 'Food & Dining' }).click();

    // Enable Accessibility verification
    await page.locator('text=Require Accessibility-Friendly Locations').click();

    // 6. Submit synthesis form
    const submitBtn = page.getByRole('button', { name: 'Synthesize Smart Itinerary' });
    await submitBtn.click();

    // 7. Verify loader redirects into Map Page
    await expect(page).toHaveURL(/\/map\//, { timeout: 10000 });
    
    // Map Details check
    await expect(page.locator('text=Day 1 Route Details')).toBeVisible();
    await expect(page.locator('text=GEOGRAPHIC SIMULATOR ACTIVE')).toBeVisible();
    
    // Budget Donut Chart should exist
    await expect(page.locator('text=Budget Allocation')).toBeVisible();
    await expect(page.locator('text=Accommodation')).toBeVisible();
  });

});
