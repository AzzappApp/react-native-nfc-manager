import { Observable } from 'relay-runtime';
import { shareReplay } from '@azzapp/shared/observableHelpers';

const createPrefetecher = (
  prefetch: (uri: string) => Promise<boolean>,
  obervePrefetchResult: (uri: string) => Promise<void>,
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
            await obervePrefetchResult(uri);
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

export { createPrefetecher };
