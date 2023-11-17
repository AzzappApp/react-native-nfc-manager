import { compressToEncodedURIComponent } from 'lz-string';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import { verifySign } from '#helpers/MobileWebAPI';

jest.mock('#helpers/MobileWebAPI');

describe('deeplinkHelpers', () => {
  const verifySignMock = jest.mocked(verifySign);

  beforeEach(() => {
    verifySignMock.mockReset();
  });

  test('should redirect to profile', async () => {
    const res = await matchUrlWithRoute('https://fake-azzapp.com/123');

    expect(res).toEqual({
      route: 'PROFILE',
      params: {
        userName: '123',
      },
    });
  });

  test('should redirect to profile with contactData', async () => {
    verifySignMock.mockReturnValueOnce(Promise.resolve({ message: 'ok' }));

    const compressedCard = compressToEncodedURIComponent(
      JSON.stringify(['contact123', 'sign123']),
    );

    const res = await matchUrlWithRoute(
      `https://fake-azzapp.com/123?c=${compressedCard}`,
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

    const compressedCard = compressToEncodedURIComponent(
      JSON.stringify(['contact124', 'sign124']),
    );

    const res = await matchUrlWithRoute(
      `https://fake-azzapp.com/124?c=${compressedCard}`,
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

  test('should redirect to reset password with token', async () => {
    const res = await matchUrlWithRoute(
      'https://fake-azzapp.com/reset-password/?token=123&issuer=azzapp',
    );

    expect(res).toEqual({
      route: 'RESET_PASSWORD',
      params: {
        token: '123',
        issuer: 'azzapp',
      },
    });
  });
});
