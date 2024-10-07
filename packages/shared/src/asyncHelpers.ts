/**
 * Executes a task with retries if the task fails. (rejection or exception)
 *
 * @param task - task to execute
 * @param retries - array of numbers representing the time to wait before retrying in milliseconds
 * @param shouldRretry - optional function to determine if the task should be retried
 * @returns the result of the task if it succeeds
 */
export const executeWithRetries = async <T>(
  task: () => Promise<T>,
  retries: number[],
  shouldRretry?: (error: any) => boolean,
): Promise<T> => {
  let i = 0;
  let error: any;
  while (true) {
    let result: T;
    try {
      result = await task();
    } catch (e) {
      error = e;
      if ((shouldRretry && !shouldRretry(e)) || i >= retries.length) {
        break;
      }
      await waitTime(retries[i]);
      i++;
      continue;
    }
    return result;
  }
  throw error;
};

/**
 * Waits for a given time
 * @param time - time to wait in milliseconds
 * @returns a promise that resolves after the given time
 */
export const waitTime = (time: number) =>
  new Promise(resolve => {
    setTimeout(resolve, time);
  });

/**
 * A deferred promise
 */
export type Deferred<T> = {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: Error): void;
};

/**
 * Creates a deferred promise
 */
export const createDeferred = <T>(): Deferred<T> => {
  const deferred = {} as Deferred<T>;
  deferred.promise = new Promise<T>((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
};

/**
 * Creates a concurrent queue that executes tasks with a given concurrency
 */
export const createConcurrentQueue = <T>(
  maxConcurrencyLimit: number,
  onMaxConcurrency?: () => void,
) => {
  const queue: Array<{ task: () => Promise<any>; deferred: Deferred<any> }> =
    [];
  let size = 0;
  const execute = async () => {
    if (size >= maxConcurrencyLimit) {
      void onMaxConcurrency?.();
      return;
    }
    const operation = queue.shift();
    if (!operation) {
      return;
    }
    size++;
    let result: any;
    let hasError = false;
    try {
      result = await operation.task();
    } catch (e) {
      operation.deferred.reject(e as any);
      hasError = true;
    }
    if (!hasError) {
      operation.deferred.resolve(result);
    }
    size--;
    execute();
  };
  return (task: () => Promise<T>) => {
    const deferred = createDeferred<T>();
    queue.push({ task, deferred });
    void execute();
    return deferred.promise;
  };
};
