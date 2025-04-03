import * as Sentry from '@sentry/react-native';
import { ImageFormat } from '@shopify/react-native-skia';
import { File } from 'expo-file-system/next';
import ShareCommand from 'react-native-share';
import { sanitizeFilePath } from '#helpers/fileHelpers';
import { convertSvgToImageFile } from './mediaEditions';

const targetQRCodeImageSize = 1024;

const DownloadQrCode = async (profileId: string, qrCode: string) => {
  try {
    const filePath = await convertSvgToImageFile({
      filePath: sanitizeFilePath(`QrCode-${profileId}`),
      svg: qrCode,
      format: ImageFormat.PNG,
      resolution: {
        width: targetQRCodeImageSize,
        height: targetQRCodeImageSize,
      },
      quality: 95,
    });

    if (!filePath) return;

    // share the file
    await ShareCommand.open({
      url: filePath,
      type: 'image/png',
      failOnCancel: false,
      saveToFiles: true,
    });

    // clean up file afterward
    new File(filePath).delete();
  } catch (e) {
    console.error('error generating qrCode ', e);
    Sentry.captureException(e);
  }
};

export default DownloadQrCode;
