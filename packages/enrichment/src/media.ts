import { createMedia, createId } from '@azzapp/data';
import { encodeMediaId } from '@azzapp/service/mediaServices/imageHelpers';
import { createPresignedUpload } from '@azzapp/service/mediaServices/mediaServices';

export const uploadMedia = async (buffer: Blob): Promise<string> => {
  const mediaId = encodeMediaId(createId(), 'image');

  await createMedia({
    id: mediaId,
    kind: 'image',
    height: 0,
    width: 0,
  });

  const { uploadParameters, uploadURL } = await createPresignedUpload(
    mediaId,
    'image',
    null,
    null,
    `enrichment=true`,
  );

  const form = new FormData();
  for (const [key, value] of Object.entries(uploadParameters)) {
    if (value !== undefined && value !== null) {
      form.append(key, String(value));
    }
  }
  form.append('file', buffer);

  const uploadRes = await fetch(uploadURL, {
    method: 'POST',
    body: form,
  });

  const result = await uploadRes.json();

  return result.public_id;
};

export const uploadMediaFromUrl = async (url: string): Promise<string> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image from ${url}`);
  }
  const blob = await res.blob();
  return uploadMedia(blob);
};
