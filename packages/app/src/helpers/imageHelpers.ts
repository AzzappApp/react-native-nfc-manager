import { Image as ImageCompressor } from 'react-native-compressor';
import * as mime from 'react-native-mime-types';
import { getFileName } from './fileHelpers';
import { uploadSign } from './MobileWebAPI';

export const prepareLogoForUpload = async (logoPath: string) => {
  const fileName = getFileName(logoPath);
  const mimeType = mime.lookup(fileName);
  const compressedFileUri = await ImageCompressor.compress(logoPath, {
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
  const compressedFileUri = await ImageCompressor.compress(avatarPath);
  const file: any = {
    name: fileName,
    uri: compressedFileUri,
    type: mime.lookup(fileName) || 'image/jpeg',
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
  const compressedFileUri = await ImageCompressor.compress(bannerPath);
  const file: any = {
    name: fileName,
    uri: compressedFileUri,
    type: mime.lookup(fileName) || 'image/jpeg',
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
