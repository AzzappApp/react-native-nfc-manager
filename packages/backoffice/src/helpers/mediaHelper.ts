import { presignMedia } from './cloudinaryHelpers';

export const uploadMedia = async (
  media: File,
  kind: 'image' | 'raw' | 'video',
) => {
  const { uploadURL, uploadParameters } = await presignMedia(kind);

  const formData = new FormData();
  formData.append('file', media);
  Object.keys(uploadParameters).forEach(key => {
    formData.append(key, uploadParameters[key]);
  });
  const result = await fetch(uploadURL, {
    method: 'POST',
    body: formData,
  });

  if (!result.ok) {
    throw 'Error in media upload';
  }

  return result.json();
};
