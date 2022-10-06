export const executeWithRetries = async <T>(
  task: () => Promise<T>,
  retries: number[],
  shouldRretry?: (error: any) => boolean,
): Promise<T> => {
  let i = 0;
  let error: any;
  // eslint-disable-next-line no-constant-condition
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

export const waitTime = (time: number) =>
  new Promise(resolve => {
    setTimeout(resolve, time);
  });

type Deferred<T> = {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: Error): void;
};

export const createDeffered = <T>(): Deferred<T> => {
  const deffered = {} as Deferred<T>;
  deffered.promise = new Promise<T>((resolve, reject) => {
    deffered.resolve = resolve;
    deffered.reject = reject;
  });
  return deffered;
};
