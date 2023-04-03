import { executeWithRetries, waitTime } from '../asyncHelpers';
import { flushPromises } from '../jestHelpers';

jest.useFakeTimers();
describe('asyncHelpers', () => {
  describe('executeWithRetries', () => {
    test('should execute a task and return the result', async () => {
      const task = jest
        .fn()
        .mockReturnValueOnce(Promise.resolve({ foo: 'bar' }));
      let retrievedResult: any;
      void executeWithRetries(task, [1000, 5000]).then(result => {
        retrievedResult = result;
      });
      await flushPromises();
      expect(retrievedResult).toEqual({ foo: 'bar' });
      expect(task).toHaveBeenCalled();
    });

    test('should retry a task if it fails', async () => {
      let i = 0;
      const task = jest.fn().mockImplementation(() => {
        if (i < 2) {
          i++;
          return Promise.reject(new Error('error'));
        }
        return Promise.resolve({ foo: 'bar' });
      });

      let retrievedResult: any;
      void executeWithRetries(task, [1000, 5000]).then(result => {
        retrievedResult = result;
      });
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(3000);
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(2000);
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(3);
      expect(retrievedResult).toEqual({ foo: 'bar' });
    });

    test('should fail with the last returned error if all attempts failed', async () => {
      let i = 0;
      const task = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error(`error at call ${++i}`));
      });

      let error: any;
      void executeWithRetries(task, [1000, 5000]).catch(e => {
        error = e;
      });
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(3000);
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(2000);
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(3);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('error at call 3');
    });

    test('should faill if shouldRetry parameters return fakse', async () => {
      let i = 0;
      const task = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error(`error at call ${++i}`));
      });

      let error: any;
      void executeWithRetries(task, [1000, 5000], () => i === 1).catch(e => {
        error = e;
      });
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      await flushPromises();
      expect(task).toHaveBeenCalledTimes(2);
      expect(error.message).toBe('error at call 2');
    });
  });

  describe('waitTime', () => {
    test('should resolve after the given time', async () => {
      const mock = jest.fn();
      void waitTime(1000).then(mock);
      await flushPromises();
      expect(mock).not.toHaveBeenCalled();
      jest.advanceTimersByTime(500);
      await flushPromises();
      expect(mock).not.toHaveBeenCalled();
      jest.advanceTimersByTime(500);
      await flushPromises();
      expect(mock).toHaveBeenCalled();
    });
  });
});
