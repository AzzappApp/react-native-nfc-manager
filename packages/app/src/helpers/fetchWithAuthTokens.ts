import ERRORS from '@azzapp/shared/errors';
import { fetchJSON } from '@azzapp/shared/networkHelpers';
import { refreshTokens } from '@azzapp/shared/WebAPI';
import * as authStore from './authStore';
import { dispatchGlobalEvent } from './globalEvents';
import type { TokensResponse } from '@azzapp/shared/WebAPI';

/**
 * Fetches JSON data from the server, injecting the token in the header
 * if the token is invalid, it will try to refresh it
 *
 * @param input - The resource that you wish to fetch.
 * @param init - An options object containing any custom settings that you want to apply to the request.
 * @returns A promise that resolves to the JSON response data.
 */
async function fetchWithAuthTokens<JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit & { timeout?: number; retries?: number[] },
): Promise<JSON> {
  const tokens = authStore.getTokens();
  if (!tokens) {
    return fetchJSON(input, init);
  }
  const { token, refreshToken } = tokens;
  try {
    return await fetchJSON<JSON>(input, injectToken(token, init));
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
      return fetchJSON<JSON>(input, injectToken(refreshedTokens.token, init));
    }
    throw e;
  }
}

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
