import { dispatchGlobalEvent } from '#helpers/globalEvents';
import fetchWithGlobalEvents from '../fetchWithGlobalEvents';

jest.mock('../globalEvents', () => ({
  dispatchGlobalEvent: jest.fn(),
}));

describe('fetchWithGlobalEvents', () => {
  afterEach(() => jest.clearAllMocks());

  test('should call fetchJSON with the given input and init parameters', async () => {
    const input = 'http://test.com';
    const init = { method: 'POST' };
    const fetchSpy = jest
      .fn()
      .mockResolvedValueOnce({ data: 'Sample response data' });

    const result = await fetchWithGlobalEvents(fetchSpy)(input, init);

    expect(result).toEqual({ data: 'Sample response data' });
    expect(fetchSpy).toHaveBeenCalledWith(input, init);
  });

  test('should dispatch a NETWORK_ERROR event if an error occurs', async () => {
    const input = 'http://test.com';
    const init = { method: 'POST' };
    const error = new Error('Sample error message');
    const fetchSpy = jest.fn().mockRejectedValueOnce(error);

    let errorThrown = null;
    try {
      await fetchWithGlobalEvents(fetchSpy)(input, init);
    } catch (error) {
      errorThrown = error;
    }

    expect(errorThrown).toEqual(error);
    expect(dispatchGlobalEvent).toHaveBeenCalledWith({
      type: 'NETWORK_ERROR',
      payload: { params: [input, init], error },
    });
  });
});
