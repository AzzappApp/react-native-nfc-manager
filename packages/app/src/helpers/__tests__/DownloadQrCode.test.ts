import { captureException } from '@sentry/react-native';
import { File } from 'expo-file-system/next';
import ShareCommand from 'react-native-share';
import { flushPromises } from '@azzapp/shared/jestHelpers';
import DownloadQrCode from '#helpers/DownloadQrCode';
import { act } from '#helpers/testHelpers';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(),
}));

jest.mock('expo-file-system/next', () => {
  return {
    Paths: {
      cache: {
        uri: '/mock/cache/directory/',
      },
    },
    File: jest.fn().mockImplementation(() => {
      return {
        delete: jest.fn(),
        create: jest.fn(),
        write: jest.fn(),
      };
    }),
  };
});

describe('DownloadQrCode', () => {
  test('should create file with correct file path and call with correct qrCode value and delete the temp file', async () => {
    const writeMock = jest.fn();
    const deleteMock = jest.fn();
    jest.mocked(File).mockImplementation(
      () =>
        ({
          delete: deleteMock,
          create: jest.fn(),
          write: writeMock,
        }) as any,
    );
    await act(async () => {
      await DownloadQrCode('profileId', 'qrCode');
      flushPromises();
    });

    expect(File).toHaveBeenCalledWith(
      '/mock/cache/directory/QrCode-profileId.svg',
    );
    expect(writeMock).toHaveBeenCalledWith('qrCode');
    expect(deleteMock).toHaveBeenCalled();
  });

  test('should open ShareCommand with correct options', async () => {
    const mock = jest.mocked(ShareCommand);

    await act(async () => {
      await DownloadQrCode('profileId', 'qrCode');
    });

    expect(mock.open).toHaveBeenCalledWith({
      failOnCancel: false,
      saveToFiles: true,
      type: 'image/svg+xml',
      url: '/mock/cache/directory/QrCode-profileId.svg',
    });
  });

  test('should delete temp file on error', async () => {
    const deleteMock = jest.fn();
    const captureExceptionMock = jest.mocked(captureException);
    jest.mocked(File).mockImplementation(
      () =>
        ({
          delete: deleteMock,
          create: jest.fn(),
          write: jest.fn(() => {
            throw new Error();
          }),
        }) as any,
    );

    await act(async () => {
      await DownloadQrCode('profileId', 'qrCode');
    });

    expect(captureExceptionMock).toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalled();
  });
});
