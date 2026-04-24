import { describe, test, expect } from 'bun:test';

import { AdzunaClient, AdzunaError, Country, SortBy } from '../src/index.js';

interface CapturedRequest {
  method: string;
  url: URL;
}

function makeFetch(
  respond: (req: Request) => Response | Promise<Response>,
  captured: CapturedRequest[] = [],
): typeof fetch {
  return (async (input, init) => {
    const request = new Request(input as RequestInfo, init);
    captured.push({ method: request.method, url: new URL(request.url) });
    return respond(request);
  }) as typeof fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('AdzunaClient', () => {
  test('requires appId and appKey', () => {
    expect(() => new AdzunaClient({ appId: '', appKey: 'k' })).toThrow();
    expect(() => new AdzunaClient({ appId: 'i', appKey: '' })).toThrow();
  });
});

describe('jobs.search', () => {
  test('builds path with country + page and injects auth params', async () => {
    const captured: CapturedRequest[] = [];
    const client = new AdzunaClient({
      appId: 'my-id',
      appKey: 'my-key',
      fetch: makeFetch(() => jsonResponse({ count: 0, results: [] }), captured),
    });

    await client.jobs.search({ country: Country.GB, page: 3, what: 'developer' });

    expect(captured).toHaveLength(1);
    const req = captured[0]!;
    expect(req.method).toBe('GET');
    expect(req.url.pathname).toBe('/v1/api/jobs/gb/search/3');
    expect(req.url.searchParams.get('app_id')).toBe('my-id');
    expect(req.url.searchParams.get('app_key')).toBe('my-key');
    expect(req.url.searchParams.get('what')).toBe('developer');
  });

  test('camelCases options into snake_case query params', async () => {
    const captured: CapturedRequest[] = [];
    const client = new AdzunaClient({
      appId: 'id',
      appKey: 'key',
      fetch: makeFetch(() => jsonResponse({ count: 0, results: [] }), captured),
    });

    await client.jobs.search({
      country: 'gb',
      page: 1,
      resultsPerPage: 20,
      whatAnd: 'python django',
      whatOr: 'remote hybrid',
      whatExclude: 'senior',
      titleOnly: 'engineer',
      maxDaysOld: 7,
      sortBy: SortBy.Date,
      salaryMin: 50000,
    });

    const params = captured[0]!.url.searchParams;
    expect(params.get('results_per_page')).toBe('20');
    expect(params.get('what_and')).toBe('python django');
    expect(params.get('what_or')).toBe('remote hybrid');
    expect(params.get('what_exclude')).toBe('senior');
    expect(params.get('title_only')).toBe('engineer');
    expect(params.get('max_days_old')).toBe('7');
    expect(params.get('sort_by')).toBe('date');
    expect(params.get('salary_min')).toBe('50000');
  });

  test('translates boolean flags to "1" when true and omits when false/undefined', async () => {
    const captured: CapturedRequest[] = [];
    const client = new AdzunaClient({
      appId: 'id',
      appKey: 'key',
      fetch: makeFetch(() => jsonResponse({ count: 0, results: [] }), captured),
    });

    await client.jobs.search({
      country: 'us',
      page: 1,
      fullTime: true,
      partTime: false,
      permanent: true,
      salaryIncludeUnknown: true,
    });

    const params = captured[0]!.url.searchParams;
    expect(params.get('full_time')).toBe('1');
    expect(params.get('permanent')).toBe('1');
    expect(params.get('salary_include_unknown')).toBe('1');
    expect(params.has('part_time')).toBe(false);
    expect(params.has('contract')).toBe(false);
  });

  test('returns typed JobSearchResults body', async () => {
    const client = new AdzunaClient({
      appId: 'id',
      appKey: 'key',
      fetch: makeFetch(() =>
        jsonResponse({
          count: 1,
          mean: 55000,
          results: [
            {
              id: 'abc',
              title: 'Engineer',
              description: '...',
              created: '2026-01-01T00:00:00Z',
              salary_min: 50000,
              salary_max: 60000,
              contract_time: 'full_time',
              contract_type: 'permanent',
            },
          ],
        }),
      ),
    });

    const res = await client.jobs.search({ country: 'gb', page: 1 });
    expect(res.count).toBe(1);
    expect(res.results[0]?.title).toBe('Engineer');
    expect(res.results[0]?.contract_time).toBe('full_time');
  });

  test('maps 4xx error body to AdzunaError', async () => {
    const client = new AdzunaClient({
      appId: 'id',
      appKey: 'key',
      retry: 0,
      fetch: makeFetch(() =>
        jsonResponse(
          {
            exception: 'AUTH_FAILED',
            display: 'Authorisation failed',
            doc: 'https://api.adzuna.com/v1/doc/',
          },
          410,
        ),
      ),
    });

    await expect(client.jobs.search({ country: 'gb', page: 1 })).rejects.toBeInstanceOf(
      AdzunaError,
    );

    try {
      await client.jobs.search({ country: 'gb', page: 1 });
    } catch (err) {
      expect(err).toBeInstanceOf(AdzunaError);
      const e = err as AdzunaError;
      expect(e.status).toBe(410);
      expect(e.exception).toBe('AUTH_FAILED');
      expect(e.message).toBe('Authorisation failed');
    }
  });
});

describe('jobs.categories', () => {
  test('hits /jobs/{country}/categories', async () => {
    const captured: CapturedRequest[] = [];
    const client = new AdzunaClient({
      appId: 'id',
      appKey: 'key',
      fetch: makeFetch(
        () => jsonResponse({ results: [{ tag: 'it-jobs', label: 'IT Jobs' }] }),
        captured,
      ),
    });

    const res = await client.jobs.categories({ country: 'us' });
    expect(captured[0]!.url.pathname).toBe('/v1/api/jobs/us/categories');
    expect(res.results[0]?.tag).toBe('it-jobs');
  });
});

describe('jobs.histogram', () => {
  test('hits /jobs/{country}/histogram with filters', async () => {
    const captured: CapturedRequest[] = [];
    const client = new AdzunaClient({
      appId: 'id',
      appKey: 'key',
      fetch: makeFetch(
        () => jsonResponse({ histogram: { '30000': 12, '40000': 8 } }),
        captured,
      ),
    });

    const res = await client.jobs.histogram({
      country: 'gb',
      what: 'engineer',
      category: 'it-jobs',
      location0: 'UK',
      location1: 'South East England',
    });

    const url = captured[0]!.url;
    expect(url.pathname).toBe('/v1/api/jobs/gb/histogram');
    expect(url.searchParams.get('what')).toBe('engineer');
    expect(url.searchParams.get('category')).toBe('it-jobs');
    expect(url.searchParams.get('location0')).toBe('UK');
    expect(url.searchParams.get('location1')).toBe('South East England');
    expect(res.histogram?.['30000']).toBe(12);
  });
});

describe('jobs.topCompanies', () => {
  test('hits /jobs/{country}/top_companies with what filter', async () => {
    const captured: CapturedRequest[] = [];
    const client = new AdzunaClient({
      appId: 'id',
      appKey: 'key',
      fetch: makeFetch(
        () =>
          jsonResponse({
            leaderboard: [{ display_name: 'Acme', count: 42, average_salary: 55000 }],
          }),
        captured,
      ),
    });

    const res = await client.jobs.topCompanies({ country: 'us', what: 'python' });
    expect(captured[0]!.url.pathname).toBe('/v1/api/jobs/us/top_companies');
    expect(captured[0]!.url.searchParams.get('what')).toBe('python');
    expect(res.leaderboard?.[0]?.display_name).toBe('Acme');
  });
});

describe('jobs.geodata', () => {
  test('hits /jobs/{country}/geodata with category', async () => {
    const captured: CapturedRequest[] = [];
    const client = new AdzunaClient({
      appId: 'id',
      appKey: 'key',
      fetch: makeFetch(
        () =>
          jsonResponse({
            locations: [{ count: 100, location: { display_name: 'London' } }],
          }),
        captured,
      ),
    });

    const res = await client.jobs.geodata({ country: 'gb', category: 'it-jobs' });
    expect(captured[0]!.url.pathname).toBe('/v1/api/jobs/gb/geodata');
    expect(captured[0]!.url.searchParams.get('category')).toBe('it-jobs');
    expect(res.locations?.[0]?.count).toBe(100);
  });
});

describe('jobs.history', () => {
  test('hits /jobs/{country}/history with months', async () => {
    const captured: CapturedRequest[] = [];
    const client = new AdzunaClient({
      appId: 'id',
      appKey: 'key',
      fetch: makeFetch(
        () => jsonResponse({ month: { '2026-01': 52000, '2026-02': 53500 } }),
        captured,
      ),
    });

    const res = await client.jobs.history({ country: 'gb', months: 6 });
    expect(captured[0]!.url.pathname).toBe('/v1/api/jobs/gb/history');
    expect(captured[0]!.url.searchParams.get('months')).toBe('6');
    expect(res.month?.['2026-01']).toBe(52000);
  });
});

describe('version', () => {
  test('hits /version with auth params', async () => {
    const captured: CapturedRequest[] = [];
    const client = new AdzunaClient({
      appId: 'id',
      appKey: 'key',
      fetch: makeFetch(
        () => jsonResponse({ api_version: 1, software_version: '1.0.0' }),
        captured,
      ),
    });

    const v = await client.version();
    expect(captured[0]!.url.pathname).toBe('/v1/api/version');
    expect(captured[0]!.url.searchParams.get('app_id')).toBe('id');
    expect(v.api_version).toBe(1);
  });
});
