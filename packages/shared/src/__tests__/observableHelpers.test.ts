import { Observable } from 'relay-runtime';
import { combineLatest, shareReplay } from '../observableHelpers';
import type { Sink } from 'relay-runtime/lib/network/RelayObservable';

describe('observableHelpers', () => {
  describe('combineLatest', () => {
    test('it should combine latest emitted values from two observables and complete only if all observables has completed', () => {
      expect.assertions(3);
      const observable1 = Observable.from('a');
      const observable2 = Observable.create(sink => {
        sink.next('y');
        sink.next('z');
        sink.complete();
      });

      let i = 0;
      combineLatest([observable1, observable2]).subscribe({
        next: value => {
          expect(value).toEqual(i++ === 0 ? ['a', 'y'] : ['a', 'z']);
        },
        complete: () => {
          expect(i).toEqual(2);
        },
      });
    });

    test('it should pass error if any observable throws error', done => {
      expect.assertions(1);

      const observable1 = Observable.from('a');
      const error = new Error('oops');
      const observable2 = Observable.create(sink => {
        sink.error(error);
      });

      combineLatest([observable1, observable2]).subscribe({
        error: (err: any) => {
          expect(err).toBe(error);
          done();
        },
        complete: () => {
          done.fail('should not complete');
        },
      });
    });

    test('it should unsubscribe from all observables when unsubscribed', done => {
      jest.useFakeTimers();
      let unsubscribeCount = 0;
      const observable1 = Observable.create(sink => {
        setTimeout(() => {
          sink.next('a');
        }, 10);
        sink.complete();
        return () => {
          unsubscribeCount++;
        };
      });
      const observable2 = Observable.create(sink => {
        setTimeout(() => {
          sink.next('y');
          sink.next('z');
        }, 10);
        sink.complete();
        return () => {
          unsubscribeCount++;
        };
      });

      const subscription = combineLatest([observable1, observable2]).subscribe({
        next: () => {
          done.fail('should not emit');
        },
      });

      subscription.unsubscribe();
      setTimeout(() => {
        expect(unsubscribeCount).toEqual(2);
        done();
      }, 100);

      jest.runAllTimers();
    });
  });

  describe('shareReplay', () => {
    test('should share the same subscription with multiple observers', () => {
      expect.assertions(3);
      jest.useFakeTimers();
      let nbSubscriptions = 0;
      const observable = Observable.create(sink => {
        setTimeout(() => {
          sink.next('a');
          sink.complete();
        });
        nbSubscriptions++;
      });
      const sharedObservable = shareReplay(observable);

      sharedObservable.subscribe({
        next: value => {
          expect(value).toEqual('a');
        },
      });
      sharedObservable.subscribe({
        next: value => {
          expect(value).toEqual('a');
        },
      });

      jest.runAllTimers();
      expect(nbSubscriptions).toEqual(1);
    });

    test('should unsubscribe from the original observer when all subscriptions has been dismissed', done => {
      jest.useFakeTimers();
      let hasUnsubscribed = false;
      const observable = Observable.create(sink => {
        setTimeout(() => {
          sink.next('a');
          sink.complete();
        });
        return () => {
          hasUnsubscribed = true;
        };
      });

      const sharedObservable = shareReplay(observable);

      const subscription1 = sharedObservable.subscribe({
        next: () => {
          done.fail('should not emit');
        },
      });

      const subscription2 = sharedObservable.subscribe({
        next: () => {
          done.fail('should not emit');
        },
      });

      subscription1.unsubscribe();
      expect(hasUnsubscribed).toBe(false);
      subscription2.unsubscribe();
      expect(hasUnsubscribed).toBe(true);
      jest.runAllTimers();
      done();
    });

    test('should replay all the emitted value to new subscribers', () => {
      jest.useFakeTimers();
      let sink: Sink<string> | null = null;
      const observable = Observable.create<string>(observableSink => {
        sink = observableSink;
      });
      const sharedObservable = shareReplay(observable);

      const observers1Values: string[] = [];
      const subscriptions1 = sharedObservable.subscribe({
        next: value => {
          observers1Values.push(value);
        },
      });
      sink!.next('a');
      sink!.next('b');
      const observers2Values: string[] = [];
      const subscriptions2 = sharedObservable.subscribe({
        next: value => {
          observers2Values.push(value);
        },
      });

      sink!.next('c');

      subscriptions1.unsubscribe();
      subscriptions2.unsubscribe();

      sink!.next('d');

      const observers3Values: string[] = [];
      let observer3Completed = false;
      sharedObservable.subscribe({
        next: value => {
          observers3Values.push(value);
        },
        complete: () => {
          observer3Completed = true;
        },
      });

      expect(observers1Values).toEqual(['a', 'b', 'c']);
      expect(observers2Values).toEqual(['a', 'b', 'c']);
      expect(observers3Values).toEqual(['a', 'b', 'c']);
      expect(observer3Completed).toBe(true);
    });
  });
});
