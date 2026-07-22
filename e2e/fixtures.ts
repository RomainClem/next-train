/**
 * Canned Rejseplanen API 2.0 responses used to mock the network in E2E tests.
 * Shapes mirror the live HAFAS ReST JSON the app parses in
 * `services/rejseplanen/api.ts` (`extractStops` / `departureBoardNormalised`).
 */

/** `location.name` — autocomplete search for "sorgenfri". */
export const searchResponse = {
  stopLocationOrCoordLocation: [
    {
      StopLocation: {
        id: 'A=1@O=Sorgenfri St.@X=12500000@Y=55790000@U=86@L=8600858@',
        extId: '8600858',
        name: 'Sorgenfri St.',
        lat: 55.790123,
        lon: 12.500456,
        weight: 19750,
      },
    },
    {
      StopLocation: {
        id: 'A=1@O=Sorgenfri St. (Metro)@L=8600859@',
        extId: '8600859',
        name: 'Sorgenfri St. (Bus)',
        lat: 55.790501,
        lon: 12.501001,
        weight: 12010,
      },
    },
  ],
};

/** A search that legitimately matches nothing. */
export const emptySearchResponse = {
  stopLocationOrCoordLocation: [],
};

/** `location.nearbystops` — stops around a coordinate, with distances. */
export const nearbyResponse = {
  stopLocationOrCoordLocation: [
    {
      StopLocation: {
        id: 'A=1@O=Nørreport St.@L=8600646@',
        extId: '8600646',
        name: 'Nørreport St.',
        lat: 55.683,
        lon: 12.571,
        dist: 120,
      },
    },
    {
      StopLocation: {
        id: 'A=1@O=Kongens Nytorv@L=8600858@',
        extId: '8600703',
        name: 'Kongens Nytorv (Metro)',
        lat: 55.68,
        lon: 12.585,
        dist: 640,
      },
    },
  ],
};

/** `departureBoard` — a couple of upcoming departures. */
export const departureResponse = {
  Departure: [
    {
      name: 'Re 4250',
      type: 'ST',
      stop: 'Sorgenfri St.',
      stopExtId: '8600858',
      direction: 'København H',
      date: '2026-07-22',
      time: '23:59:00',
      track: '1',
      Product: [{ name: 'Re 4250', catOutL: 'Regionaltog' }],
    },
    {
      name: 'Bus 190',
      type: 'BUS',
      stop: 'Sorgenfri St.',
      stopExtId: '8600858',
      direction: 'Holte St.',
      date: '2026-07-22',
      time: '23:58:00',
      rtDate: '2026-07-22',
      rtTime: '23:58:00',
      Product: [{ name: 'Bus 190', catOutL: 'Bus' }],
    },
  ],
};

/** A stop with no scheduled departures. */
export const emptyDepartureResponse = {
  Departure: [],
};
