import { Observable } from 'relay-runtime';
import { executeWithRetries } from './asyncHelpers';
import ERRORS from './errors';
import type { Sink } from 'relay-runtime/lib/network/RelayObservable';

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = [1000, 3000];

/**
 * A function used to handle JSON request with parametrable timeout
 *
 * @param input identical to the native fetch input parameter
 * @param init identical to the native fetch init parameter but with a `timeout` option
 * if not provided a timeout of 15 seconds will be used
 * @param addHeaders if true the `Content-type: application/json` header will be
 * added to the request - default true
 * @returns
 */
export const fetchJSON = async <JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit & { timeout?: number; retries?: number[] },
): Promise<JSON> => {
  init = {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    },
  };
  const response: Response = await fetchWithRetries(input, init);

  if (response.ok) {
    try {
      return await response.json();
    } catch {
      throw new FetchError({
        message: ERRORS.JSON_DECODING_ERROR,
        response,
        data: { error: ERRORS.JSON_DECODING_ERROR },
      });
    }
  }
  const data = await response.json().catch(() => ({}));

  throw new FetchError({
    message: data.message ?? response.statusText,
    response,
    data,
  });
};

export const fetchWithRetries = async (
  input: RequestInfo,
  init?: RequestInit & { timeout?: number; retries?: number[] },
): Promise<Response> => {
  const retries = init?.retries ?? DEFAULT_RETRIES;
  return executeWithRetries(
    () => fetchWithTimeout(input, init),
    retries,
    error =>
      error instanceof TypeError && error.message === TIMEOUT_ERROR_MESSAGE,
  );
};

export const fetchWithTimeout = async (
  input: RequestInfo,
  init?: RequestInit & { timeout?: number },
): Promise<Response> => {
  const timeout = init?.timeout ?? DEFAULT_TIMEOUT;
  const signal = init?.signal;

  let isTimeout = false;
  const abortController = new AbortController();

  const onAbort = () => {
    abortController.abort();
  };
  signal?.addEventListener('abort', onAbort);

  const timeoutHandle = setTimeout(() => {
    isTimeout = true;
    abortController.abort();
  }, timeout);

  let response: Response;
  try {
    init = {
      ...init,
      signal: abortController.signal,
    };
    response = await fetch(input, init);
  } catch (error) {
    if (isTimeout && isAbortError(error)) {
      throw new TypeError(TIMEOUT_ERROR_MESSAGE);
    }
    throw error;
  } finally {
    signal?.removeEventListener('abort', onAbort);
    clearTimeout(timeoutHandle);
  }
  return response;
};

export const TIMEOUT_ERROR_MESSAGE = 'TIMEOUT';

/**
 * A special error thrown by `fetchJSON`
 */
export class FetchError extends Error {
  /**
   * The fetch response of the request
   */
  response?: Response;
  /**
   * The json data of the request
   */
  data: any;
  constructor({
    message,
    response,
    data,
  }: {
    message: string;
    response?: Response;
    data?: any;
  }) {
    super(data?.message ?? message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }
    this.name = 'FetchError';
    this.response = response;
    this.data = data;
  }
}

/**
 * A method used to perform multipart/encoded request, used to upload file.
 *
 * @param url the request url
 * @param formData the form data
 * @param responseType the type of response of the request - default 'json'
 * @param signal an abort signal that can be passed to cancel the request
 * @returns an object containing a `promise` field containing a Promise that
 * will be resolved when the request is fulfiled and an `progress` field containing
 * an Observable reprensenting upload progress.
 *
 */
export const postFormData = (
  url: string,
  formData: FormData,
  responseType: XMLHttpRequestResponseType = 'json',
  signal?: AbortSignal,
) => {
  let progressSink: Sink<number> | null;
  const progress: Observable<number> = Observable.create(sink => {
    progressSink = sink;
    progressSink.next(0);
  });

  const promise = new Promise<any>((resolve, reject) => {
    const signalAbortHandler = () => {
      xhr.abort();
      clean();
    };

    signal?.addEventListener('abort', signalAbortHandler);

    const clean = () => {
      progressSink?.complete();
      signal?.removeEventListener('abort', signalAbortHandler);
    };

    const xhr = new XMLHttpRequest();

    xhr.responseType = responseType;
    xhr.onload = () => {
      clean();
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        const message =
          xhr.response?.message ??
          xhr.response?.error?.message ??
          xhr.response?.error ??
          'UploadError';
        reject(
          new FetchError({
            message,
            data: xhr.response,
          }),
        );
      }
    };

    xhr.onerror = () => {
      clean();
      reject(new TypeError());
    };

    xhr.onabort = () => {
      clean();
      reject(createAbortError());
    };

    xhr.upload.onprogress = event => {
      progressSink?.next(event.loaded / event.total);
    };

    xhr.open('POST', url);
    xhr.send(formData);
  });

  return { promise, progress };
};

export const isAbortError = (error: any) =>
  error instanceof Error && error.name === 'AbortError';

export const createAbortError = () => {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
};
