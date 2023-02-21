import { Observable } from 'relay-runtime';

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
    const compltesArrays = new Array(observables.length).fill(false);
    const subscriptions = observables.map((observable, index) => {
      return observable.subscribe({
        next(value: any) {
          values[index] = value;
          sink.next(values);
        },
        error(error: any) {
          sink.error(error);
        },
        complete() {
          compltesArrays[index] = true;
          if (compltesArrays.every(complete => complete)) {
            sink.complete();
          }
        },
      });
    });
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  });
