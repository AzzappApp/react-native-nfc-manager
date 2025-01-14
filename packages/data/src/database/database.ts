import { AsyncLocalStorage } from 'node:async_hooks';
import { createDrizzleClient } from './drizzleClient';
import type {
  DrizzleDatabase,
  DrizzleDatabaseTransaction,
} from './drizzleClient';
export { default as cols } from './cols';

const drizzleClient = createDrizzleClient();

const transactionStorage = new AsyncLocalStorage<DrizzleDatabaseTransaction>();

const usePrimaryStorage = new AsyncLocalStorage<boolean>();

export const db = (): DrizzleDatabase => {
  return (
    transactionStorage.getStore() ??
    ((usePrimaryStorage.getStore() ?? false) && '$primary' in drizzleClient
      ? drizzleClient.$primary
      : drizzleClient)
  );
};

export const runWithPrimary = async <T>(
  callback: () => Promise<T>,
): Promise<T> => usePrimaryStorage.run(true, callback);

export const transaction = async <T>(
  callback: (tx: { rollback(): void }) => Promise<T>,
): Promise<T> =>
  db().transaction(tx => {
    return new Promise<T>((resolve, reject) => {
      transactionStorage.run(tx, () => {
        callback(tx).then(resolve, reject);
      });
    });
  });
