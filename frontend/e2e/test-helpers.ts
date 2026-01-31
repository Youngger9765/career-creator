/**
 * Test helpers for E2E tests
 */

/**
 * Skip production-specific tests in CI environment
 * These tests target production URLs and should only run locally
 */
export const skipInCI = () => !!process.env.CI;
