import DataLoader from 'dataloader';
import { getOrCreateSessionResource } from '#GraphQLContext';

const defaultDataLoaderOptions = {
  batchScheduleFn: setTimeout,
};

/**
 * Create a new DataLoader instance with default options
 *
 * @param batchLoadFn - The function to load the data
 * @param options - DataLoader options
 * @returns A new DataLoader instance
 */
export const createDataLoader = <K, V, C = K>(
  batchLoadFn: DataLoader.BatchLoadFn<K, V>,
  options?: DataLoader.Options<K, V, C>,
): DataLoader<K, V, C> => {
  return new DataLoader(batchLoadFn, {
    ...defaultDataLoaderOptions,
    ...options,
  });
};

/**
 * Create a new DataLoader instance bound to the current session
 *
 * @param key - The key to store the DataLoader instance in the session
 * @param batchLoadFn - The function to load the data
 * @param options - DataLoader options
 * @returns A new DataLoader instance
 */
export const createSessionDataLoader = <K, V, C = K>(
  key: string,
  batchLoadFn: DataLoader.BatchLoadFn<K, V>,
  options?: DataLoader.Options<K, V, C>,
): DataLoader<K, V, C> => {
  const getLoader = () =>
    getOrCreateSessionResource(key, () =>
      createDataLoader(batchLoadFn, options),
    );

  return {
    name: key,
    load(key: K): Promise<V> {
      return getLoader().load(key);
    },
    loadMany(keys) {
      return getLoader().loadMany(keys);
    },
    prime(key, value) {
      return getLoader().prime(key, value);
    },
    clear(key) {
      return getLoader().clear(key);
    },
    clearAll() {
      return getLoader().clearAll();
    },
  };
};
