import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [['html', { open: 'never' }], ['line']],
    globalSetup: require.resolve('./tests/global-setup'),
    globalTeardown: require.resolve('./tests/global-teardown'),
    use: {
        baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'api',
            testMatch: '**/*.api.test.ts',
        },
        {
            name: 'ui',
            testMatch: '**/*.ui.test.ts',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
