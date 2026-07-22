import { expect, test } from '@playwright/test';

import { emptySearchResponse } from './fixtures';
import { gotoApp, mockApi, openTab } from './helpers';

/**
 * Search tab: name search (the flow behind the "sorgenfri returns nothing" bug),
 * empty/hint/error states, the clear button, favouriting, and stop selection.
 */

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await gotoApp(page);
  await openTab(page, 'search');
});

test('shows the initial hint before typing', async ({ page }) => {
  await expect(
    page.getByText('Search by name or use your location.'),
  ).toBeVisible();
});

test('typing a query returns matching stops', async ({ page }) => {
  await page.getByTestId('search-input').fill('sorgenfri');

  await expect(page.getByText('Sorgenfri St.', { exact: true })).toBeVisible();
  await expect(page.getByText('Sorgenfri St. (Bus)')).toBeVisible();
});

test('does not search for a single character', async ({ page }) => {
  await page.getByTestId('search-input').fill('s');

  // Query is disabled under 2 chars, so the initial hint stays put.
  await expect(
    page.getByText('Search by name or use your location.'),
  ).toBeVisible();
  await expect(page.getByText('Sorgenfri St.')).toHaveCount(0);
});

test('shows "No stops found." when nothing matches', async ({ page }) => {
  await mockApi(page, { search: emptySearchResponse });

  await page.getByTestId('search-input').fill('zzzzz');

  await expect(page.getByText('No stops found.')).toBeVisible();
});

test('surfaces an API error instead of failing silently', async ({ page }) => {
  await mockApi(page, { search: { httpStatus: 500 } });

  await page.getByTestId('search-input').fill('sorgenfri');

  await expect(page.getByText(/HTTP 500/)).toBeVisible();
});

test('clear button empties the field and restores the hint', async ({ page }) => {
  const input = page.getByTestId('search-input');
  await input.fill('sorgenfri');
  await expect(page.getByText('Sorgenfri St.', { exact: true })).toBeVisible();

  await page.getByTestId('search-clear').click();

  await expect(input).toHaveValue('');
  await expect(
    page.getByText('Search by name or use your location.'),
  ).toBeVisible();
});

test('favouriting a stop toggles the star label', async ({ page }) => {
  await page.getByTestId('search-input').fill('sorgenfri');
  await expect(page.getByText('Sorgenfri St.', { exact: true })).toBeVisible();

  const favBtn = page.getByTestId('fav-8600858');
  await expect(favBtn).toHaveAttribute('aria-label', 'Add favorite');

  await favBtn.click();
  await expect(favBtn).toHaveAttribute('aria-label', 'Remove favorite');

  await favBtn.click();
  await expect(favBtn).toHaveAttribute('aria-label', 'Add favorite');
});

test('selecting a stop navigates to its departures', async ({ page }) => {
  await page.getByTestId('search-input').fill('sorgenfri');
  await page.getByTestId('stop-8600858').click();

  // Landed on Departures with the board rendered from the mock.
  await expect(page.getByTestId('departure-row').first()).toBeVisible();
  await expect(page.getByText('Re 4250')).toBeVisible();
});
