/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-expect-error AsyncLocalStorage is not defined
const { AsyncLocalStorage } = require('async_hooks');

// @ts-expect-error AsyncLocalStorage is not defined
global.AsyncLocalStorage = AsyncLocalStorage;

process.env.TOKEN_SECRET = 'token-secret_that_contains_at_least_32_characters';
process.env.REFRESH_TOKEN_SECRET =
  'refresh-token-secret_thats_contains_at_least_32_characters';

process.env.DATABASE_HOST = 'aws.connect.psdb.cloud';
process.env.DATABASE_USERNAME = '<username>';
process.env.DATABASE_PASSWORD = '<password>';

jest.mock('bcrypt-ts', () => ({
  compareSync: (unhashed: string, hashed: string) => {
    return hashed === `hashed-${unhashed}`;
  },
  hashSync: (unhashed: string) => {
    return `hashed-${unhashed}`;
  },
}));

jest.mock('./fixtures/app.fixture.ts', () => {
  return jest.requireActual('./fixtures/e2e-app.fixture.ts');
});

jest.mock('node-fetch', () => fetch);
