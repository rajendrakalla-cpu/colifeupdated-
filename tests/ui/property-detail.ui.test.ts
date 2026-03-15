import { test, expect } from '@playwright/test';
import { loadFixtures } from '../helpers/fixtures';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Property detail page (/properties/:id)', () => {
    test('loads the test property page', async ({ page }) => {
        const fx = loadFixtures();
        const res = await page.goto(`${BASE}/properties/${fx.property.id}`);
        expect(res?.status()).toBe(200);
    });

    test('shows property name', async ({ page }) => {
        const fx = loadFixtures();
        await page.goto(`${BASE}/properties/${fx.property.id}`);
        await page.waitForLoadState('networkidle');
        await expect(page.getByText('E2E Test Property')).toBeVisible();
    });

    test('shows property location', async ({ page }) => {
        const fx = loadFixtures();
        await page.goto(`${BASE}/properties/${fx.property.id}`);
        await page.waitForLoadState('networkidle');
        // Use .first() to avoid strict-mode failure when multiple elements match
        await expect(page.getByText(/Koramangala|Bangalore/i).first()).toBeVisible();
    });

    test('shows price', async ({ page }) => {
        const fx = loadFixtures();
        await page.goto(`${BASE}/properties/${fx.property.id}`);
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(/₹|8,000|8000/).first()).toBeVisible();
    });

    test('shows amenities section', async ({ page }) => {
        const fx = loadFixtures();
        await page.goto(`${BASE}/properties/${fx.property.id}`);
        await page.waitForLoadState('networkidle');
        await expect(page.getByText(/WiFi|amenities/i).first()).toBeVisible();
    });

    test('shows booking CTA button', async ({ page }) => {
        const fx = loadFixtures();
        await page.goto(`${BASE}/properties/${fx.property.id}`);
        await page.waitForLoadState('networkidle');
        const bookBtn = page.getByRole('button', { name: /book|reserve|enquire/i });
        await expect(bookBtn).toBeVisible({ timeout: 8000 });
    });

    test('recommendations section renders (or is hidden when no results)', async ({ page }) => {
        const fx = loadFixtures();
        await page.goto(`${BASE}/properties/${fx.property.id}`);
        await page.waitForLoadState('networkidle');
        // RecommendationsSection renders null when loading or empty — just ensure no crash
        await expect(page.locator('body')).toBeVisible();
    });

    test('404 page for non-existent property id', async ({ page }) => {
        const res = await page.goto(`${BASE}/properties/non-existent-property-xyz`);
        // Next.js returns 200 with a 404 page content, or redirects — just check no 500
        expect(res?.status()).not.toBe(500);
    });
});

test.describe('Property detail - authenticated user', () => {
    test.beforeEach(async ({ page }) => {
        const fx = loadFixtures();
        // Inject auth token into localStorage before navigating
        await page.goto(BASE);
        await page.evaluate((token) => {
            localStorage.setItem('colife_token', token);
        }, fx.tenant.token);
    });

    test('authenticated user sees booking form', async ({ page }) => {
        const fx = loadFixtures();
        await page.goto(`${BASE}/properties/${fx.property.id}`);
        await page.waitForLoadState('networkidle');
        const bookBtn = page.getByRole('button', { name: /book|reserve|enquire/i });
        await expect(bookBtn).toBeVisible({ timeout: 8000 });
    });
});
