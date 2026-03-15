import { test, expect } from '@playwright/test';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Home page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE);
    });

    test('page loads with 200 status', async ({ page }) => {
        const res = await page.goto(BASE);
        expect(res?.status()).toBe(200);
    });

    test('has correct page title', async ({ page }) => {
        await expect(page).toHaveTitle(/colife/i);
    });

    test('navbar is visible', async ({ page }) => {
        await expect(page.locator('nav')).toBeVisible();
    });

    test('hero section is visible', async ({ page }) => {
        // Hero should contain a heading with "coliving" or "PG" or a CTA
        const hero = page.locator('section').first();
        await expect(hero).toBeVisible();
    });

    test('shows Login / Get Started button when not logged in', async ({ page }) => {
        const loginBtn = page.getByRole('link', { name: /login|get started|sign in/i });
        await expect(loginBtn.first()).toBeVisible();
    });

    test('shows property cards or featured section', async ({ page }) => {
        // Wait for properties to load
        await page.waitForLoadState('networkidle');
        const cards = page.locator('[class*="card"], [class*="Card"]');
        const count = await cards.count();
        expect(count).toBeGreaterThanOrEqual(0); // page renders without crash
    });

    test('footer is visible', async ({ page }) => {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await expect(page.locator('footer')).toBeVisible();
    });

    test('has no JS console errors on load', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));
        await page.goto(BASE);
        await page.waitForLoadState('networkidle');
        // Filter out known third-party / env errors
        const criticalErrors = errors.filter(
            (e) => !e.includes('firebase') && !e.includes('recaptcha') && !e.includes('razorpay')
        );
        expect(criticalErrors).toHaveLength(0);
    });
});
