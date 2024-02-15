import { Image } from 'expo-image';
import { Observable } from 'relay-runtime';
import { shareReplay } from '@azzapp/shared/observableHelpers';

const createPrefetcher = (
  prefetch: (uri: string) => Promise<boolean>,
  observePrefetchResult: (uri: string) => Promise<void>,
  cancelPrefetch: (uri: string) => void,
) => {
  const observables = new Map<string, Observable<string>>();

  return (uri: string) => {
    if (!observables.has(uri)) {
      const observable = Observable.create<string>(observer => {
        let canceled = false;
        let complete = false;
        let started = false;

        const clean = () => {
          observables.delete(uri);
        };

        const cancel = () => {
          if (!complete) {
            canceled = true;
            complete = true;
            if (started) {
              cancelPrefetch(uri);
            }
            clean();
          }
        };

        const dispatchComplete = () => {
          complete = true;
          observer.next(uri);
          observer.complete();
          clean();
        };

        const dispatchError = (error: Error) => {
          observer.error(error);
          complete = true;
          clean();
        };

        const doPrefetch = async () => {
          try {
            started = await prefetch(uri);
          } catch (error) {
            if (canceled) {
              cancelPrefetch(uri);
              return;
            }
            dispatchError(error as Error);
            return;
          }
          if (started && canceled) {
            cancelPrefetch(uri);
            return;
          }
          if (!started) {
            dispatchComplete();
            return;
          }
          try {
            await observePrefetchResult(uri);
          } catch (error) {
            if (canceled) {
              return;
            }
            dispatchError(error as Error);
            return;
          }
          if (canceled) {
            return;
          }
          dispatchComplete();
        };

        void doPrefetch();

        return cancel;
      });
      observables.set(uri, shareReplay(observable));
    }
    return observables.get(uri)!;
  };
};

const createExpoImagePrefetcher = () => {
  const observables = new Map<string, Observable<string>>();

  return (uri: string) => {
    if (!observables.has(uri)) {
      const observable = Observable.create<string>(observer => {
        let canceled = false;
        let complete = false;

        const clean = () => {
          observables.delete(uri);
        };

        const cancel = () => {
          if (!complete) {
            canceled = true;
            complete = true;
            clean();
          }
        };

        const dispatchComplete = () => {
          complete = true;
          observer.next(uri);
          observer.complete();
          clean();
        };

        const dispatchError = (error: Error) => {
          observer.error(error);
          complete = true;
          clean();
        };

        const doPrefetch = async () => {
          const promise = Image.prefetch(uri);
          if (canceled) {
            return;
          }
          let hasBeenPrefetched = false;
          try {
            hasBeenPrefetched = await promise;
          } catch (error) {
            if (canceled) {
              return;
            }
            dispatchError(error as Error);
            return;
          }
          if (canceled) {
            return;
          }
          if (!hasBeenPrefetched) {
            dispatchError(new Error('Failed to prefetch image'));
            return;
          }
          dispatchComplete();
        };

        void doPrefetch();

        return cancel;
      });
      observables.set(uri, shareReplay(observable));
    }
    return observables.get(uri)!;
  };
};

export { createPrefetcher, createExpoImagePrefetcher };
