// Node compatibility smoke test.
//
// Run from a directory where `adzuna-sdk` is installed (CI does this
// against an `npm pack`'d tarball). Verifies:
//   - the published package is importable as ESM from Node
//   - all advertised public exports exist at runtime
//   - the const-object enums hold their expected runtime values
//   - the AdzunaError class is a real Error subclass
//   - the AdzunaClient constructor wires up the jobs namespace

import assert from 'node:assert/strict';

import {
  AdzunaClient,
  AdzunaError,
  ContractTime,
  ContractType,
  Country,
  JobsApi,
  SortBy,
  SortDir,
} from 'adzuna-sdk';

assert.equal(typeof AdzunaClient, 'function', 'AdzunaClient should be a class');
assert.equal(typeof JobsApi, 'function', 'JobsApi should be a class');
assert.equal(typeof AdzunaError, 'function', 'AdzunaError should be a class');
assert.ok(
  AdzunaError.prototype instanceof Error,
  'AdzunaError should extend Error',
);

assert.equal(Country.GB, 'gb');
assert.equal(Country.US, 'us');
assert.equal(Object.keys(Country).length, 19, 'Country should have 19 entries');

assert.equal(SortBy.Date, 'date');
assert.equal(SortDir.Up, 'up');
assert.equal(ContractTime.FullTime, 'full_time');
assert.equal(ContractType.Permanent, 'permanent');

const client = new AdzunaClient({ appId: 'smoke-id', appKey: 'smoke-key' });
assert.ok(client.jobs instanceof JobsApi, 'client.jobs should be a JobsApi');
assert.equal(typeof client.jobs.search, 'function');
assert.equal(typeof client.jobs.categories, 'function');
assert.equal(typeof client.jobs.histogram, 'function');
assert.equal(typeof client.jobs.topCompanies, 'function');
assert.equal(typeof client.jobs.geodata, 'function');
assert.equal(typeof client.jobs.history, 'function');
assert.equal(typeof client.version, 'function');

assert.throws(
  () => new AdzunaClient({ appId: '', appKey: 'k' }),
  'constructor should reject empty appId',
);

console.log(`Node smoke test passed (Node ${process.version})`);
