import { expect, type Page } from '@playwright/test';

import { departureResponse, nearbyResponse, searchResponse } from './fixtures';

/**
 * Shared E2E helpers: network mocking for the Rejseplanen API, store seeding
 * (via the zustand-persist localStorage key), and small navigation utilities.
 */

type Json = Record<string, unknown>;

/** Either a JSON body (200) or an explicit HTTP status with optional body. */
export type ApiReply = Json | { httpStatus: number; body?: Json };

export interface ApiMocks {
  /** `location.name` reply. Defaults to the "sorgenfri" fixture. */
  search?: ApiReply;
  /** `location.nearbystops` reply. Defaults to the nearby fixture. */
  nearby?: ApiReply;
  /** `departureBoard` reply. Defaults to the departures fixture. */
  departureBoard?: ApiReply;
}

function isStatusReply(r: ApiReply): r is { httpStatus: number; body?: Json } {
  return typeof r === 'object' && r !== null && 'httpStatus' in r;
}

/**
 * Intercept every call to the Rejseplanen API and fulfill it locally.
 * The `access-control-allow-origin` header is required because the browser
 * still enforces CORS on the (cross-origin) mocked response.
 */
export async function mockApi(page: Page, mocks: ApiMocks = {}): Promise<void> {
  const replies: Record<string, ApiReply> = {
    'location.name': mocks.search ?? searchResponse,
    'location.nearbystops': mocks.nearby ?? nearbyResponse,
    departureBoard: mocks.departureBoard ?? departureResponse,
  };

  await page.route(/rejseplanen\.dk\/api\//, async (route) => {
    const url = route.request().url();
    const endpoint = Object.keys(replies).find((e) => url.includes(`/${e}`)) ?? '';
    const reply = replies[endpoint] ?? {};

    const status = isStatusReply(reply) ? reply.httpStatus : 200;
    const body = isStatusReply(reply) ? (reply.body ?? {}) : reply;

    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(body),
    });
  });
}

export interface SeededStop {
  id: string;
  extId: string;
  name: string;
}

/**
 * Pre-populate the persisted zustand store (favorites / selected stop) by
 * writing the localStorage key BEFORE the app boots. Must be called before
 * `gotoApp`.
 */
export async function seedStore(
  page: Page,
  state: { favorites?: SeededStop[]; selectedExtId?: string | null },
): Promise<void> {
  const payload = {
    favorites: state.favorites ?? [],
    selectedExtId: state.selectedExtId ?? null,
  };
  await page.addInitScript((s) => {
    window.localStorage.setItem('next-train-stops', JSON.stringify({ state: s, version: 0 }));
  }, payload);
}

/** Navigate to a route and wait until the tab bar is interactive. */
export async function gotoApp(page: Page, path = '/'): Promise<void> {
  await page.goto(path);
  await expect(page.getByTestId('tab-search')).toBeVisible();
}

/** Click a bottom-tab button by its screen. */
export async function openTab(
  page: Page,
  tab: 'departures' | 'search' | 'favorites',
): Promise<void> {
  await page.getByTestId(`tab-${tab}`).click();
}
