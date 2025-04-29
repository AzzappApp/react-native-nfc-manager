import { Paths, File } from 'expo-file-system/next';
import { Image as ImageCompressor } from 'react-native-compressor';
import * as mime from 'react-native-mime-types';
import { createRandomFileName, getFileName } from './fileHelpers';
import { uploadSign } from './MobileWebAPI';

export const prepareLogoForUpload = async (logoPath: string) => {
  let logo = logoPath;
  //brandfetch case
  if (logoPath.startsWith('http')) {
    logo = `${Paths.cache.uri}${createRandomFileName('png')}`;
    await File.downloadFileAsync(logoPath, new File(logo));
  }

  const fileName = getFileName(logo);
  const mimeType = mime.lookup(fileName);
  const compressedFileUri = await ImageCompressor.compress(logo, {
    output: mimeType === 'image/jpeg' ? 'jpg' : 'png',
  });
  const file: any = {
    name: fileName,
    uri: compressedFileUri,
    type: mimeType === 'image/jpeg' ? mimeType : 'image/png',
  };

  const { uploadURL, uploadParameters } = await uploadSign({
    kind: 'image',
    target: 'logo',
  });

  return {
    uploadURL,
    uploadParameters,
    file,
  };
};

export const prepareAvatarForUpload = async (avatarPath: string) => {
  const fileName = getFileName(avatarPath);
  const type = mime.lookup(fileName) || 'image/jpeg';

  const compressedFileUri = await ImageCompressor.compress(avatarPath, {
    output: type === 'image/jpeg' ? 'jpg' : 'png',
  });
  const file: any = {
    name: fileName,
    uri: compressedFileUri,
    type,
  };

  const { uploadURL, uploadParameters } = await uploadSign({
    kind: 'image',
    target: 'avatar',
  });

  return {
    uploadURL,
    uploadParameters,
    file,
  };
};

export const prepareBannerForUpload = async (bannerPath: string) => {
  const fileName = getFileName(bannerPath);
  const type = mime.lookup(fileName) || 'image/jpeg';
  const compressedFileUri = await ImageCompressor.compress(bannerPath, {
    output: type === 'image/jpeg' ? 'jpg' : 'png',
  });
  const file: any = {
    name: fileName,
    uri: compressedFileUri,
    type,
  };

  const { uploadURL, uploadParameters } = await uploadSign({
    kind: 'image',
    target: 'banner',
  });

  return {
    uploadURL,
    uploadParameters,
    file,
  };
};
