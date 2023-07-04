import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import { verifySign } from '#helpers/MobileWebAPI';

jest.mock('#helpers/MobileWebAPI');

describe('deeplinkHelpers', () => {
  const verifySignMock = jest.mocked(verifySign);

  beforeEach(() => {
    verifySignMock.mockReset();
  });

  test('should redirect to profile', async () => {
    const res = await matchUrlWithRoute('https://fake-azzapp.com/profile/123');

    expect(res).toEqual({
      route: 'PROFILE',
      params: {
        userName: '123',
      },
    });
  });

  test('no route found', async () => {
    const res = await matchUrlWithRoute('https://fake-azzapp.com/wrong/123');

    expect(res).toBeUndefined();
  });

  test('should redirect to profile with contactData', async () => {
    verifySignMock.mockReturnValueOnce(Promise.resolve({ message: 'ok' }));

    const res = await matchUrlWithRoute(
      'https://fake-azzapp.com/profile/123?c=contact123&s=sign123',
    );

    expect(verifySignMock).toBeCalledTimes(1);
    expect(verifySignMock).toBeCalledWith({
      signature: 'sign123',
      data: 'contact123',
      salt: '123',
    });

    expect(res).toEqual({
      route: 'PROFILE',
      params: {
        userName: '123',
        contactData: 'contact123',
      },
    });
  });

  test('should redirect to profile without contactData', async () => {
    verifySignMock.mockRejectedValueOnce(new Error('something bad happened'));

    const res = await matchUrlWithRoute(
      'https://fake-azzapp.com/profile/124?c=contact124&s=sign124',
    );

    expect(verifySignMock).toBeCalledTimes(1);
    expect(verifySignMock).toBeCalledWith({
      signature: 'sign124',
      data: 'contact124',
      salt: '124',
    });

    expect(res).toEqual({
      route: 'PROFILE',
      params: {
        userName: '124',
      },
    });
  });
});
