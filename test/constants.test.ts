import { describe, test, expect } from 'bun:test';

import {
  Country,
  SortBy,
  SortDir,
  ContractTime,
  ContractType,
} from '../src/index.js';

describe('Country', () => {
  test('has exactly 19 supported countries', () => {
    expect(Object.keys(Country)).toHaveLength(19);
  });

  test('values are lowercase ISO 8601 country codes', () => {
    for (const value of Object.values(Country)) {
      expect(value).toMatch(/^[a-z]{2}$/);
    }
  });

  test('contains expected country codes', () => {
    const expected: Country[] = [
      'gb', 'us', 'at', 'au', 'be', 'br', 'ca', 'ch', 'de', 'es',
      'fr', 'in', 'it', 'mx', 'nl', 'nz', 'pl', 'sg', 'za',
    ];
    expect(Object.values(Country).sort()).toEqual(expected.sort());
  });

  test('keys are uppercase versions of values', () => {
    for (const [key, value] of Object.entries(Country)) {
      expect(key).toBe(value.toUpperCase());
    }
  });
});

describe('SortBy', () => {
  test('has exactly 5 sort options', () => {
    expect(Object.keys(SortBy)).toHaveLength(5);
  });

  test('contains expected values', () => {
    const expected: SortBy[] = ['date', 'default', 'hybrid', 'relevance', 'salary'];
    expect(Object.values(SortBy).sort()).toEqual(expected);
  });
});

describe('SortDir', () => {
  test('has exactly 2 directions', () => {
    expect(Object.keys(SortDir)).toHaveLength(2);
  });

  test('contains up and down', () => {
    expect(SortDir.Up).toBe('up');
    expect(SortDir.Down).toBe('down');
  });
});

describe('ContractTime', () => {
  test('has full_time and part_time', () => {
    expect(Object.keys(ContractTime)).toHaveLength(2);
    expect(ContractTime.FullTime).toBe('full_time');
    expect(ContractTime.PartTime).toBe('part_time');
  });
});

describe('ContractType', () => {
  test('has permanent and contract', () => {
    expect(Object.keys(ContractType)).toHaveLength(2);
    expect(ContractType.Permanent).toBe('permanent');
    expect(ContractType.Contract).toBe('contract');
  });
});
