import { compressToEncodedURIComponent } from 'lz-string';
import { matchUrlWithRoute } from '#helpers/deeplinkHelpers';
import { verifySign } from '#helpers/MobileWebAPI';

jest.mock('#helpers/MobileWebAPI');
jest.mock('#components/ShakeShare', () => ({
  openShakeShare: jest.fn(() => {
    console.log('Mock openShakeShare called');
  }),
}));
describe('deeplinkHelpers', () => {
  const verifySignMock = jest.mocked(verifySign);

  beforeEach(() => {
    verifySignMock.mockReset();
  });

  test('should redirect to profile', async () => {
    const res = await matchUrlWithRoute(`${process.env.NEXT_PUBLIC_URL}123`);

    expect(res).toEqual({
      route: 'WEBCARD',
      params: {
        userName: '123',
      },
    });
  });

  test('should redirect to profile with contactData', async () => {
    verifySignMock.mockReturnValueOnce(
      Promise.resolve({
        urls: [
          {
            selected: true,
            address: 'https://www.linkedin.com/in/alexander-kozlov-5b4a1b1b/',
          },
        ],
        socials: [
          {
            selected: true,
            label: 'LinkedIn',
            url: 'https://www.linkedin.com/in/alexander-kozlov-5b4a1b1b/',
          },
        ],
      }),
    );

    const compressedCard = compressToEncodedURIComponent(
      JSON.stringify(['contact123', 'sign123']),
    );

    const res = await matchUrlWithRoute(
      `${process.env.NEXT_PUBLIC_URL}/123?c=${compressedCard}`,
    );

    expect(verifySignMock).toBeCalledTimes(1);
    expect(verifySignMock).toBeCalledWith({
      signature: 'sign123',
      data: 'contact123',
      salt: '123',
    });

    expect(res).toEqual({
      route: 'WEBCARD',
      params: {
        userName: '123',
        contactData: 'contact123',
        additionalContactData: {
          urls: [
            {
              selected: true,
              address: 'https://www.linkedin.com/in/alexander-kozlov-5b4a1b1b/',
            },
          ],
          socials: [
            {
              selected: true,
              label: 'LinkedIn',
              url: 'https://www.linkedin.com/in/alexander-kozlov-5b4a1b1b/',
            },
          ],
        },
      },
    });
  });

  test('should redirect to profile without contactData', async () => {
    verifySignMock.mockRejectedValueOnce(new Error('something bad happened'));

    const compressedCard = compressToEncodedURIComponent(
      JSON.stringify(['contact124', 'sign124']),
    );

    const res = await matchUrlWithRoute(
      `${process.env.NEXT_PUBLIC_URL}124?c=${compressedCard}`,
    );

    expect(verifySignMock).toBeCalledTimes(1);
    expect(verifySignMock).toBeCalledWith({
      signature: 'sign124',
      data: 'contact124',
      salt: '124',
    });

    expect(res).toEqual({
      route: 'WEBCARD',
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

  test('should redirect to a post', async () => {
    const res = await matchUrlWithRoute('https://fake-azzapp.com/123/post/456');

    expect(res).toEqual({
      route: 'POST',
      params: {
        postId: 'UG9zdDo0NTY=', //fromGlobalId post
      },
    });
  });

  test('should redirect to a webcard if there is not post id', async () => {
    const res = await matchUrlWithRoute('https://fake-azzapp.com/123/post');

    expect(res).toEqual({
      route: 'WEBCARD',
      params: {
        userName: '123',
      },
    });
  });

  test('should redirect to email signature screen if the web route match', async () => {
    const res = await matchUrlWithRoute(
      'https://fake-azzapp.com/123/emailsignature?e=compressedCard&mode=simple',
    );

    expect(res).toEqual({
      route: 'EMAIL_SIGNATURE',
      params: {
        userName: '123',
        compressedContactCard: 'compressedCard',
        mode: 'simple',
      },
    });
  });

  test('invite should redirect to home', async () => {
    const res = await matchUrlWithRoute('https://fake-azzapp.com/123/invite');

    expect(res).toEqual({
      route: 'HOME',
    });
  });
});
