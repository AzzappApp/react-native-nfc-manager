import { Observable } from 'relay-runtime';
import { executeWithRetries } from './asyncHelpers';
import ERRORS from './errors';
import { combineLatest } from './observableHelpers';
import type { Sink } from 'relay-runtime/lib/network/RelayObservable';

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = [1000, 3000];

export const PLATFORM_HEADER = 'X-Platform';

export type FetchFunction<ReturnType> = (
  input: RequestInfo,
  init?: RequestInit,
) => Promise<ReturnType>;

/**
 * A function used to handle JSON request with parametrable timeout and retries
 *
 * @param input identical to the native fetch input parameter
 * @param init identical to the native fetch init parameter but with a `timeout` option
 * if not provided a timeout of 15 seconds will be used, and a `retries` option that
 * is an array of number representing the time in milliseconds between each retry.
 * If not provided, the default value will be [1000, 3000]
 *
 * @returns a Promise that will be resolved with the json data of the response
 */
export const fetchJSON = async <JSON>(
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

  const response = await fetchWithRetries(input, init);

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
  let data;
  try {
    data = await response.json();
  } catch (error: any) {
    data = { error: ERRORS.JSON_DECODING_ERROR, details: error.message };
  }

  throw new FetchError({
    message: data.message ?? response.statusText,
    response,
    data,
  });
};

/**
 * A function used to handle Blob request with parametrable timeout and retries
 *
 * @param input @see fetchJSON
 * @param init @see fetchJSON
 * @returns a Promise that will be resolved with the blob data of the response
 */
export const fetchBlob = async (
  input: RequestInfo,
  init?: RequestInit & { timeout?: number; retries?: number[] },
) => {
  const response = await fetchWithRetries(input, init);

  if (response.ok) {
    try {
      return response.blob();
    } catch {
      throw new FetchError({
        message: ERRORS.BLOB_DECODING_ERROR,
        response,
        data: { error: ERRORS.BLOB_DECODING_ERROR },
      });
    }
  }

  let data;
  try {
    data = await response.json();
  } catch (error: any) {
    data = { error: ERRORS.BLOB_DECODING_ERROR, details: error.message };
  }

  throw new FetchError({
    message: data.message ?? response.statusText,
    response,
    data,
  });
};

/**
 * A function used to handle fetch request with parametrable timeout and retries
 */
export const fetchWithRetries = async (
  input: RequestInfo,
  init?: RequestInit & { timeout?: number; retries?: number[] },
): Promise<Response> => {
  const retries = init?.retries ?? DEFAULT_RETRIES;
  return executeWithRetries(
    () => fetchWithTimeout(input, init),
    retries,
    error => error instanceof TypeError,
  );
};

/**
 * A function used to handle fetch request with parametrable timeout
 */
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

export const isNetworkError = (error: Error) => {
  if (
    error instanceof TypeError &&
    (error.message === 'Network request failed' ||
      error.message === TIMEOUT_ERROR_MESSAGE)
  ) {
    return true;
  }
  return false;
};

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
  /**
   * The HTTP status code of the response
   */
  status?: number;
  /**
   * The URL that was requested
   */
  url?: string;
  /**
   * Additional details about the error
   */
  details?: string;

  constructor({
    message,
    response,
    data,
  }: {
    message: string;
    response?: Response;
    data?: any;
  }) {
    // Keep the original message format
    super(data?.message ?? message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }

    this.name = 'FetchError';
    this.response = response;
    this.data = data;

    if (response) {
      this.status = response.status;
      this.url = response.url;
    }

    // Store additional details separately
    let details = '';
    if (response) {
      details += `Status: ${response.status} ${response.statusText}`;
      if (response.url) {
        details += `\nURL: ${response.url}`;
      }
    }

    if (data) {
      if (typeof data === 'object') {
        if (data.error) {
          details += `\nError: ${data.error}`;
        }
        if (data.message) {
          details += `\nDetails: ${data.message}`;
        }
        if (data.details) {
          details += `\nAdditional Details: ${data.details}`;
        }
      } else {
        details += `\nResponse: ${data}`;
      }
    }

    this.details = details;
  }

  /**
   * Returns a string representation of the error
   */
  toString(): string {
    return `FetchError: ${this.message}${this.details ? `\n${this.details}` : ''}`;
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
 * > Note: The `progress` Observable won't emit valid value in debug mode
 * (see https://stackoverflow.com/questions/74628502/react-native-xhr-upload-onprogress-showing-inaccurate-result)
 *
 */
export const postFormData = (
  url: string,
  formData: FormData,
  responseType: XMLHttpRequestResponseType = 'json',
  signal?: AbortSignal,
) => {
  let progressSink: Sink<{ loaded: number; total: number }> | null;
  const progress: Observable<{ loaded: number; total: number }> =
    Observable.create(sink => {
      progressSink = sink;
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
      progressSink?.next({
        loaded: event.loaded,
        total: event.total,
      });
    };

    xhr.open('POST', url);

    xhr.send(formData);
  });

  return { promise, progress };
};

export const combineMultiUploadProgresses = (
  observables: Array<Observable<{ loaded: number; total: number }>>,
): Observable<number> =>
  combineLatest(observables).map(progresses => {
    const { total, loaded } = progresses.reduce(
      (a, b) => ({
        total: a.total + b.total,
        loaded: a.loaded + b.loaded,
      }),
      {
        total: 0,
        loaded: 0,
      },
    );
    return total === 0 ? 0 : loaded / total;
  });

export const isAbortError = (error: any) =>
  error instanceof Error && error.name === 'AbortError';

export const createAbortError = () => {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
};
