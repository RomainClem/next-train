import { request } from './client';
import type {
  Departure,
  DepartureBoardResponse,
  LocationResponse,
  NearbyStopsResponse,
  NormalisedDeparture,
  StopLocation,
} from './types';

/**
 * Typed wrappers around the Rejseplanen endpoints the app uses.
 * See https://labs.rejseplanen.dk for the full API 2.0 reference.
 */

/** Tolerant extraction of stops from either JSON shape the API may return. */
export function extractStops(res: LocationResponse | NearbyStopsResponse): StopLocation[] {
  if (Array.isArray(res.StopLocation)) return res.StopLocation;
  if (Array.isArray(res.stopLocationOrCoordLocation)) {
    return res.stopLocationOrCoordLocation
      .map((entry) => entry.StopLocation)
      .filter((s): s is StopLocation => !!s);
  }
  return [];
}

/** Autocomplete-style stop search by name. */
export async function searchStops(input: string): Promise<StopLocation[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const res = await request<LocationResponse>('location.name', { input: trimmed });
  return extractStops(res);
}

/** Find stops near a GPS coordinate, nearest first. */
export async function nearbyStops(lat: number, lon: number): Promise<StopLocation[]> {
  const res = await request<NearbyStopsResponse>('location.nearbystops', {
    originCoordLat: lat,
    originCoordLong: lon,
    maxNo: 15,
  });
  return extractStops(res).sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));
}

/** Raw departure board for a stop (by extId). */
export async function departureBoard(extId: string): Promise<Departure[]> {
  const res = await request<DepartureBoardResponse>('departureBoard', {
    id: extId,
    duration: 120,
    maxJourneys: 30,
  });
  return res.Departure ?? [];
}

/** Parse HAFAS "YYYY-MM-DD" + "HH:MM:SS" (local) into a Date. */
export function parseDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm, ss] = time.split(':').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, ss ?? 0);
}

/** Normalise a raw departure: effective time, delay, cancellation. */
export function normaliseDeparture(dep: Departure, index: number): NormalisedDeparture {
  const scheduled = parseDateTime(dep.date, dep.time);
  const when = dep.rtDate && dep.rtTime ? parseDateTime(dep.rtDate, dep.rtTime) : scheduled;
  const delayMinutes = Math.round((when.getTime() - scheduled.getTime()) / 60000);
  return {
    key: `${dep.name}-${dep.date}-${dep.time}-${index}`,
    name: dep.name,
    direction: dep.direction ?? '',
    when,
    scheduled,
    delayMinutes: Number.isFinite(delayMinutes) ? delayMinutes : 0,
    track: dep.rtTrack ?? dep.track,
    cancelled: !!dep.cancelled,
  };
}

/** Departure board, normalised and sorted by effective time. */
export async function departureBoardNormalised(extId: string): Promise<NormalisedDeparture[]> {
  const raw = await departureBoard(extId);
  return raw.map(normaliseDeparture).sort((a, b) => a.when.getTime() - b.when.getTime());
}
