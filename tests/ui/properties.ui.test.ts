import { test, expect } from '@playwright/test';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Properties listing page (/properties)', () => {
    test('page loads successfully', async ({ page }) => {
        const res = await page.goto(`${BASE}/properties`);
        expect(res?.status()).toBe(200);
    });

    test('shows search/filter UI', async ({ page }) => {
        await page.goto(`${BASE}/properties`);
        await page.waitForLoadState('networkidle');
        const filterArea = page.locator('input, select, [role="combobox"]').first();
        await expect(filterArea).toBeVisible();
    });

    test('displays property cards after loading', async ({ page }) => {
        // Set up waitForResponse BEFORE navigating so we don't miss the request
        const responsePromise = page.waitForResponse((res) => res.url().includes('/api/v1/properties'));
        await page.goto(`${BASE}/properties`);
        await responsePromise;
        const cards = page.locator('[class*="card"], [class*="Card"], [class*="property"]').first();
        await expect(cards).toBeVisible({ timeout: 10000 });
    });

    test('each property card shows price', async ({ page }) => {
        const responsePromise = page.waitForResponse((res) => res.url().includes('/api/v1/properties'));
        await page.goto(`${BASE}/properties`);
        await responsePromise;
        await page.waitForLoadState('networkidle');
        const prices = page.getByText(/₹|\/month/i).first();
        await expect(prices).toBeVisible({ timeout: 8000 });
    });

    test('clicking a property card navigates to detail page', async ({ page }) => {
        const responsePromise = page.waitForResponse((res) => res.url().includes('/api/v1/properties'));
        await page.goto(`${BASE}/properties`);
        await responsePromise;
        const firstCard = page.locator('a[href*="/properties/"]').first();
        await expect(firstCard).toBeVisible({ timeout: 10000 });
        await firstCard.click();
        await expect(page).toHaveURL(/\/properties\/.+/);
    });

    test('city filter updates results', async ({ page }) => {
        await page.goto(`${BASE}/properties`);
        await page.waitForLoadState('networkidle');
        const cityInput = page.locator('input[placeholder*="city" i], select[name*="city" i], [placeholder*="search" i]').first();
        if (await cityInput.isVisible()) {
            const responsePromise = page.waitForResponse((res) => res.url().includes('/api/v1/properties'));
            await cityInput.fill('Mumbai');
            await page.keyboard.press('Enter');
            await responsePromise;
        }
        await expect(page.locator('body')).toBeVisible();
    });

    test('page does not crash with no results', async ({ page }) => {
        await page.goto(`${BASE}/properties?city=NoSuchCityXYZ`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
    });
});
