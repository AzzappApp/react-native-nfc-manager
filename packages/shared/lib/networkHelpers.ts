import { Observable } from 'relay-runtime';
import ERRORS from './errors';
import type { Sink } from 'relay-runtime/lib/network/RelayObservable';

const DEFAULT_TIMEOUT = 15000;

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
export async function fetchJSON<JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit & { timeout?: number },
  addHeaders = true,
): Promise<JSON> {
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
    if (addHeaders) {
      init.headers = { 'Content-Type': 'application/json', ...init.headers };
    }
    response = await fetch(input, init);
  } catch (error) {
    if (isTimeout && isAbortError(error)) {
      throw new TypeError('Timeout');
    }
    throw error;
  } finally {
    signal?.removeEventListener('abort', onAbort);
    clearTimeout(timeoutHandle);
  }

  let data: JSON;
  try {
    data = await response.json();
  } catch {
    throw new FetchError({
      message: ERRORS.JSON_DECODING_ERROR,
      response,
      data: { error: ERRORS.JSON_DECODING_ERROR },
    });
  }
  if (response.ok) {
    return data;
  }

  throw new FetchError({
    message: response.statusText,
    response,
    data,
  });
}

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
