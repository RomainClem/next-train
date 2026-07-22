import { expect, test } from '@playwright/test';

import { gotoApp, mockApi, openTab, seedStore } from './helpers';

/**
 * Favorites tab: empty state, listing seeded favourites, removing one, and
 * tapping through to a stop's departures.
 */

const SORGENFRI = {
  id: 'A=1@O=Sorgenfri St.@L=8600858@',
  extId: '8600858',
  name: 'Sorgenfri St.',
};

test('shows an empty state with no favourites', async ({ page }) => {
  await mockApi(page);
  await gotoApp(page);
  await openTab(page, 'favorites');

  await expect(page.getByText('No favorites yet')).toBeVisible();
  await expect(page.getByText('Tap the star on a stop in Search to save it here.')).toBeVisible();
});

test('lists a saved favourite', async ({ page }) => {
  await mockApi(page);
  await seedStore(page, { favorites: [SORGENFRI] });
  await gotoApp(page);
  await openTab(page, 'favorites');

  await expect(page.getByText('Sorgenfri St.')).toBeVisible();
});

test('removing a favourite empties the list', async ({ page }) => {
  await mockApi(page);
  await seedStore(page, { favorites: [SORGENFRI] });
  await gotoApp(page);
  await openTab(page, 'favorites');

  await expect(page.getByText('Sorgenfri St.')).toBeVisible();
  await page.getByTestId('fav-8600858').click();

  await expect(page.getByText('No favorites yet')).toBeVisible();
});

test('tapping a favourite opens its departures', async ({ page }) => {
  await mockApi(page);
  await seedStore(page, { favorites: [SORGENFRI] });
  await gotoApp(page);
  await openTab(page, 'favorites');

  await page.getByTestId('stop-8600858').click();

  await expect(page.getByTestId('departure-row').first()).toBeVisible();
  await expect(page.getByText('Re 4250')).toBeVisible();
});

test('a favourite added in Search persists across reload', async ({ page }) => {
  await mockApi(page);
  await gotoApp(page);

  // Add from Search…
  await openTab(page, 'search');
  await page.getByTestId('search-input').fill('sorgenfri');
  await expect(page.getByText('Sorgenfri St.', { exact: true })).toBeVisible();
  await page.getByTestId('fav-8600858').click();

  // …reload the whole app, then check it survived (localStorage persist).
  await page.reload();
  await openTab(page, 'favorites');
  await expect(page.getByText('Sorgenfri St.')).toBeVisible();
});
