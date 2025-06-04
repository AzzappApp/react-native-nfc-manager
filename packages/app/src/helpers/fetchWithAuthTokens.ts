import ERRORS from '@azzapp/shared/errors';
import { type FetchFunction } from '@azzapp/shared/networkHelpers';
import * as authStore from './authStore';
import { dispatchGlobalEvent } from './globalEvents';
import { refreshTokens } from './WebAPI';
import type { TokensResponse } from './WebAPI';

/**
 * Fetches JSON data from the server, injecting the token in the header
 * if the token is invalid, it will try to refresh it
 *
 * @param input - The resource that you wish to fetch.
 * @param init - An options object containing any custom settings that you want to apply to the request.
 * @returns A promise that resolves to the JSON response data.
 */
const fetchWithAuthTokens =
  <ReturnType = unknown>(fetchFunction: FetchFunction<ReturnType>) =>
  async (
    input: RequestInfo,
    init?: RequestInit & {
      timeout?: number;
      retries?: number[];
    },
  ): Promise<ReturnType> => {
    const tokens = authStore.getTokens();
    if (!tokens) {
      return fetchFunction(input, init);
    }
    const { token, refreshToken } = tokens;
    try {
      const res = await fetchFunction(input, injectToken(token, init));

      if (
        (
          res as {
            errors?: Array<{ message: string }>;
          }
        ).errors?.some(e => e.message === ERRORS.INVALID_TOKEN)
      ) {
        throw new Error(ERRORS.INVALID_TOKEN);
      }

      return res;
    } catch (e) {
      if (e instanceof Error && e.message === ERRORS.INVALID_TOKEN) {
        let refreshedTokens: TokensResponse;
        try {
          refreshedTokens = await refreshTokens(refreshToken);
        } catch {
          throw e;
        }
        await dispatchGlobalEvent({
          type: 'TOKENS_REFRESHED',
          payload: {
            authTokens: refreshedTokens,
          },
        });
        return fetchFunction(input, injectToken(refreshedTokens.token, init));
      }
      throw e;
    }
  };

/**
 * Injects the token in the header of the request
 * @param token the token to inject
 * @param init the request init to inject the token in
 * @returns the request init with the token injected
 */
export const injectToken = (token?: string, init?: RequestInit) => ({
  ...init,
  headers: token
    ? { ...init?.headers, Authorization: `Bearer ${token}` }
    : init?.headers,
});

export default fetchWithAuthTokens;
