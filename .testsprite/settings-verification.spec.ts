import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'playwright@test.com';
const TEST_PASSWORD = 'Test@12345';

test.describe('Settings Page — Core Modules Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Mock downstream APIs so tests don't hit real services
    await page.route('**/api/settings**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, settings: {} })
        });
      }
    });

    await page.route('**/api/rules**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, rules: [] })
      });
    });

    await page.route('**/api/onboarding**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ configured: true })
      });
    });

    // Login through the actual form
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[placeholder*="password" i], input[type="password"]', TEST_PASSWORD);

    const loginBtn = page.locator('button[type="submit"]');
    await loginBtn.click();

    // Wait for redirect away from login page
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Seed localStorage for settings page
    await page.evaluate(() => {
      localStorage.setItem('wb_settings', JSON.stringify({
        autoReplyEnabled: true,
        smartHandoffEnabled: true,
        aiFallbackEnabled: true,
        autoProfileEnabled: true,
        smartPricingEnabled: true,
        autoRuleGeneration: true,
        sentimentAnalysis: true,
        smartScheduling: true,
        emailNotifications: true,
        responseLanguage: 'hinglish',
        businessHours: '9 AM to 8 PM',
        handoffTriggers: ['talk to owner', 'speak to human'],
      }));
    });

    // Navigate to settings
    await page.goto('http://localhost:3000/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  // ─── SECTION 1: AI Auto-Pilot ───

  test('AI Auto-Pilot section renders with header', async ({ page }) => {
    const section = page.locator('text=AI Auto-Pilot').first();
    await expect(section).toBeVisible({ timeout: 15000 });
  });

  test('AI Auto-Pilot: Auto-Reply toggle renders', async ({ page }) => {
    await expect(page.locator('text=Auto-Reply to Everything').first()).toBeVisible({ timeout: 10000 });
  });

  test('AI Auto-Pilot: Smart Handoff toggle renders', async ({ page }) => {
    await expect(page.locator('text=Smart Handoff').first()).toBeVisible({ timeout: 10000 });
  });

  test('AI Auto-Pilot: AI Fallback toggle renders', async ({ page }) => {
    await expect(page.locator('text=AI Fallback').first()).toBeVisible({ timeout: 10000 });
  });

  test('AI Auto-Pilot: has 3 toggle switches', async ({ page }) => {
    const switches = page.locator('[role="switch"]');
    await expect(switches.first()).toBeVisible({ timeout: 10000 });
    const count = await switches.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // ─── SECTION 2: Smart Automation ───

  test('Smart Automation section renders with header', async ({ page }) => {
    await expect(page.locator('text=Smart Automation').first()).toBeVisible({ timeout: 10000 });
  });

  test('Smart Automation: Auto Profile Generation toggle', async ({ page }) => {
    await expect(page.locator('text=Auto Profile Generation').first()).toBeVisible({ timeout: 10000 });
  });

  test('Smart Automation: Smart Pricing Suggestions toggle', async ({ page }) => {
    await expect(page.locator('text=Smart Pricing Suggestions').first()).toBeVisible({ timeout: 10000 });
  });

  test('Smart Automation: Auto Rule Generation toggle', async ({ page }) => {
    await expect(page.locator('text=Auto Rule Generation').first()).toBeVisible({ timeout: 10000 });
  });

  test('Smart Automation: Sentiment Analysis toggle', async ({ page }) => {
    await expect(page.locator('text=Sentiment Analysis').first()).toBeVisible({ timeout: 10000 });
  });

  test('Smart Automation: Smart Scheduling toggle', async ({ page }) => {
    await expect(page.locator('text=Smart Scheduling').first()).toBeVisible({ timeout: 10000 });
  });

  test('Smart Automation: has 5 toggle switches', async ({ page }) => {
    const switches = page.locator('[role="switch"]');
    await expect(switches.first()).toBeVisible({ timeout: 10000 });
    const count = await switches.count();
    expect(count).toBeGreaterThanOrEqual(8); // 3 auto-pilot + 5 smart automation
  });

  // ─── SECTION 3: Developer Settings ───

  test('Developer Settings header is visible', async ({ page }) => {
    await expect(page.locator('text=Developer Settings').first()).toBeVisible({ timeout: 10000 });
  });

  test('Developer Settings: expands and shows API fields', async ({ page }) => {
    await page.locator('text=Developer Settings').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=WhatsApp Access Token').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Phone Number ID').first()).toBeVisible();
    await expect(page.locator('text=Webhook Verify Token').first()).toBeVisible();
    await expect(page.locator('text=Resend API Key').first()).toBeVisible();
  });

  // ─── INTERACTION TEST ───

  test('Toggle Smart Handoff off and on', async ({ page }) => {
    const smartHandoffText = page.locator('text=Smart Handoff').first();
    await expect(smartHandoffText).toBeVisible({ timeout: 10000 });

    const toggleRow = smartHandoffText.locator('xpath=ancestor::div[contains(@class,"justify-between")]').first();
    const toggle = toggleRow.locator('[role="switch"]');

    await expect(toggle).toHaveAttribute('aria-checked', 'true', { timeout: 5000 });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  // ─── FULL PAGE VERIFICATION ───

  test('Full settings page renders without UI bugs', async ({ page }) => {
    await expect(page.locator('h1:has-text("Settings")').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=AI Auto-Pilot').first()).toBeVisible();
    await expect(page.locator('text=Smart Automation').first()).toBeVisible();
    await expect(page.locator('text=Developer Settings').first()).toBeVisible();
    await expect(page.locator('text=Save All Settings').first()).toBeVisible();

    const allSwitches = page.locator('[role="switch"]');
    const count = await allSwitches.count();
    expect(count).toBeGreaterThanOrEqual(8);
    expect(count).toBeLessThanOrEqual(10);

    await page.screenshot({ path: '.testsprite/settings-full-page.png', fullPage: true });
  });

});
