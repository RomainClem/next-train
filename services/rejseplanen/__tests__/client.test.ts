import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';

import { RejseplanenError, request } from '../client';

// The access ID / base URL come from the expo-constants mock in test/setup.ts
// (client.ts snapshots them at import time).
const BASE_URL = 'https://api.test.local/api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockFetch(response: Response) {
  return spyOn(globalThis, 'fetch').mockResolvedValue(response);
}

function requestedUrl(fetchSpy: ReturnType<typeof mockFetch>): string {
  return String(fetchSpy.mock.calls[0][0]);
}

describe('request', () => {
  afterEach(() => {
    mock.restore();
  });

  it('calls the endpoint with accessId, format=json and the given params', async () => {
    const fetchSpy = mockFetch(jsonResponse({ ok: true }));
    const body = await request<{ ok?: boolean; errorCode?: string; errorText?: string }>(
      'departureBoard',
      { id: '8600626', duration: 120 },
    );
    expect(body.ok).toBe(true);

    const url = requestedUrl(fetchSpy);
    expect(url.startsWith(`${BASE_URL}/departureBoard?`)).toBe(true);
    expect(url).toContain('accessId=test-access-id');
    expect(url).toContain('format=json');
    expect(url).toContain('id=8600626');
    expect(url).toContain('duration=120');
  });

  it('omits undefined and empty-string params', async () => {
    const fetchSpy = mockFetch(jsonResponse({}));
    await request('location.name', { input: 'valby', empty: '', missing: undefined });

    const url = requestedUrl(fetchSpy);
    expect(url).toContain('input=valby');
    expect(url).not.toContain('empty=');
    expect(url).not.toContain('missing=');
  });

  it('URL-encodes param values', async () => {
    const fetchSpy = mockFetch(jsonResponse({}));
    await request('location.name', { input: 'københavn h & co' });

    expect(requestedUrl(fetchSpy)).toContain(`input=${encodeURIComponent('københavn h & co')}`);
  });

  it('throws a RejseplanenError on a non-OK HTTP status', async () => {
    mockFetch(jsonResponse({}, 500));
    const err = await request('departureBoard', {}).catch((e) => e);
    expect(err).toBeInstanceOf(RejseplanenError);
    expect((err as RejseplanenError).message).toBe('HTTP 500 calling departureBoard');
  });

  it('turns a HAFAS errorCode on HTTP 200 into a RejseplanenError with the code', async () => {
    mockFetch(jsonResponse({ errorCode: 'API_AUTH', errorText: 'access denied' }));
    const err = await request('departureBoard', {}).catch((e) => e);
    expect(err).toBeInstanceOf(RejseplanenError);
    expect((err as RejseplanenError).code).toBe('API_AUTH');
    expect((err as RejseplanenError).message).toBe('access denied');
  });

  it('falls back to a generic message when errorText is missing', async () => {
    mockFetch(jsonResponse({ errorCode: 'SVC_PARAM' }));
    const err = await request('departureBoard', {}).catch((e) => e);
    expect((err as RejseplanenError).message).toBe('API error SVC_PARAM');
  });

  // The empty-ACCESS_ID throw path is not testable here: the key is snapshotted
  // at module load from the test/setup.ts mock, which always provides one.
});
