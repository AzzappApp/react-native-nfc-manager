import * as Sentry from '@sentry/react-native';
import ShareCommand from 'react-native-share';
import DownloadQrCode from '../DownloadQrCode';
import { convertSvgToImageFile } from '../mediaEditions/mediasExport';

jest.mock('../mediaEditions/mediasExport');
jest.mock('expo-file-system/next', () => {
  const deleteMock = jest.fn();
  return {
    File: jest.fn().mockImplementation(path => ({
      path,
      delete: deleteMock,
    })),
    Paths: { cache: { uri: '/cache' } },
    __mocks__: {
      deleteMock,
    },
  };
});
jest.mock('react-native-share', () => ({
  open: jest.fn(),
}));
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
const mockConvertSvgToImageFile = convertSvgToImageFile as jest.Mock;
const mockShareOpen = ShareCommand.open as jest.Mock;
const mockCaptureException = Sentry.captureException as jest.Mock;
const { deleteMock } = (jest.requireMock('expo-file-system/next') as any)
  .__mocks__;
jest.mock('react-native-compressor', () => ({
  getVideoMetaData: jest.fn(),
}));

describe('DownloadQrCode', () => {
  const profileId = 'user123';
  const qrCodeSvg = '<svg></svg>';
  const filePath = '/mock/cache/QrCode-user123.png';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save, share, and delete the QR code file', async () => {
    mockConvertSvgToImageFile.mockResolvedValue(filePath);

    await DownloadQrCode(profileId, qrCodeSvg);

    expect(mockConvertSvgToImageFile).toHaveBeenCalled();
    expect(mockShareOpen).toHaveBeenCalledWith(
      expect.objectContaining({ url: filePath }),
    );
    expect(deleteMock).toHaveBeenCalled();
  });

  it('should not proceed if convertSvgToImageFile returns undefined', async () => {
    mockConvertSvgToImageFile.mockResolvedValue(undefined);

    await DownloadQrCode(profileId, qrCodeSvg);

    expect(mockShareOpen).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('should capture and log error if something fails', async () => {
    const error = new Error('share failed');
    mockConvertSvgToImageFile.mockImplementation(() => {
      throw error;
    });

    await DownloadQrCode(profileId, qrCodeSvg);

    expect(mockCaptureException).toHaveBeenCalledWith(error);
    expect(deleteMock).not.toHaveBeenCalled(); // file was never created
  });
});
