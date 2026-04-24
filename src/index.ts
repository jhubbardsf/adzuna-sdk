export {
  AdzunaClient,
  JobsApi,
  type AdzunaClientOptions,
  type SearchOptions,
  type CategoriesOptions,
  type HistogramOptions,
  type TopCompaniesOptions,
  type GeodataOptions,
  type HistoryOptions,
  type Job,
  type JobSearchResults,
  type Category,
  type Categories,
  type SalaryHistogram,
  type TopCompanies,
  type JobGeoData,
  type HistoricalSalary,
  type Version,
  type Location,
  type Company,
} from './client.js';

export { AdzunaError, type AdzunaExceptionBody } from './errors.js';

export {
  Country,
  SortBy,
  SortDir,
  ContractTime,
  ContractType,
} from './constants.js';

export type { components, operations, paths } from './schema.js';
