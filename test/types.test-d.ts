import { expectTypeOf } from 'expect-type';

import type {
  AdzunaClientOptions,
  CategoriesOptions,
  GeodataOptions,
  HistogramOptions,
  HistoryOptions,
  Job,
  JobSearchResults,
  SearchOptions,
  TopCompaniesOptions,
} from '../src/index.js';
import {
  AdzunaError,
  ContractTime,
  ContractType,
  Country,
  SortBy,
  SortDir,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Constants are runtime values AND types of the same name.
// ---------------------------------------------------------------------------

expectTypeOf(Country.GB).toEqualTypeOf<'gb'>();
expectTypeOf(Country.US).toEqualTypeOf<'us'>();
expectTypeOf<Country>().toEqualTypeOf<
  | 'gb' | 'us' | 'at' | 'au' | 'be' | 'br' | 'ca' | 'ch' | 'de' | 'es'
  | 'fr' | 'in' | 'it' | 'mx' | 'nl' | 'nz' | 'pl' | 'sg' | 'za'
>();

expectTypeOf<SortBy>().toEqualTypeOf<
  'default' | 'hybrid' | 'date' | 'salary' | 'relevance'
>();
expectTypeOf<SortDir>().toEqualTypeOf<'up' | 'down'>();
expectTypeOf<ContractTime>().toEqualTypeOf<'full_time' | 'part_time'>();
expectTypeOf<ContractType>().toEqualTypeOf<'permanent' | 'contract'>();

// ---------------------------------------------------------------------------
// Constructor options
// ---------------------------------------------------------------------------

expectTypeOf<AdzunaClientOptions['appId']>().toEqualTypeOf<string>();
expectTypeOf<AdzunaClientOptions['appKey']>().toEqualTypeOf<string>();
expectTypeOf<AdzunaClientOptions['baseUrl']>().toEqualTypeOf<
  string | undefined
>();
expectTypeOf<AdzunaClientOptions['retry']>().toEqualTypeOf<number | undefined>();
expectTypeOf<AdzunaClientOptions['timeout']>().toEqualTypeOf<number | undefined>();
expectTypeOf<AdzunaClientOptions['fetch']>().toEqualTypeOf<typeof fetch | undefined>();

// ---------------------------------------------------------------------------
// SearchOptions: required fields, optional fields, boolean translation
// ---------------------------------------------------------------------------

expectTypeOf<SearchOptions['country']>().toEqualTypeOf<Country>();
expectTypeOf<SearchOptions['page']>().toEqualTypeOf<number>();
expectTypeOf<SearchOptions['resultsPerPage']>().toEqualTypeOf<number | undefined>();
expectTypeOf<SearchOptions['what']>().toEqualTypeOf<string | undefined>();
expectTypeOf<SearchOptions['sortBy']>().toEqualTypeOf<SortBy | undefined>();
expectTypeOf<SearchOptions['sortDir']>().toEqualTypeOf<SortDir | undefined>();

// Boolean flags are boolean in our SDK (not "1" strings) — this is the whole point.
expectTypeOf<SearchOptions['fullTime']>().toEqualTypeOf<boolean | undefined>();
expectTypeOf<SearchOptions['partTime']>().toEqualTypeOf<boolean | undefined>();
expectTypeOf<SearchOptions['contract']>().toEqualTypeOf<boolean | undefined>();
expectTypeOf<SearchOptions['permanent']>().toEqualTypeOf<boolean | undefined>();
expectTypeOf<SearchOptions['salaryIncludeUnknown']>().toEqualTypeOf<
  boolean | undefined
>();

// Location fields 0-7 all present and string|undefined.
expectTypeOf<SearchOptions['location0']>().toEqualTypeOf<string | undefined>();
expectTypeOf<SearchOptions['location7']>().toEqualTypeOf<string | undefined>();

// ---------------------------------------------------------------------------
// Other endpoint options
// ---------------------------------------------------------------------------

expectTypeOf<CategoriesOptions['country']>().toEqualTypeOf<Country>();
expectTypeOf<HistogramOptions['country']>().toEqualTypeOf<Country>();
expectTypeOf<HistogramOptions['what']>().toEqualTypeOf<string | undefined>();
expectTypeOf<TopCompaniesOptions['country']>().toEqualTypeOf<Country>();
expectTypeOf<GeodataOptions['country']>().toEqualTypeOf<Country>();
expectTypeOf<HistoryOptions['country']>().toEqualTypeOf<Country>();
expectTypeOf<HistoryOptions['months']>().toEqualTypeOf<number | undefined>();

// ---------------------------------------------------------------------------
// Response: JobSearchResults and Job preserve API enum literals exactly
// ---------------------------------------------------------------------------

expectTypeOf<JobSearchResults['count']>().toEqualTypeOf<number | undefined>();
expectTypeOf<JobSearchResults['mean']>().toEqualTypeOf<number | undefined>();
expectTypeOf<JobSearchResults['results']>().toEqualTypeOf<Job[]>();

expectTypeOf<Job['id']>().toEqualTypeOf<string>();
expectTypeOf<Job['title']>().toEqualTypeOf<string>();
expectTypeOf<Job['description']>().toEqualTypeOf<string>();
expectTypeOf<Job['created']>().toEqualTypeOf<string>();
expectTypeOf<Job['salary_min']>().toEqualTypeOf<number | undefined>();
expectTypeOf<Job['salary_max']>().toEqualTypeOf<number | undefined>();

// These are the spec's response-side enums — preserved as string literal unions.
expectTypeOf<Job['salary_is_predicted']>().toEqualTypeOf<
  '0' | '1' | undefined
>();
expectTypeOf<Job['contract_time']>().toEqualTypeOf<
  'full_time' | 'part_time' | undefined
>();
expectTypeOf<Job['contract_type']>().toEqualTypeOf<
  'permanent' | 'contract' | undefined
>();

// ---------------------------------------------------------------------------
// AdzunaError shape
// ---------------------------------------------------------------------------

expectTypeOf<AdzunaError>().toMatchTypeOf<Error>();

declare const err: AdzunaError;
expectTypeOf(err.status).toEqualTypeOf<number>();
expectTypeOf(err.exception).toEqualTypeOf<string>();
expectTypeOf(err.display).toEqualTypeOf<string | undefined>();
expectTypeOf(err.doc).toEqualTypeOf<string | undefined>();

// ---------------------------------------------------------------------------
// Country accepts string literals (because of the const-object pattern)
// ---------------------------------------------------------------------------

// Should compile: passing a raw lowercase string literal that matches.
const _opts1: SearchOptions = { country: 'gb', page: 1 };
const _opts2: SearchOptions = { country: Country.GB, page: 1 };
void _opts1;
void _opts2;
