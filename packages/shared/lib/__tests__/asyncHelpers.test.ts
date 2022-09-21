import { executeWithRetries, waitTime } from '../asyncHelpers';

jest.useFakeTimers();
describe('asyncHelpers', () => {
  describe('executeWithRetries', () => {
    test('should execute a task and return the result', () => {
      const task = jest
        .fn()
        .mockReturnValueOnce(Promise.resolve({ foo: 'bar' }));
      let retrievedResult: any;
      void executeWithRetries(task, [1000, 5000]).then(result => {
        retrievedResult = result;
      });
      jest.runAllTicks();
      expect(retrievedResult).toEqual({ foo: 'bar' });
      expect(task).toHaveBeenCalled();
    });

    test('should retry a task if it fails', () => {
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
      expect(task).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      expect(task).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      expect(task).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(3000);
      expect(task).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(2000);
      expect(task).toHaveBeenCalledTimes(3);
      expect(retrievedResult).toEqual({ foo: 'bar' });
    });

    test('should fail with the last returned error if all attempts failed', () => {
      let i = 0;
      const task = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error(`error at call ${++i}`));
      });

      let error: any;
      void executeWithRetries(task, [1000, 5000]).catch(e => {
        error = e;
      });
      expect(task).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      expect(task).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      expect(task).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(3000);
      expect(task).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(2000);
      expect(task).toHaveBeenCalledTimes(3);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('error at call 3');
    });

    test('should faill if shouldRetry parameters return fakse', () => {
      let i = 0;
      const task = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error(`error at call ${++i}`));
      });

      let error: any;
      void executeWithRetries(task, [1000, 5000], () => i === 1).catch(e => {
        error = e;
      });
      expect(task).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      expect(task).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(500);
      expect(task).toHaveBeenCalledTimes(2);
      expect(error.message).toBe('error at call 2');
    });
  });

  describe('waitTime', () => {
    test('should resolve after the given time', () => {
      const mock = jest.fn();
      void waitTime(1000).then(mock);
      expect(mock).not.toHaveBeenCalled();
      jest.advanceTimersByTime(500);
      expect(mock).not.toHaveBeenCalled();
      jest.advanceTimersByTime(500);
      expect(mock).toHaveBeenCalled();
    });
  });
});
