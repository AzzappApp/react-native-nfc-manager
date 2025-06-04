import ERRORS from '@azzapp/shared/errors';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import { fetchJSON } from '@azzapp/shared/networkHelpers';
import { getTokens } from '#helpers/authStore';
import fetchWithAuthTokens from '#helpers/fetchWithAuthTokens';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { refreshTokens } from '#helpers/WebAPI';

jest.mock('#helpers/authStore', () => ({
  getTokens: jest.fn(),
}));

jest.mock('#helpers/globalEvents', () => ({
  dispatchGlobalEvent: jest.fn(),
}));

jest.mock('@azzapp/shared/networkHelpers', () => ({
  fetchJSON: jest.fn(),
}));

jest.mock('#helpers/WebAPI', () => ({
  refreshTokens: jest.fn(),
}));

const getTokensMock = getTokens as jest.MockedFunction<typeof getTokens>;
const fetchJSONMock = fetchJSON as jest.MockedFunction<typeof fetchJSON>;
const refreshTokensMock = refreshTokens as jest.MockedFunction<
  typeof refreshTokens
>;

jest.useFakeTimers();
describe('fetchWithAuthTokens', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should not amend the request if there is no tokens in the store', () => {
    getTokensMock.mockReturnValueOnce(null);
    fetchJSONMock.mockResolvedValueOnce({ data: 'fakeData' });
    void fetchWithAuthTokens(fetchJSONMock)('https://example.com', {
      method: 'POST',
    });
    expect(fetchJSONMock).toHaveBeenCalledWith('https://example.com', {
      method: 'POST',
    });
  });

  test('should amend the request if there is tokens in the store', () => {
    getTokensMock.mockReturnValueOnce({
      token: 'fakeToken',
      refreshToken: 'fakeRefreshToken',
    });
    fetchJSONMock.mockResolvedValueOnce({ data: 'fakeData' });
    void fetchWithAuthTokens(fetchJSONMock)('https://example.com', {
      method: 'POST',
    });
    expect(fetchJSONMock).toHaveBeenCalledWith('https://example.com', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fakeToken',
      },
    });
  });

  test('should refresh the token if the token is invalid', async () => {
    getTokensMock.mockReturnValueOnce({
      token: 'fakeToken',
      refreshToken: 'fakeRefreshToken',
    });
    getTokensMock.mockReturnValueOnce({
      token: 'fakeToken2',
      refreshToken: 'fakeRefreshToken2',
    });
    fetchJSONMock.mockRejectedValueOnce(new Error(ERRORS.INVALID_TOKEN));
    refreshTokensMock.mockResolvedValueOnce({
      token: 'fakeToken2',
      refreshToken: 'fakeRefreshToken2',
    });

    void fetchWithAuthTokens(fetchJSONMock)('https://example.com', {
      method: 'POST',
    });
    await flushPromises();

    expect(fetchJSONMock).toHaveBeenNthCalledWith(1, 'https://example.com', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fakeToken',
      },
    });
    expect(fetchJSONMock).toHaveBeenNthCalledWith(2, 'https://example.com', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fakeToken2',
      },
    });
    expect(dispatchGlobalEvent).toHaveBeenCalledWith({
      type: 'TOKENS_REFRESHED',
      payload: {
        authTokens: {
          token: 'fakeToken2',
          refreshToken: 'fakeRefreshToken2',
        },
      },
    });
  });

  test('should refresh the token if the token is invalid - graphql error case', async () => {
    getTokensMock.mockReturnValueOnce({
      token: 'fakeToken',
      refreshToken: 'fakeRefreshToken',
    });
    getTokensMock.mockReturnValueOnce({
      token: 'fakeToken2',
      refreshToken: 'fakeRefreshToken2',
    });
    fetchJSONMock.mockResolvedValue({
      errors: [{ message: ERRORS.INVALID_TOKEN }],
    });
    refreshTokensMock.mockResolvedValueOnce({
      token: 'fakeToken2',
      refreshToken: 'fakeRefreshToken2',
    });

    void fetchWithAuthTokens(fetchJSONMock)('https://example.com', {
      method: 'POST',
    });
    await flushPromises();

    expect(fetchJSONMock).toHaveBeenNthCalledWith(1, 'https://example.com', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fakeToken',
      },
    });
    expect(fetchJSONMock).toHaveBeenNthCalledWith(2, 'https://example.com', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fakeToken2',
      },
    });
    expect(dispatchGlobalEvent).toHaveBeenCalledWith({
      type: 'TOKENS_REFRESHED',
      payload: {
        authTokens: {
          token: 'fakeToken2',
          refreshToken: 'fakeRefreshToken2',
        },
      },
    });
  });

  test('should throw an error if the refresh token is invalid', () => {
    expect.assertions(3);
    getTokensMock.mockReturnValueOnce({
      token: 'fakeToken',
      refreshToken: 'fakeRefreshToken',
    });
    fetchJSONMock.mockRejectedValueOnce(new Error(ERRORS.INVALID_TOKEN));

    refreshTokensMock.mockRejectedValueOnce(new Error(ERRORS.INVALID_TOKEN));

    fetchWithAuthTokens(fetchJSONMock)('https://example.com', {
      method: 'POST',
    }).catch(e => {
      expect(e.message).toBe(ERRORS.INVALID_TOKEN);
    });
    jest.runAllTicks();

    expect(fetchJSONMock).toHaveBeenCalledWith('https://example.com', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fakeToken',
      },
    });
    expect(fetchJSONMock).toHaveBeenCalledTimes(1);
  });

  test('should throw an error if the error is not invalid token', () => {
    expect.assertions(2);
    fetchJSONMock.mockRejectedValueOnce(new Error(ERRORS.UNAUTHORIZED));
    fetchWithAuthTokens(fetchJSONMock)('https://example.com', {
      method: 'POST',
    }).catch(e => {
      expect(e.message).toBe(ERRORS.UNAUTHORIZED);
    });
    expect(fetchJSONMock).toHaveBeenCalledTimes(1);
  });

  test('should return the result of the request ', () => {
    expect.assertions(1);
    fetchJSONMock.mockResolvedValueOnce({ data: 'fakeData' });
    void fetchWithAuthTokens(fetchJSONMock)('https://example.com', {
      method: 'POST',
    }).then(res => {
      expect(res).toEqual({ data: 'fakeData' });
    });
  });
});
