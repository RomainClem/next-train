import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';

import { extractStops, nearbyStops, normaliseDeparture, parseDateTime, searchStops } from '../api';
import type { Departure, StopLocation } from '../types';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeDeparture(overrides: Partial<Departure> = {}): Departure {
  return {
    name: 'Re 2210',
    direction: 'København H',
    date: '2026-07-22',
    time: '14:05:00',
    ...overrides,
  };
}

describe('parseDateTime', () => {
  it('parses a HAFAS local date + time into a local Date', () => {
    const d = parseDateTime('2026-07-22', '14:05:30');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // July — JS months are 0-indexed
    expect(d.getDate()).toBe(22);
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(5);
    expect(d.getSeconds()).toBe(30);
  });

  it('returns an Invalid Date for non-numeric input', () => {
    // Note: Number('') is 0, so empty strings do NOT produce an Invalid Date —
    // only genuinely non-numeric segments do. normaliseDeparture guards the
    // resulting NaN delay with Number.isFinite.
    expect(Number.isNaN(parseDateTime('not-a-date', '14:05:00').getTime())).toBe(true);
  });
});

describe('normaliseDeparture', () => {
  it('uses the scheduled time and zero delay when no realtime fields are present', () => {
    const n = normaliseDeparture(makeDeparture(), 0);
    expect(n.when.getTime()).toBe(n.scheduled.getTime());
    expect(n.delayMinutes).toBe(0);
    expect(n.cancelled).toBe(false);
  });

  it('computes a positive delay from rtDate/rtTime', () => {
    const n = normaliseDeparture(makeDeparture({ rtDate: '2026-07-22', rtTime: '14:10:00' }), 0);
    expect(n.delayMinutes).toBe(5);
    expect(n.when.getHours()).toBe(14);
    expect(n.when.getMinutes()).toBe(10);
  });

  it('computes a negative delay for an early departure', () => {
    const n = normaliseDeparture(makeDeparture({ rtDate: '2026-07-22', rtTime: '14:02:00' }), 0);
    expect(n.delayMinutes).toBe(-3);
  });

  it('computes the delay across midnight using the realtime date', () => {
    const n = normaliseDeparture(
      makeDeparture({
        date: '2026-07-22',
        time: '23:55:00',
        rtDate: '2026-07-23',
        rtTime: '00:10:00',
      }),
      0,
    );
    expect(n.delayMinutes).toBe(15);
  });

  it('falls back to zero delay when the date is malformed', () => {
    const n = normaliseDeparture(
      makeDeparture({ date: 'garbage', rtDate: '2026-07-22', rtTime: '14:10:00' }),
      0,
    );
    expect(n.delayMinutes).toBe(0);
  });

  it('prefers the realtime track over the scheduled one', () => {
    const n = normaliseDeparture(makeDeparture({ track: '3', rtTrack: '5' }), 0);
    expect(n.track).toBe('5');
    const m = normaliseDeparture(makeDeparture({ track: '3' }), 0);
    expect(m.track).toBe('3');
  });

  it('coerces cancelled to a boolean and defaults direction to an empty string', () => {
    const n = normaliseDeparture(makeDeparture({ cancelled: true, direction: undefined }), 0);
    expect(n.cancelled).toBe(true);
    expect(n.direction).toBe('');
  });

  it('includes the index in the key so identical departures stay distinct', () => {
    const dep = makeDeparture();
    expect(normaliseDeparture(dep, 0).key).not.toBe(normaliseDeparture(dep, 1).key);
  });
});

describe('extractStops', () => {
  const stop = (id: string): StopLocation => ({ id, extId: `ext-${id}`, name: `Stop ${id}` });

  it('reads a flat StopLocation array', () => {
    expect(extractStops({ StopLocation: [stop('1'), stop('2')] })).toHaveLength(2);
  });

  it('unwraps stopLocationOrCoordLocation entries and drops non-stop entries', () => {
    const stops = extractStops({
      stopLocationOrCoordLocation: [{ StopLocation: stop('1') }, {}, { StopLocation: stop('2') }],
    });
    expect(stops.map((s) => s.id)).toEqual(['1', '2']);
  });

  it('returns an empty array when neither shape is present', () => {
    expect(extractStops({})).toEqual([]);
  });
});

describe('searchStops', () => {
  afterEach(() => {
    mock.restore();
  });

  it('returns [] for blank input without hitting the network', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch');
    expect(await searchStops('   ')).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('nearbyStops', () => {
  afterEach(() => {
    mock.restore();
  });

  it('sorts stops by distance ascending', async () => {
    const stops: StopLocation[] = [
      { id: '1', extId: 'e1', name: 'Far', dist: 900 },
      { id: '2', extId: 'e2', name: 'Near', dist: 50 },
      { id: '3', extId: 'e3', name: 'Mid', dist: 400 },
    ];
    spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ StopLocation: stops }));
    const result = await nearbyStops(55.67, 12.56);
    expect(result.map((s) => s.name)).toEqual(['Near', 'Mid', 'Far']);
  });
});
