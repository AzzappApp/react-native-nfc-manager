import { Platform } from 'react-native';
import {
  PLATFORM_HEADER,
  type FetchFunction,
} from '@azzapp/shared/networkHelpers';
import { dispatchGlobalEvent } from './globalEvents';

/**
 * An higher order function that wraps the fetch function and dispatches global events
 * In case of error, it dispatches a NETWORK_ERROR event
 *
 * @param fetchFunction The fetch function to wrap
 * @returns A function that wraps the fetch function and dispatches global events
 */
const fetchWithGlobalEvents =
  <ReturnType>(fetchFunction: FetchFunction<ReturnType>) =>
  async <ReturnType = unknown>(
    input: RequestInfo,
    init?: RequestInit & { timeout?: number; retries?: number[] },
  ): Promise<ReturnType> => {
    let result: any;
    try {
      const fetchInit = {
        ...init,
        headers: {
          ...init?.headers,
          [PLATFORM_HEADER]: Platform.OS,
        },
      };
      result = await fetchFunction(input, fetchInit);
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
