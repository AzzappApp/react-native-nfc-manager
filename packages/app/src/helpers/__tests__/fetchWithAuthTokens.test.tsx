import ERRORS from '@azzapp/shared/errors';
import { fetchJSON } from '@azzapp/shared/networkHelpers';
import { refreshTokens } from '@azzapp/shared/WebAPI';
import fetchWithAuthTokens from '#helpers/fetchWithAuthTokens';
import { clearTokens, getTokens, setTokens } from '#helpers/tokensStore';

jest.mock('#helpers/tokensStore', () => ({
  getTokens: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
}));

jest.mock('@azzapp/shared/networkHelpers', () => ({
  fetchJSON: jest.fn(),
}));

jest.mock('@azzapp/shared/WebAPI', () => ({
  refreshTokens: jest.fn(),
}));

const getTokensMock = getTokens as jest.MockedFunction<typeof getTokens>;
const setTokensMock = setTokens as jest.MockedFunction<typeof setTokens>;
const clearTokensMock = clearTokens as jest.MockedFunction<typeof clearTokens>;
const fetchJSONMock = fetchJSON as jest.MockedFunction<typeof fetchJSON>;
const refreshTokensMock = refreshTokens as jest.MockedFunction<
  typeof refreshTokens
>;

jest.useFakeTimers();
describe('fetchWithAuthTokens', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('should not amend the request if there is no tokens in the store', () => {
    getTokensMock.mockReturnValueOnce(null);
    void fetchWithAuthTokens('https://example.com', { method: 'POST' });
    expect(fetchJSONMock).toHaveBeenCalledWith('https://example.com', {
      method: 'POST',
    });
  });

  test('should amend the request if there is tokens in the store', () => {
    getTokensMock.mockReturnValueOnce({
      token: 'fakeToken',
      refreshToken: 'fakeRefreshToken',
    });
    void fetchWithAuthTokens('https://example.com', { method: 'POST' });
    expect(fetchJSONMock).toHaveBeenCalledWith('https://example.com', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fakeToken',
      },
    });
  });

  test('should refresh the token if the token is invalid', () => {
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
    setTokensMock.mockResolvedValueOnce(undefined);

    void fetchWithAuthTokens('https://example.com', { method: 'POST' });
    jest.runAllTicks();

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
    expect(setTokensMock).toHaveBeenCalledWith({
      token: 'fakeToken2',
      refreshToken: 'fakeRefreshToken2',
    });
  });

  test('should clear the tokens if the refresh token is invalid', () => {
    getTokensMock.mockReturnValueOnce({
      token: 'fakeToken',
      refreshToken: 'fakeRefreshToken',
    });
    fetchJSONMock.mockRejectedValueOnce(new Error(ERRORS.INVALID_TOKEN));
    refreshTokensMock.mockRejectedValueOnce(new Error(ERRORS.INVALID_TOKEN));
    clearTokensMock.mockResolvedValueOnce(undefined);

    void fetchWithAuthTokens('https://example.com', { method: 'POST' });
    jest.runAllTicks();

    expect(fetchJSONMock).toHaveBeenNthCalledWith(1, 'https://example.com', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fakeToken',
      },
    });
    expect(fetchJSONMock).toHaveBeenNthCalledWith(2, 'https://example.com', {
      method: 'POST',
    });
    expect(clearTokensMock).toHaveBeenCalled();
  });

  test('should throw an error if the error is not invalid token', () => {
    expect.assertions(2);
    fetchJSONMock.mockRejectedValueOnce(new Error(ERRORS.UNAUTORIZED));
    fetchWithAuthTokens('https://example.com', { method: 'POST' }).catch(e => {
      expect(e.message).toBe(ERRORS.UNAUTORIZED);
    });
    expect(fetchJSONMock).toHaveBeenCalledTimes(1);
    jest.runAllTicks();
  });

  test('should return the result of the request ', () => {
    expect.assertions(1);
    fetchJSONMock.mockResolvedValueOnce({ data: 'fakeData' });
    void fetchWithAuthTokens('https://example.com', { method: 'POST' }).then(
      res => {
        expect(res).toEqual({ data: 'fakeData' });
      },
    );
    jest.runAllTicks();
  });
});
