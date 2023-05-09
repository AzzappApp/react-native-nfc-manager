import { Observable } from 'relay-runtime';
import type { Subscription, Observer } from 'relay-runtime';

export const combineLatest = <
  T extends any[],
  P extends any[] & {
    [I in keyof T]: Observable<T[I]>;
  },
>(
  observables: P,
): Observable<T> =>
  Observable.create(sink => {
    const values: T = new Array(observables.length) as T;
    const hasEmittedArray = new Array(observables.length).fill(false);
    const completesArrays = new Array(observables.length).fill(false);
    const subscriptions = observables.map((observable, index) => {
      return observable.subscribe({
        next(value: any) {
          values[index] = value;
          hasEmittedArray[index] = true;
          if (hasEmittedArray.every(hasEmitted => hasEmitted)) {
            sink.next(values);
          }
        },
        error(error: any) {
          sink.error(error);
        },
        complete() {
          completesArrays[index] = true;
          if (completesArrays.every(complete => complete)) {
            sink.complete();
          }
        },
      });
    });
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  });

export const shareReplay = <T>(observable: Observable<T>): Observable<T> => {
  let subscription: Subscription | null = null;
  const signals = Array<['complete'] | ['error', any] | ['next', T]>();
  const observers: Array<Observer<T>> = [];
  return Observable.create(sink => {
    if (!subscription) {
      subscription = observable.subscribe({
        next(value: T) {
          observers.forEach(observer => observer.next?.(value));
          signals.push(['next', value]);
        },
        error(error: any) {
          observers.forEach(observer => observer.error?.(error));
          signals.push(['error', error]);
        },
        complete() {
          observers.forEach(observer => observer.complete?.());
          signals.push(['complete']);
        },
      });
    }
    observers.push(sink);
    signals.forEach(([signal, value]) => {
      sink[signal]?.(value);
    });
    return () => {
      const index = observers.indexOf(sink);
      if (index !== -1) {
        observers.splice(index, 1);
      }
      if (observers.length === 0 && subscription) {
        subscription.unsubscribe();
        subscription = null;
        signals.push(['complete']);
      }
    };
  });
};
