import Constants from 'expo-constants';

/**
 * Thin fetch wrapper for the Rejseplanen Labs API 2.0.
 *
 * Injects the `accessId` and `format=json`, and turns HAFAS `errorCode`
 * responses (which arrive with HTTP 200) into thrown errors.
 */

const extra = Constants.expoConfig?.extra ?? {};
const ACCESS_ID: string = extra.rejseplanenAccessId ?? '';
const BASE_URL: string = extra.rejseplanenBaseUrl ?? 'https://www.rejseplanen.dk/api';

export class RejseplanenError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'RejseplanenError';
  }
}

/**
 * Call a Rejseplanen endpoint (e.g. "departureBoard") with query params.
 * Returns the parsed JSON body typed as `T`.
 */
export async function request<T extends { errorCode?: string; errorText?: string }>(
  endpoint: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  if (!ACCESS_ID) {
    throw new RejseplanenError(
      'Missing REJSEPLANEN_ACCESS_ID. Copy .env.example to .env and set your key.',
    );
  }

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('accessId', ACCESS_ID);
  url.searchParams.set('format', 'json');
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new RejseplanenError(`HTTP ${res.status} calling ${endpoint}`);
  }

  const body = (await res.json()) as T;
  if (body.errorCode) {
    throw new RejseplanenError(body.errorText ?? `API error ${body.errorCode}`, body.errorCode);
  }
  return body;
}
