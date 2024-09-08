import { AsyncLocalStorage } from 'node:async_hooks';
import { createDrizzleClient } from './drizzleClient';
import type {
  DrizzleDatabase,
  DrizzleDatabaseTransaction,
} from './drizzleClient';
export { default as cols } from './cols';

const drizzleClient = createDrizzleClient();

const transactionStorage = new AsyncLocalStorage<DrizzleDatabaseTransaction>();

export const db = (): DrizzleDatabase => {
  return transactionStorage.getStore() ?? drizzleClient;
};

export const transaction = async <T>(
  callback: (tx: { rollback(): void }) => Promise<T>,
): Promise<T> =>
  db().transaction(async tx => transactionStorage.run(tx, () => callback(tx)));
