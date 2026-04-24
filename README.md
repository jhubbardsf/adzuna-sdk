# adzuna-sdk

A fully type-safe TypeScript SDK for the [Adzuna API](https://api.adzuna.com/v1/doc/), built on [Ky](https://github.com/sindresorhus/ky) and designed for [Bun](https://bun.sh) (also runs on Node 18+).

## Features

- **Type-safe everywhere.** Request options, responses, and error bodies are all typed against the Adzuna OpenAPI spec.
- **Ergonomic surface.** `adzuna.jobs.search({ country: 'gb', page: 1, fullTime: true })` instead of `"1"` flag strings and snake_case field names.
- **Auth handled once.** Pass `appId` and `appKey` to the constructor; every request gets them injected automatically.
- **Retries built in.** Retries on 408, 429, 500, 502, 503, 504 via Ky, with configurable limits.
- **Const-object enums.** `Country.GB` for autocomplete, `'gb'` for terseness, both type-check.
- **ESM-only, tree-shakeable.** No runtime overhead beyond Ky.

## Install

```bash
bun add adzuna-sdk
# or
npm install adzuna-sdk
# or
pnpm add adzuna-sdk
```

## Getting API credentials

Sign up at [developer.adzuna.com](https://developer.adzuna.com/signup) to get your `app_id` and `app_key`. The free tier allows 25 calls per minute and 250 per day.

## Quick start

```ts
import { AdzunaClient, Country, SortBy } from 'adzuna-sdk';

const adzuna = new AdzunaClient({
  appId: process.env.ADZUNA_APP_ID!,
  appKey: process.env.ADZUNA_APP_KEY!,
});

const { count, results } = await adzuna.jobs.search({
  country: Country.GB,
  page: 1,
  what: 'typescript',
  where: 'London',
  fullTime: true,
  sortBy: SortBy.Date,
  salaryMin: 60_000,
});

console.log(`${count} matching jobs`);
for (const job of results) {
  console.log(`${job.title} at ${job.company?.display_name} (${job.salary_min}-${job.salary_max})`);
}
```

## API reference

The client exposes `adzuna.jobs.*` for all job-related endpoints and a top-level `adzuna.version()`.

### `new AdzunaClient(options)`

| Option     | Type          | Default                               | Description                                 |
| ---------- | ------------- | ------------------------------------- | ------------------------------------------- |
| `appId`    | `string`      | **required**                          | Your Adzuna application ID.                 |
| `appKey`   | `string`      | **required**                          | Your Adzuna application key.                |
| `baseUrl`  | `string`      | `https://api.adzuna.com/v1/api`       | Override the API base URL.                  |
| `retry`    | `number`      | `2`                                   | Retry attempts for transient failures.      |
| `timeout`  | `number`      | `30_000`                              | Request timeout in milliseconds.            |
| `fetch`    | `typeof fetch`| `globalThis.fetch`                    | Custom fetch implementation (tests, proxies, etc.). |

### `adzuna.jobs.search(options)`

Search the Adzuna job database.

```ts
const res = await adzuna.jobs.search({
  country: 'gb',
  page: 1,
  resultsPerPage: 20,
  what: 'react',
  whatAnd: 'typescript',
  whatOr: 'remote hybrid',
  whatExclude: 'senior manager',
  titleOnly: 'engineer',
  where: 'Manchester',
  distance: 25,
  maxDaysOld: 7,
  category: 'it-jobs',
  sortBy: 'date',
  sortDir: 'down',
  salaryMin: 50_000,
  salaryMax: 120_000,
  salaryIncludeUnknown: true,
  fullTime: true,
  permanent: true,
  company: 'acme-corp',
  // location0..location7 also accepted
});
```

Returns [`JobSearchResults`](https://api.adzuna.com/v1/doc/Adzuna::API::Response::JobSearchResults).

### `adzuna.jobs.categories(options)`

List available job categories for a country.

```ts
const { results } = await adzuna.jobs.categories({ country: 'gb' });
// results: Array<{ tag: string; label: string }>
```

### `adzuna.jobs.histogram(options)`

Distribution of live jobs by salary.

```ts
const { histogram } = await adzuna.jobs.histogram({
  country: 'gb',
  what: 'engineer',
  category: 'it-jobs',
});
// histogram: Record<salary, jobCount>
// e.g. { '30000': 120, '40000': 80, '50000': 45 }
```

### `adzuna.jobs.topCompanies(options)`

Leaderboard of employers matching a query.

```ts
const { leaderboard } = await adzuna.jobs.topCompanies({
  country: 'us',
  what: 'python',
  location0: 'US',
  location1: 'California',
});
// leaderboard: Array<{ display_name, canonical_name, count, average_salary }>
```

### `adzuna.jobs.geodata(options)`

Live job counts broken down by sub-location.

```ts
const { locations } = await adzuna.jobs.geodata({
  country: 'gb',
  category: 'it-jobs',
  location0: 'UK',
});
// locations: Array<{ count, location: { display_name, area } }>
```

### `adzuna.jobs.history(options)`

Historical average salary by month. Requires a location with 20+ jobs.

```ts
const { month } = await adzuna.jobs.history({
  country: 'gb',
  category: 'it-jobs',
  months: 12,
});
// month: Record<'YYYY-MM', averageSalary>
// e.g. { '2025-08': 52000, '2025-09': 53100 }
```

### `adzuna.version()`

Returns the current API version.

```ts
const { api_version, software_version } = await adzuna.version();
```

## Constants

Each enum is exposed as a const object (for discoverability) and a type (for parameter checking). You can pass either the named constant or a raw string literal.

```ts
import { Country, SortBy, SortDir, ContractTime, ContractType } from 'adzuna-sdk';

Country.GB;     // 'gb' — autocomplete friendly
Country.US;     // 'us'
// ...all 19 supported countries

SortBy.Default | SortBy.Hybrid | SortBy.Date | SortBy.Salary | SortBy.Relevance;
SortDir.Up | SortDir.Down;

// Response-side unions (useful for narrowing):
ContractTime.FullTime | ContractTime.PartTime;
ContractType.Permanent | ContractType.Contract;
```

Both of these type-check identically:

```ts
adzuna.jobs.search({ country: Country.GB, page: 1 });
adzuna.jobs.search({ country: 'gb', page: 1 });
```

## Boolean flags

The Adzuna API uses string `"1"` values for several filter flags. The SDK accepts `boolean` and handles translation:

| SDK option              | Wire format            |
| ----------------------- | ---------------------- |
| `fullTime: true`        | `full_time=1`          |
| `partTime: true`        | `part_time=1`          |
| `contract: true`        | `contract=1`           |
| `permanent: true`       | `permanent=1`          |
| `salaryIncludeUnknown: true` | `salary_include_unknown=1` |
| `<any flag>: false`     | omitted from request   |

## Error handling

The SDK throws `AdzunaError` for any 4xx/5xx response whose body matches the documented Exception schema. Other failures (network, parse errors) throw the underlying Ky `HTTPError` or fetch error.

```ts
import { AdzunaClient, AdzunaError } from 'adzuna-sdk';

try {
  await adzuna.jobs.search({ country: 'gb', page: 1 });
} catch (err) {
  if (err instanceof AdzunaError) {
    console.error(`[${err.status}] ${err.exception}: ${err.display}`);
    console.error(`See: ${err.doc}`);
  } else {
    throw err;
  }
}
```

`AdzunaError` shape:

```ts
class AdzunaError extends Error {
  readonly status: number;        // HTTP status
  readonly exception: string;     // e.g. 'AUTH_FAILED'
  readonly display: string | undefined;  // human-readable message
  readonly doc: string | undefined;      // link to Adzuna docs
}
```

## Retries and timeout

Retries are handled by Ky and default to 2 attempts on 408, 429, 500, 502, 503, 504.

```ts
new AdzunaClient({
  appId,
  appKey,
  retry: 5,        // more aggressive retries
  timeout: 10_000, // fail fast
});
```

To disable retries entirely, pass `retry: 0`.

## Custom fetch (testing, proxies, instrumentation)

The `fetch` option accepts any fetch-compatible function. Useful for injecting a mock in tests or routing through a proxy.

```ts
const adzuna = new AdzunaClient({
  appId,
  appKey,
  fetch: async (input, init) => {
    console.log('→', input);
    const res = await globalThis.fetch(input, init);
    console.log('←', res.status);
    return res;
  },
});
```

## TypeScript types

All response types are exported from the package root:

```ts
import type {
  Job,
  JobSearchResults,
  Category,
  Categories,
  SalaryHistogram,
  TopCompanies,
  JobGeoData,
  HistoricalSalary,
  Version,
  Location,
  Company,
  // and option types:
  SearchOptions,
  CategoriesOptions,
  HistogramOptions,
  TopCompaniesOptions,
  GeodataOptions,
  HistoryOptions,
} from 'adzuna-sdk';
```

If you need the raw OpenAPI types (e.g. to write your own wrapper), they're re-exported as `components`, `operations`, and `paths`.

## Development

```bash
bun install          # install deps
bun run generate     # regenerate src/schema.ts from adzuna_swagger.json
bun run typecheck    # tsc --noEmit
bun test             # run the test suite
bun run build        # emit dist/
```

The schema is generated from `adzuna_swagger.json` via [`openapi-typescript`](https://github.com/openapi-ts/openapi-typescript). Regenerate whenever the swagger changes; the resulting `src/schema.ts` is checked in so consumers don't need the generator as a runtime dependency.

## License

MIT.
