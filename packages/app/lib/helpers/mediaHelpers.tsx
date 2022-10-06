import { Image, NativeModules } from 'react-native';
const { AZPMediaHelper } = NativeModules;

export const getFileName = (path: string) => {
  const arr = path.split('/');
  return arr[arr.length - 1];
};

export const getImageSize = (uri: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      error => reject(error),
    );
  });

export const getVideoSize: (
  uri: string,
) => Promise<{ width: number; height: number }> = AZPMediaHelper.getVideoSize;

export const getPHAssetPath: (uri: string) => Promise<string | null> =
  AZPMediaHelper.getPHAssetPath;

export const getFilePathFromURI = (uri: string) =>
  uri.replace(/^file:\/\//g, '');
