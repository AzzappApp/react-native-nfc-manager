/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Client } from '@planetscale/database';
import { withReplicas } from 'drizzle-orm/mysql-core';
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
  startTransaction<T>(cb: (trx: DatabaseTransaction) => Promise<T>): Promise<T>;
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

  const startTransaction = <T>(cb: (tx: DatabaseTransaction) => Promise<T>) => {
    return database.transaction(trx => {
      return new Promise<T>((resolve, reject) => {
        store.run(trx, () => {
          cb(trx)
            .then(r => {
              resolve(r);
            })
            .catch(err => {
              console.log(err);
              reject(err);
            });
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

const databaseFetch = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
) => {
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
};

export const createDrizzleService = () => {
  // create the connection
  const connection = new Client({
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    fetch: databaseFetch,
  });

  let replica: Client | null = null;
  const replicaHost = process.env.REPLICA_DATABASE_HOST;
  const replicaUsername = process.env.REPLICA_DATABASE_USERNAME;
  const replicaPassword = process.env.REPLICA_DATABASE_PASSWORD;
  if (replicaHost && replicaUsername && replicaPassword) {
    replica = new Client({
      host: replicaHost,
      username: replicaUsername,
      password: replicaPassword,
      fetch: databaseFetch,
    });
  }

  const primaryConnection = drizzle(connection);
  const replicaConnection = replica ? drizzle(replica) : undefined;

  const database = replicaConnection
    ? withReplicas(primaryConnection, [replicaConnection])
    : primaryConnection;

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
