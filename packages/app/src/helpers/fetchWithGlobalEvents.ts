import { dispatchGlobalEvent } from './globalEvents';
import type { fetchJSON } from '@azzapp/shared/networkHelpers';

/**
 * An higher order function that wraps the fetch function and dispatches global events
 * In case of error, it dispatches a NETWORK_ERROR event
 *
 * @param fetchFunction The fetch function to wrap
 * @returns A function that wraps the fetch function and dispatches global events
 */
const fetchWithGlobalEvents =
  (fetchFunction: typeof fetchJSON) =>
  async <JSON = unknown>(
    input: RequestInfo,
    init?: RequestInit & { timeout?: number; retries?: number[] },
  ): Promise<JSON> => {
    let result: any;
    try {
      result = await fetchFunction(input, init);
    } catch (error) {
      await dispatchGlobalEvent({
        type: 'NETWORK_ERROR',
        payload: { params: [input, init], error },
      });
      throw error;
    }
    return result;
  };

export default fetchWithGlobalEvents;
