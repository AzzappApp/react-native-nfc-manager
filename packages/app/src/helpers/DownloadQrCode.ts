import * as Sentry from '@sentry/react-native';
import { Paths, File } from 'expo-file-system/next';
import ShareCommand from 'react-native-share';
import { sanitizeFilePath } from '#helpers/fileHelpers';

const DownloadQrCode = async (profileId: string, qrCode: string) => {
  let file;
  try {
    const filePath =
      Paths.cache.uri + sanitizeFilePath(`QrCode-${profileId}`) + '.svg';
    file = new File(filePath);
    file.create();
    // generate file
    file.write(qrCode);
    // share the file
    await ShareCommand.open({
      url: filePath,
      type: 'image/svg+xml',
      failOnCancel: false,
      saveToFiles: true,
    });
    // clean up file afterward
    file.delete();
  } catch (e) {
    Sentry.captureException(e);
    file?.delete();
  }
};

export default DownloadQrCode;
