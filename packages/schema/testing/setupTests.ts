import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { SQLiteCols as mockCols } from '@azzapp/data/helpers/cols';
import type { DrizzleService } from '@azzapp/data/drizzle.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AsyncLocalStorage } = require('async_hooks');

process.env.TOKEN_SECRET = 'unit-test-token-secret-at-least-32-characters';
process.env.REFRESH_TOKEN_SECRET =
  'unit-test-refresh-token-secret-at-least-32-characters';

// @ts-expect-error AsyncLocalStorage is not defined
global.AsyncLocalStorage = AsyncLocalStorage;

const mockCreateDrizzleService = () => {
  const sqlite = new Database(':memory:');
  const database = drizzle(sqlite);

  migrate(database, { migrationsFolder: './testing/drizzle' });

  const transactionManager = jest
    .requireActual('../../data/lib/drizzle.service.js')
    .createDrizzleTransactionManager(database);

  const drizzleService: DrizzleService = {
    client: () => {
      return transactionManager.getTransaction() ?? database;
    },
    transactionManager,
  };

  Object.assign(database, drizzleService);
  return database;

  // return drizzleService;
};

jest.mock('../../data/lib/db.js', () => ({
  ...jest.requireActual('../../data/lib/db.js'),
  cols: mockCols,
  __esModule: true,
}));

jest.mock('bcrypt-ts', () => ({
  compareSync: (unhashed: string, hashed: string) => {
    return hashed === `hashed-${unhashed}`;
  },
  hashSync: (unhashed: string) => {
    return `hashed-${unhashed}`;
  },
}));

jest.mock('@azzapp/shared/networkHelpers', () => ({
  fetchJSON: jest.fn(),
}));

jest.mock('../../data/lib/drizzle.service.js', () => ({
  createDrizzleService: mockCreateDrizzleService,
}));
