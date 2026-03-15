import { test, expect } from '@playwright/test';
import { loadFixtures } from '../helpers/fixtures';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Login page (/auth/login)', () => {
    test('page loads successfully', async ({ page }) => {
        const res = await page.goto(`${BASE}/auth/login`);
        expect(res?.status()).toBe(200);
    });

    test('shows phone number input', async ({ page }) => {
        await page.goto(`${BASE}/auth/login`);
        const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i], input[placeholder*="mobile" i]');
        await expect(phoneInput.first()).toBeVisible();
    });

    test('shows send OTP button', async ({ page }) => {
        await page.goto(`${BASE}/auth/login`);
        const sendBtn = page.getByRole('button', { name: /send otp|get otp|continue/i });
        await expect(sendBtn.first()).toBeVisible();
    });

    test('OTP button is disabled until a phone number is entered', async ({ page }) => {
        await page.goto(`${BASE}/auth/login`);
        const sendBtn = page.getByRole('button', { name: /send otp|get otp|continue/i }).first();
        await expect(sendBtn).toBeDisabled();
    });

    test('OTP button becomes enabled after entering a 10-digit phone number', async ({ page }) => {
        await page.goto(`${BASE}/auth/login`);
        const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i]').first();
        await phoneInput.fill('9876543210');
        const sendBtn = page.getByRole('button', { name: /send otp|get otp|continue/i }).first();
        await expect(sendBtn).toBeEnabled({ timeout: 3000 });
    });
});

test.describe('Register page (/auth/register)', () => {
    test('page loads successfully', async ({ page }) => {
        const res = await page.goto(`${BASE}/auth/register`);
        expect(res?.status()).toBe(200);
    });

    test('shows role selection (Tenant / Owner)', async ({ page }) => {
        await page.goto(`${BASE}/auth/register`);
        await page.waitForLoadState('networkidle');
        const tenantOption = page.getByText(/tenant|looking for|find a place/i);
        const ownerOption = page.getByText(/owner|list|property/i);
        const tenantVisible = await tenantOption.count() > 0;
        const ownerVisible = await ownerOption.count() > 0;
        expect(tenantVisible || ownerVisible).toBe(true);
    });
});

test.describe('Auth redirect behaviour', () => {
    test('unauthenticated user accessing /dashboard is redirected', async ({ page }) => {
        await page.goto(`${BASE}/dashboard/tenant`);
        await page.waitForLoadState('networkidle');
        const url = page.url();
        const onLoginPage = url.includes('/auth/login') || url.includes('/auth/register');
        const hasLoginButton = await page.getByRole('button', { name: /login|sign in/i }).count() > 0;
        expect(onLoginPage || hasLoginButton).toBe(true);
    });

    test('authenticated tenant can reach tenant dashboard', async ({ page }) => {
        const fx = loadFixtures();
        // addInitScript runs before any page JS — token is present on the very first load
        await page.addInitScript((token) => {
            localStorage.setItem('colife_token', token);
        }, fx.tenant.token);
        await page.goto(`${BASE}/dashboard/tenant`);
        await page.waitForLoadState('networkidle');
        expect(page.url()).not.toContain('/auth/login');
    });

    test('authenticated admin can reach admin dashboard', async ({ page }) => {
        const fx = loadFixtures();
        await page.addInitScript((token) => {
            localStorage.setItem('colife_token', token);
        }, fx.admin.token);
        await page.goto(`${BASE}/dashboard/admin`);
        await page.waitForLoadState('networkidle');
        expect(page.url()).not.toContain('/auth/login');
    });
});
