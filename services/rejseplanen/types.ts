/**
 * Minimal TypeScript models for the Rejseplanen Labs API 2.0 (HAFAS ReST).
 *
 * The full schema (`rejseplanens-api.xml`, HAFAS proxy v2.53) is large; we only
 * model the fields the app actually consumes. HAFAS JSON dates/times are local
 * strings: date = "YYYY-MM-DD", time = "HH:MM:SS". Realtime values live in the
 * `rt*` fields and should be preferred when present.
 *
 * Kept framework-agnostic (plain types) so the future Wear OS bridge can reuse them.
 */

/** A stop/station or address returned by location.* services. */
export interface StopLocation {
  /** ID to use as `id`/`originId`/`destId` in follow-up requests. */
  id: string;
  /** External (stable) ID for the stop. */
  extId: string;
  name: string;
  lat?: number;
  lon?: number;
  /** Distance in metres — only present in nearbystops responses. */
  dist?: number;
  /** Match quality [0-100] — only present in location.name responses. */
  weight?: number;
}

/** Transport product (line) attached to a departure. */
export interface Product {
  name?: string;
  line?: string;
  catOut?: string;
  catOutL?: string;
  displayNumber?: string;
}

/** A single departure from a stop's departure board. */
export interface Departure {
  /** Display name of the service, e.g. "Re 2210" or "Bus 5C". */
  name: string;
  type?: string;
  /** Head sign / final destination text. */
  direction?: string;
  /** Scheduled date "YYYY-MM-DD". */
  date: string;
  /** Scheduled time "HH:MM:SS". */
  time: string;
  /** Realtime date, if available. */
  rtDate?: string;
  /** Realtime time, if available — prefer over `time` when present. */
  rtTime?: string;
  /** Scheduled platform/track. */
  track?: string;
  /** Realtime platform/track. */
  rtTrack?: string;
  cancelled?: boolean;
  partCancelled?: boolean;
  reachable?: boolean;
  stop?: string;
  stopExtId?: string;
  Product?: Product[];
}

/** Raw common error fields present on every response. */
interface CommonResponse {
  errorCode?: string;
  errorText?: string;
}

/** Wrapper entry in the mixed stop/coord list some responses return. */
interface StopLocationEntry {
  StopLocation?: StopLocation;
}

export interface LocationResponse extends CommonResponse {
  stopLocationOrCoordLocation?: StopLocationEntry[];
  // Some deployments return a flat `StopLocation` array instead.
  StopLocation?: StopLocation[];
}

export interface NearbyStopsResponse extends CommonResponse {
  stopLocationOrCoordLocation?: StopLocationEntry[];
  StopLocation?: StopLocation[];
}

export interface DepartureBoardResponse extends CommonResponse {
  Departure?: Departure[];
}

/** App-facing, normalised departure with computed effective time. */
export interface NormalisedDeparture {
  key: string;
  name: string;
  direction: string;
  /** Effective departure as a Date (realtime when available, else scheduled). */
  when: Date;
  /** Scheduled departure. */
  scheduled: Date;
  /** Delay in whole minutes (effective − scheduled); 0 when on time/unknown. */
  delayMinutes: number;
  track?: string;
  cancelled: boolean;
}
