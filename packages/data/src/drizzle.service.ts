/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Client } from '@planetscale/database';
import {
  drizzle,
  type PlanetScaleDatabase,
} from 'drizzle-orm/planetscale-serverless';
import { monitorRequest, monitorRequestEnd } from './databaseMonitorer';

let fetchFunction: typeof fetch;

if (process.env.NEXT_RUNTIME !== 'edge') {
  let nodeFetch: typeof import('node-fetch');
  fetchFunction = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!nodeFetch) {
      nodeFetch = await import('node-fetch');
    }
    return nodeFetch.default(input as any, init as any) as any;
  };
} else {
  fetchFunction = fetch;
}

type DrizzleDatabase = PlanetScaleDatabase<Record<string, never>>;

export type DatabaseTransaction = Parameters<
  Parameters<DrizzleDatabase['transaction']>[0]
>[0];

export type TransactionManager = {
  startTransaction<T>(cb: () => Promise<T>): Promise<T>;
};

type DrizzleTransactionManager = TransactionManager & {
  getTransaction: () => DatabaseTransaction | undefined;
};

export const createDrizzleTransactionManager = (
  database: DrizzleDatabase,
): DrizzleTransactionManager => {
  // @ts-ignore Missing type for async local storage
  if (typeof AsyncLocalStorage === 'undefined') {
    return {
      getTransaction: () => undefined,
      startTransaction: async _cb => {
        throw new Error('AsyncLocalStorage is not defined');
      },
    };
  }

  // @ts-ignore Missing type for async local storage
  const store = new AsyncLocalStorage<DatabaseTransaction>();

  const startTransaction = <T>(cb: () => Promise<T>) => {
    return database.transaction(trx => {
      return new Promise<T>((resolve, reject) => {
        store.run(trx, () => {
          cb().then(resolve).catch(reject);
        });
      });
    });
  };

  return {
    getTransaction: () => store.getStore(),
    startTransaction,
  };
};

export type DrizzleService = {
  client: () => PlanetScaleDatabase<Record<string, never>>;
  transactionManager: TransactionManager;
};

export const createDrizzleService = () => {
  // create the connection
  const connection = new Client({
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    async fetch(input: RequestInfo | URL, init: RequestInit | undefined) {
      if (process.env.ENABLE_DATABASE_MONITORING === 'true') {
        monitorRequest(init);
      }
      let response: Response;
      try {
        response = await fetchFunction(input, init);
      } catch (e) {
        throw e as any;
      } finally {
        if (process.env.ENABLE_DATABASE_MONITORING === 'true') {
          monitorRequestEnd();
        }
      }
      return response;
    },
  });

  const database = drizzle(connection);

  const transactionManager = createDrizzleTransactionManager(database);

  const service: DrizzleService = {
    client: () => {
      return transactionManager.getTransaction() ?? database;
    },
    transactionManager,
  };

  /* Temporary configuration for retro-compatibility */
  Object.assign(database, service);

  return database as DrizzleDatabase & DrizzleService;

  // return service;
};
