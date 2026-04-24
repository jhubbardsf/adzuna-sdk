import ky, { HTTPError, type KyInstance } from 'ky';

import { AdzunaError, type AdzunaExceptionBody } from './errors.js';
import type { Country, SortBy, SortDir } from './constants.js';
import type { components } from './schema.js';

type Schemas = components['schemas'];

export type Job = Schemas['Job'];
export type JobSearchResults = Schemas['JobSearchResults'];
export type Category = Schemas['Category'];
export type Categories = Schemas['Categories'];
export type SalaryHistogram = Schemas['SalaryHistogram'];
export type TopCompanies = Schemas['TopCompanies'];
export type JobGeoData = Schemas['JobGeoData'];
export type HistoricalSalary = Schemas['HistoricalSalary'];
export type Version = Schemas['Version'];
export type Location = Schemas['Location'];
export type Company = Schemas['Company'];

export interface AdzunaClientOptions {
  appId: string;
  appKey: string;
  baseUrl?: string;
  retry?: number;
  timeout?: number;
  fetch?: typeof fetch;
}

interface LocationFields {
  location0?: string;
  location1?: string;
  location2?: string;
  location3?: string;
  location4?: string;
  location5?: string;
  location6?: string;
  location7?: string;
}

export interface SearchOptions extends LocationFields {
  country: Country;
  page: number;
  resultsPerPage?: number;
  what?: string;
  whatAnd?: string;
  whatPhrase?: string;
  whatOr?: string;
  whatExclude?: string;
  titleOnly?: string;
  where?: string;
  distance?: number;
  maxDaysOld?: number;
  category?: string;
  sortDir?: SortDir;
  sortBy?: SortBy;
  salaryMin?: number;
  salaryMax?: number;
  salaryIncludeUnknown?: boolean;
  fullTime?: boolean;
  partTime?: boolean;
  contract?: boolean;
  permanent?: boolean;
  company?: string;
}

export interface CategoriesOptions {
  country: Country;
}

export interface HistogramOptions extends LocationFields {
  country: Country;
  what?: string;
  category?: string;
}

export interface TopCompaniesOptions extends LocationFields {
  country: Country;
  what?: string;
  category?: string;
}

export interface GeodataOptions extends LocationFields {
  country: Country;
  category?: string;
}

export interface HistoryOptions extends LocationFields {
  country: Country;
  category?: string;
  months?: number;
}

const DEFAULT_BASE_URL = 'https://api.adzuna.com/v1/api';
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

export class AdzunaClient {
  readonly jobs: JobsApi;
  private readonly http: KyInstance;

  constructor(options: AdzunaClientOptions) {
    const {
      appId,
      appKey,
      baseUrl = DEFAULT_BASE_URL,
      retry = 2,
      timeout = 30_000,
      fetch: customFetch,
    } = options;

    if (!appId || !appKey) {
      throw new Error('AdzunaClient requires both appId and appKey.');
    }

    this.http = ky.create({
      prefixUrl: baseUrl,
      timeout,
      retry: { limit: retry, statusCodes: RETRY_STATUS_CODES },
      ...(customFetch ? { fetch: customFetch } : {}),
      hooks: {
        beforeRequest: [
          (request) => {
            const url = new URL(request.url);
            url.searchParams.set('app_id', appId);
            url.searchParams.set('app_key', appKey);
            return new Request(url.toString(), request);
          },
        ],
      },
    });

    this.jobs = new JobsApi(this.http);
  }

  async version(): Promise<Version> {
    return request<Version>(() => this.http.get('version'));
  }
}

export class JobsApi {
  constructor(private readonly http: KyInstance) {}

  async search(options: SearchOptions): Promise<JobSearchResults> {
    const { country, page, ...rest } = options;
    return request<JobSearchResults>(() =>
      this.http.get(`jobs/${country}/search/${page}`, {
        searchParams: toSearchParams(rest),
      }),
    );
  }

  async categories(options: CategoriesOptions): Promise<Categories> {
    return request<Categories>(() =>
      this.http.get(`jobs/${options.country}/categories`),
    );
  }

  async histogram(options: HistogramOptions): Promise<SalaryHistogram> {
    const { country, ...rest } = options;
    return request<SalaryHistogram>(() =>
      this.http.get(`jobs/${country}/histogram`, {
        searchParams: toSearchParams(rest),
      }),
    );
  }

  async topCompanies(options: TopCompaniesOptions): Promise<TopCompanies> {
    const { country, ...rest } = options;
    return request<TopCompanies>(() =>
      this.http.get(`jobs/${country}/top_companies`, {
        searchParams: toSearchParams(rest),
      }),
    );
  }

  async geodata(options: GeodataOptions): Promise<JobGeoData> {
    const { country, ...rest } = options;
    return request<JobGeoData>(() =>
      this.http.get(`jobs/${country}/geodata`, {
        searchParams: toSearchParams(rest),
      }),
    );
  }

  async history(options: HistoryOptions): Promise<HistoricalSalary> {
    const { country, ...rest } = options;
    return request<HistoricalSalary>(() =>
      this.http.get(`jobs/${country}/history`, {
        searchParams: toSearchParams(rest),
      }),
    );
  }
}

async function request<T>(send: () => ReturnType<KyInstance['get']>): Promise<T> {
  try {
    return await send().json<T>();
  } catch (err) {
    throw await toAdzunaError(err);
  }
}

async function toAdzunaError(err: unknown): Promise<unknown> {
  if (!(err instanceof HTTPError)) return err;
  try {
    const body = (await err.response.clone().json()) as AdzunaExceptionBody;
    if (body && typeof body.exception === 'string') {
      return new AdzunaError(err.response.status, body);
    }
  } catch {
    // fall through — body wasn't JSON or didn't match shape
  }
  return err;
}

function toSearchParams(options: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null || value === false) continue;
    out[camelToSnake(key)] = value === true ? '1' : String(value);
  }
  return out;
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
