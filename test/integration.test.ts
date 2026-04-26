import { describe, test, expect } from 'bun:test';

import { AdzunaClient } from '../src/index.js';

const APP_ID = process.env['ADZUNA_APP_ID'];
const APP_KEY = process.env['ADZUNA_APP_KEY'];

const describeIntegration =
  APP_ID && APP_KEY ? describe : describe.skip;

if (!APP_ID || !APP_KEY) {
  // eslint-disable-next-line no-console
  console.log(
    '[integration] ADZUNA_APP_ID / ADZUNA_APP_KEY not set, skipping live API tests.',
  );
}

const client = new AdzunaClient({
  appId: APP_ID ?? 'placeholder',
  appKey: APP_KEY ?? 'placeholder',
  timeout: 60_000,
});

const TEST_TIMEOUT_MS = 65_000;

describeIntegration('integration: live Adzuna API', () => {
  test(
    'version() returns api_version and software_version',
    async () => {
      const v = await client.version();
      expect(typeof v.api_version).toBe('number');
      expect(typeof v.software_version).toBe('string');
      expect(v.software_version.length).toBeGreaterThan(0);
    },
    TEST_TIMEOUT_MS,
  );

  test(
    'jobs.categories returns non-empty results with tag and label',
    async () => {
      const res = await client.jobs.categories({ country: 'gb' });
      expect(Array.isArray(res.results)).toBe(true);
      expect(res.results.length).toBeGreaterThan(0);
      const first = res.results[0]!;
      expect(typeof first.tag).toBe('string');
      expect(typeof first.label).toBe('string');
    },
    TEST_TIMEOUT_MS,
  );

  test(
    'jobs.search returns count and an array of results',
    async () => {
      const res = await client.jobs.search({
        country: 'gb',
        page: 1,
        what: 'developer',
        resultsPerPage: 5,
      });
      expect(typeof res.count).toBe('number');
      expect(res.count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(res.results)).toBe(true);
      if (res.results.length > 0) {
        const job = res.results[0]!;
        expect(typeof job.id).toBe('string');
        expect(typeof job.title).toBe('string');
        expect(typeof job.created).toBe('string');
      }
    },
    TEST_TIMEOUT_MS,
  );

  test(
    'jobs.histogram returns a non-empty salary distribution',
    async () => {
      const res = await client.jobs.histogram({
        country: 'gb',
        what: 'engineer',
      });
      expect(res.histogram).toBeDefined();
      expect(typeof res.histogram).toBe('object');
      const entries = Object.entries(res.histogram ?? {});
      expect(entries.length).toBeGreaterThan(0);
      for (const [salary, count] of entries) {
        expect(salary).toMatch(/^\d+$/);
        expect(typeof count).toBe('number');
      }
    },
    TEST_TIMEOUT_MS,
  );

  test(
    'jobs.topCompanies returns a leaderboard',
    async () => {
      const res = await client.jobs.topCompanies({
        country: 'gb',
        what: 'engineer',
      });
      expect(Array.isArray(res.leaderboard)).toBe(true);
      if ((res.leaderboard ?? []).length > 0) {
        const c = res.leaderboard![0]!;
        expect(typeof c.display_name === 'string' || c.display_name === undefined)
          .toBe(true);
      }
    },
    TEST_TIMEOUT_MS,
  );

  test(
    'jobs.geodata returns locations array',
    async () => {
      // Geodata is genuinely slow — server-side it scans every sub-location
      // within the area you describe. Drilling down to a single county
      // (UK → South East England → Surrey) keeps response time reasonable.
      // The unfiltered "all of GB" call exceeds 60s in many regions.
      const res = await client.jobs.geodata({
        country: 'gb',
        location0: 'UK',
        location1: 'South East England',
        location2: 'Surrey',
      });
      expect(Array.isArray(res.locations)).toBe(true);
    },
    TEST_TIMEOUT_MS,
  );

  test(
    'jobs.history returns monthly salary data',
    async () => {
      const res = await client.jobs.history({ country: 'gb', months: 3 });
      expect(res.month).toBeDefined();
      expect(typeof res.month).toBe('object');
      const months = Object.keys(res.month ?? {});
      expect(months.length).toBeGreaterThan(0);
      for (const m of months) {
        expect(m).toMatch(/^\d{4}-\d{2}$/);
      }
    },
    TEST_TIMEOUT_MS,
  );
});
