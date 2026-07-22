import { expect, test } from '@playwright/test';

import { gotoApp, mockApi, openTab } from './helpers';

/** Bottom-tab navigation between the three screens. */

test('switches between the three tabs', async ({ page }) => {
  await mockApi(page);
  await gotoApp(page);

  // Starts on Departures.
  await expect(page.getByText('No stop selected')).toBeVisible();

  await openTab(page, 'search');
  await expect(page.getByTestId('search-input')).toBeVisible();

  await openTab(page, 'favorites');
  await expect(page.getByText('No favorites yet')).toBeVisible();

  await openTab(page, 'departures');
  await expect(page.getByText('No stop selected')).toBeVisible();
});
