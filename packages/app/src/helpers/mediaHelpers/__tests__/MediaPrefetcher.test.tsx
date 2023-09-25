import { createDeffered } from '@azzapp/shared/asyncHelpers';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import { createPrefetecher } from '../MediaPrefetcher';

describe('MediaPrefetcher', () => {
  const prefetch = jest.fn();
  const observePrefetchResult = jest.fn();
  const cancelPrefetch = jest.fn();

  beforeEach(() => {
    prefetch.mockReset();
    observePrefetchResult.mockReset();
    cancelPrefetch.mockReset();
  });
  const prefetcher = createPrefetecher(
    prefetch,
    observePrefetchResult,
    cancelPrefetch,
  );

  test('should create only one observable for a given uri', () => {
    const uri = 'https://www.example.com/image.png';
    const observable1 = prefetcher(uri);
    const observable2 = prefetcher(uri);
    expect(observable1).toBe(observable2);
    expect(observable1).not.toBe(
      prefetcher('https://www.example.com/image2.png'),
    );
  });

  test('should prefetch the uri when subscribing', async () => {
    expect.assertions(7);
    const uri = 'https://www.example.com/image.png';
    prefetch.mockResolvedValueOnce(true);
    observePrefetchResult.mockResolvedValueOnce(undefined);

    const observable = prefetcher(uri);
    await flushPromises();
    expect(prefetch).not.toHaveBeenCalled();
    expect(observePrefetchResult).not.toHaveBeenCalled();

    observable.subscribe({
      next: result => {
        expect(result).toBe(uri);
      },
      complete: () => {
        expect(true).toBe(true);
      },
      error: () => {
        throw new Error('Should not be called');
      },
    });
    await flushPromises();
    expect(prefetch).toHaveBeenCalledWith(uri);
    expect(observePrefetchResult).toHaveBeenCalledWith(uri);
    expect(cancelPrefetch).not.toHaveBeenCalled();

    // make sure that a promise is not still pending
    await flushPromises();
  });

  test('should dispatch an error when the `prefetch` promise reject', async () => {
    expect.assertions(2);
    const uri = 'https://www.example.com/image.png';
    prefetch.mockRejectedValue(new Error('prefetch error'));
    observePrefetchResult.mockRejectedValue(
      new Error('observePrefetchResult error'),
    );

    const observable = prefetcher(uri);
    observable.subscribe({
      next: () => {
        throw new Error('Should not be called');
      },
      complete: () => {
        throw new Error('Should not be called');
      },
      error: (error: any) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('prefetch error');
      },
    });

    // make sure that a promise is not still pending
    await flushPromises();
  });

  test('should dispatch an error when the `observePrefetchResult` promise reject', async () => {
    expect.assertions(2);
    const uri = 'https://www.example.com/image.png';
    prefetch.mockResolvedValueOnce(true);
    observePrefetchResult.mockRejectedValue(
      new Error('observePrefetchResult error'),
    );

    const observable = prefetcher(uri);
    observable.subscribe({
      next: () => {
        throw new Error('Should not be called');
      },
      complete: () => {
        throw new Error('Should not be called');
      },
      error: (error: any) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('observePrefetchResult error');
      },
    });

    // make sure that a promise is not still pending
    await flushPromises();
  });

  test('should dispatch an complete when the `prefetch` promise resolve to false (media already prefetched)', async () => {
    expect.assertions(5);
    const uri = 'https://www.example.com/image.png';
    prefetch.mockResolvedValueOnce(false);
    observePrefetchResult.mockResolvedValueOnce(undefined);

    const observable = prefetcher(uri);
    observable.subscribe({
      next: result => {
        expect(result).toBe(uri);
      },
      complete: () => {
        expect(true).toBe(true);
      },
    });
    await flushPromises();
    expect(prefetch).toHaveBeenCalledWith(uri);
    expect(observePrefetchResult).not.toHaveBeenCalled();
    expect(cancelPrefetch).not.toHaveBeenCalled();
  });

  test('should cancel the prefetch when the observable is unsubscribed before the `prefetch` promise resolve', async () => {
    const uri = 'https://www.example.com/image.png';
    const prefetchDeferred = createDeffered();
    prefetch.mockReturnValueOnce(prefetchDeferred);
    prefetch.mockResolvedValueOnce(true);
    observePrefetchResult.mockResolvedValueOnce(undefined);

    const observable = prefetcher(uri);
    const subscription = observable.subscribe({
      next: () => {
        throw new Error('Should not be called');
      },
      complete: () => {
        throw new Error('Should not be called');
      },
      error: () => {
        throw new Error('Should not be called');
      },
    });
    subscription.unsubscribe();
    prefetchDeferred.resolve(true);
    await flushPromises();
    expect(cancelPrefetch).toHaveBeenCalledWith(uri);
    expect(observePrefetchResult).not.toHaveBeenCalled();
    await flushPromises();
  });

  test('should cancel the prefetch when the observable is unsubscribed before the `observePrefetchResult` promise resolves', async () => {
    const uri = 'https://www.example.com/image.png';
    prefetch.mockResolvedValueOnce(true);
    const observerPrefetchDeferred = createDeffered();
    observePrefetchResult.mockReturnValueOnce(observerPrefetchDeferred.promise);

    const observable = prefetcher(uri);
    const subscription = observable.subscribe({
      next: () => {
        throw new Error('Should not be called');
      },
      complete: () => {
        throw new Error('Should not be called');
      },
      error: () => {
        throw new Error('Should not be called');
      },
    });
    await flushPromises();
    subscription.unsubscribe();
    expect(cancelPrefetch).toHaveBeenCalledWith(uri);
    observerPrefetchDeferred.resolve(undefined);
    await flushPromises();
  });

  test('should not cancel the prefetch when the observable is unsubscribed after the `prefetch` promise resolves to false', async () => {
    expect.assertions(3);
    const uri = 'https://www.example.com/image.png';
    prefetch.mockResolvedValueOnce(false);
    observePrefetchResult.mockResolvedValueOnce(undefined);

    const observable = prefetcher(uri);
    const subscription = observable.subscribe({
      next: () => {
        throw new Error('Should not be called');
      },
      complete: () => {
        throw new Error('Should not be called');
      },
    });
    subscription.unsubscribe();
    await flushPromises();

    expect(prefetch).toHaveBeenCalledWith(uri);
    expect(observePrefetchResult).not.toHaveBeenCalled();
    expect(cancelPrefetch).not.toHaveBeenCalled();
    await flushPromises();
  });
});
