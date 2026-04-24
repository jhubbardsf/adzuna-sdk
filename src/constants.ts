export const Country = {
  GB: 'gb',
  US: 'us',
  AT: 'at',
  AU: 'au',
  BE: 'be',
  BR: 'br',
  CA: 'ca',
  CH: 'ch',
  DE: 'de',
  ES: 'es',
  FR: 'fr',
  IN: 'in',
  IT: 'it',
  MX: 'mx',
  NL: 'nl',
  NZ: 'nz',
  PL: 'pl',
  SG: 'sg',
  ZA: 'za',
} as const;
export type Country = (typeof Country)[keyof typeof Country];

export const SortBy = {
  Default: 'default',
  Hybrid: 'hybrid',
  Date: 'date',
  Salary: 'salary',
  Relevance: 'relevance',
} as const;
export type SortBy = (typeof SortBy)[keyof typeof SortBy];

export const SortDir = {
  Up: 'up',
  Down: 'down',
} as const;
export type SortDir = (typeof SortDir)[keyof typeof SortDir];

export const ContractTime = {
  FullTime: 'full_time',
  PartTime: 'part_time',
} as const;
export type ContractTime = (typeof ContractTime)[keyof typeof ContractTime];

export const ContractType = {
  Permanent: 'permanent',
  Contract: 'contract',
} as const;
export type ContractType = (typeof ContractType)[keyof typeof ContractType];
