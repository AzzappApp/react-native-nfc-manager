import ERRORS from '../errors';
import {
  createAbortError,
  FetchError,
  fetchJSON,
  TIMEOUT_ERROR_MESSAGE,
} from '../networkHelpers';

const fetchMock = jest.fn();
global.fetch = fetchMock;
const AbortControllerMock = jest.fn();
const abortMock = jest.fn();
AbortControllerMock.mockReturnValue({
  abort: abortMock,
});
global.AbortController = AbortControllerMock;

describe('networkHelpers', () => {
  describe('fetchJSON', () => {
    afterEach(() => {
      fetchMock.mockReset();
      abortMock.mockReset();
    });

    test('should returns json data of a request', async () => {
      fetchMock.mockReturnValueOnce({
        ok: true,
        async json() {
          return { foo: 'bar' };
        },
      });
      expect(await fetchJSON('fake')).toEqual({ foo: 'bar' });
    });

    test('should add `Content-Type` and `Accept` headers', async () => {
      fetchMock.mockReturnValue({
        ok: true,
        async json() {
          return { foo: 'bar' };
        },
      });
      await fetchJSON('fake', {
        method: 'post',
        body: 'something',
        headers: { fakeHeader: 'foo' },
      });
      expect(fetchMock).toHaveBeenCalledWith(
        'fake',
        expect.objectContaining({
          method: 'post',
          body: 'something',
          headers: {
            fakeHeader: 'foo',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }),
      );
    });

    test('should throw a fetch error if response is not `ok`', async () => {
      const fakeResp = {
        ok: false,
        status: 500,
        statusText: 'Internal server error',
        async json() {
          return { error: 'error' };
        },
      };
      fetchMock.mockReturnValue(fakeResp);
      let error: any;

      try {
        await fetchJSON('fake', { headers: { fakeHeader: 'foo' } });
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(FetchError);
      expect(error.message).toBe('Internal server error');
      expect(error.response).toBe(fakeResp);
      expect(error.data).toEqual({ error: 'error' });
    });

    test('should throw a timeout error if request timeout', () => {
      jest.useFakeTimers();

      fetchMock.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(createAbortError());
            }, 1000);
          }),
      );
      let error: any = null;

      fetchJSON('fake', { timeout: 1000, retries: [] }).catch(e => {
        error = e;
      });
      jest.advanceTimersByTime(999);
      jest.runAllTicks();
      expect(error).toBe(null);
      expect(abortMock).not.toHaveBeenCalled();
      jest.advanceTimersByTime(10);
      jest.runAllTicks();
      expect(abortMock).toHaveBeenCalled();
      expect(error).toBeInstanceOf(TypeError);
      expect(error.message).toBe(TIMEOUT_ERROR_MESSAGE);
    });

    test.only('should retries before timeout', () => {
      jest.useFakeTimers();

      fetchMock.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            setTimeout(() => reject(createAbortError()), 1000);
          }),
      );
      let error: any = null;

      fetchJSON('fake', { timeout: 1000, retries: [1000, 3000] }).catch(e => {
        error = e;
      });
      jest.advanceTimersByTime(1000);
      expect(error).toBe(null);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1000);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(error).toBe(null);
      jest.advanceTimersByTime(4000);
      expect(error).toBe(null);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      jest.advanceTimersByTime(1000);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(abortMock).toHaveBeenCalled();
      expect(error).toBeInstanceOf(TypeError);
      expect(error.message).toBe(TIMEOUT_ERROR_MESSAGE);
    });

    test('should not throw a timeout error if request is aborted', () => {
      jest.useFakeTimers();
      fetchMock.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(createAbortError());
            }, 500);
          }),
      );
      let error: any = null;

      fetchJSON('fake', { timeout: 1000 }).catch(e => {
        error = e;
      });
      jest.runAllTimers();
      jest.runAllTicks();
      expect(abortMock).not.toHaveBeenCalled();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Aborted');
      expect(error.name).toBe('AbortError');
    });

    test('should rethrow fetch error', () => {
      jest.useFakeTimers();
      fetchMock.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new TypeError('other error'));
            }, 500);
          }),
      );
      let error: any = null;

      fetchJSON('fake', { timeout: 1000 }).catch(e => {
        error = e;
      });
      jest.runAllTimers();
      jest.runAllTicks();
      expect(error).toBeInstanceOf(TypeError);
      expect(error.message).toBe('other error');
    });

    test('should throw an error if json decoding fails', () => {
      jest.useFakeTimers();
      fetchMock.mockReturnValue({
        ok: true,
        async json() {
          throw new Error('error decoding');
        },
      });
      let error: any = null;

      fetchJSON('fake').catch(e => {
        error = e;
      });
      jest.runAllTicks();
      expect(error).toBeInstanceOf(FetchError);
      expect(error.message).toBe(ERRORS.JSON_DECODING_ERROR);
      expect(error.data).toEqual({ error: ERRORS.JSON_DECODING_ERROR });
    });
  });

  // TODO postData tests
});
