import { expect, test } from '@playwright/test';

import { emptyDepartureResponse } from './fixtures';
import { gotoApp, mockApi, seedStore } from './helpers';

/**
 * Departures tab (index): empty "no stop" state, the live board, the header
 * name (only shown for a favourited stop), and empty/error states.
 */

const SORGENFRI = {
  id: 'A=1@O=Sorgenfri St.@L=8600858@',
  extId: '8600858',
  name: 'Sorgenfri St.',
};

test('prompts to pick a stop when none is selected', async ({ page }) => {
  await mockApi(page);
  await gotoApp(page);

  await expect(page.getByText('No stop selected')).toBeVisible();
  await expect(
    page.getByText('Pick a stop from the Search tab to see live departures.'),
  ).toBeVisible();
});

test('renders the departure board for the selected stop', async ({ page }) => {
  await mockApi(page);
  await seedStore(page, { selectedExtId: SORGENFRI.extId });
  await gotoApp(page);

  await expect(page.getByTestId('departure-row')).toHaveCount(2);
  await expect(page.getByText('Re 4250')).toBeVisible();
  await expect(page.getByText('København H')).toBeVisible();
});

test('shows the stop name header when the stop is a favourite', async ({ page }) => {
  await mockApi(page);
  await seedStore(page, {
    favorites: [SORGENFRI],
    selectedExtId: SORGENFRI.extId,
  });
  await gotoApp(page);

  // The name appears in the board header (in addition to any row text).
  await expect(page.getByText('Sorgenfri St.').first()).toBeVisible();
});

test('shows an empty state when there are no departures', async ({ page }) => {
  await mockApi(page, { departureBoard: emptyDepartureResponse });
  await seedStore(page, { selectedExtId: SORGENFRI.extId });
  await gotoApp(page);

  await expect(page.getByText('No upcoming departures.')).toBeVisible();
});

test('surfaces a departure-board error', async ({ page }) => {
  await mockApi(page, { departureBoard: { httpStatus: 500 } });
  await seedStore(page, { selectedExtId: SORGENFRI.extId });
  await gotoApp(page);

  await expect(page.getByText(/HTTP 500/)).toBeVisible();
});
