import type { Config } from 'drizzle-kit';
import 'dotenv/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AsyncLocalStorage } = require('async_hooks');

// @ts-expect-error AsyncLocalStorage is not defined
global.AsyncLocalStorage = AsyncLocalStorage;

export default {
  schema: '../data/src/*',
  tablesFilter: ['!_*'],
  driver: 'better-sqlite',
  out: './testing/drizzle',
  dbCredentials: {
    url: './testing/sqlite.db',
  },
  verbose: true,
  strict: true,
} satisfies Config;
