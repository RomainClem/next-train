import { expect, test } from '@playwright/test';

import { gotoApp, mockApi, openTab } from './helpers';

/**
 * "Use my location" flow. expo-location on web delegates to the browser
 * Geolocation API, so we grant the permission and pin coordinates, then assert
 * the nearby-stops list (with distances) renders.
 */

test.use({
  permissions: ['geolocation'],
  geolocation: { latitude: 55.6761, longitude: 12.5683 }, // Copenhagen
});

test('nearby stops load after granting location', async ({ page }) => {
  await mockApi(page);
  await gotoApp(page);
  await openTab(page, 'search');

  await page.getByTestId('use-location').click();

  await expect(page.getByText('Nørreport St.')).toBeVisible();
  // nearbystops rows show distance from `dist`.
  await expect(page.getByText('120 m away')).toBeVisible();
});
