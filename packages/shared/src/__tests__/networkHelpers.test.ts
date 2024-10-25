import ERRORS from '../errors';
import { flushPromises } from '../jestHelpers';
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
            'x-vercel-protection-bypass': '',
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

    test('should throw a timeout error if request timeout', async () => {
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
      await flushPromises();
      expect(error).toBe(null);
      expect(abortMock).not.toHaveBeenCalled();
      jest.advanceTimersByTime(10);
      await flushPromises();
      expect(abortMock).toHaveBeenCalled();
      expect(error).toBeInstanceOf(TypeError);
      expect(error.message).toBe(TIMEOUT_ERROR_MESSAGE);
    });

    test('should retries before timeout', async () => {
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
      // after 1000
      jest.advanceTimersByTime(1000);
      await flushPromises();
      expect(error).toBe(null);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // after 2000
      jest.advanceTimersByTime(1000);
      await flushPromises();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(error).toBe(null);

      // after 3000
      jest.advanceTimersByTime(1000);
      await flushPromises();
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(error).toBe(null);

      // after 6000
      jest.advanceTimersByTime(3000);
      await flushPromises();
      expect(error).toBe(null);
      expect(fetchMock).toHaveBeenCalledTimes(3);

      // after 7000
      jest.advanceTimersByTime(1000);
      await flushPromises();
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(abortMock).toHaveBeenCalled();
      expect(error).toBeInstanceOf(TypeError);
      expect(error.message).toBe(TIMEOUT_ERROR_MESSAGE);
    });

    test('should not throw a timeout error if request is aborted', async () => {
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
      jest.advanceTimersByTime(500);
      await flushPromises();
      jest.runAllTimers();
      await flushPromises();
      expect(abortMock).not.toHaveBeenCalled();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Aborted');
      expect(error.name).toBe('AbortError');
    });

    test('should rethrow fetch error', async () => {
      jest.useFakeTimers();
      fetchMock.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Error('other error'));
            }, 500);
          }),
      );
      let error: any = null;

      fetchJSON('fake', { timeout: 1000 }).catch(e => {
        error = e;
      });
      jest.runAllTimers();
      await flushPromises();
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('other error');
    });

    test('should throw an error if json decoding fails', async () => {
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
      await flushPromises();
      expect(error).toBeInstanceOf(FetchError);
      expect(error.message).toBe(ERRORS.JSON_DECODING_ERROR);
      expect(error.data).toEqual({ error: ERRORS.JSON_DECODING_ERROR });
    });
  });

  // TODO postData tests
});
