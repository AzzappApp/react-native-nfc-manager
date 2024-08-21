import { Client } from '@planetscale/database';
import { withReplicas } from 'drizzle-orm/mysql-core';
import {
  drizzle,
  type PlanetScaleDatabase,
} from 'drizzle-orm/planetscale-serverless';
import {
  monitorRequest,
  monitorRequestEnd,
} from '../helpers/databaseMonitorer';

let fetchFunction: typeof fetch;

if (process.env.NEXT_RUNTIME !== 'edge') {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let nodeFetch: typeof import('node-fetch');
  fetchFunction = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!nodeFetch) {
      nodeFetch = require('node-fetch');
    }
    return nodeFetch.default(input as any, init as any) as any;
  };
} else {
  fetchFunction = fetch;
}

export type DrizzleDatabase = PlanetScaleDatabase<Record<string, never>>;

export type DrizzleDatabaseTransaction = Parameters<
  Parameters<DrizzleDatabase['transaction']>[0]
>[0];

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

export const createDrizzleClient = () => {
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

  return database as DrizzleDatabase;
};
