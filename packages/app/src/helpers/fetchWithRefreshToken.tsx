import ERRORS from '@azzapp/shared/errors';
import { fetchJSON } from '@azzapp/shared/networkHelpers';
import { refreshTokens } from '@azzapp/shared/WebAPI';
import { clearTokens, getTokens, setTokens } from './tokensStore';

async function fetchWithRefreshToken<JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit & { timeout?: number; retries?: number[] },
): Promise<JSON> {
  const tokens = getTokens();
  if (!tokens) {
    return fetchJSON(input, init);
  }
  const { token, refreshToken } = tokens;
  try {
    return await fetchJSON<JSON>(input, injectToken(token, init));
  } catch (e) {
    if (e instanceof Error && e.message === ERRORS.INVALID_TOKEN) {
      try {
        const tokens = await refreshTokens(refreshToken);
        await setTokens(tokens);
      } catch {
        await clearTokens().catch(() => void 0);
        return fetchJSON(input, init);
      }
      const token = getTokens()?.token;
      return fetchJSON<JSON>(input, injectToken(token, init));
    }
    throw e;
  }
}

export const injectToken = (token?: string, init?: RequestInit) => ({
  ...init,
  headers: token
    ? { ...init?.headers, Authorization: `Bearer ${token}` }
    : init?.headers,
});

export default fetchWithRefreshToken;
