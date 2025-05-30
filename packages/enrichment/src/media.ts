import { createMedia, createId } from '@azzapp/data';
import { encodeMediaId } from '@azzapp/service/mediaServices/imageHelpers';
import { createPresignedUpload } from '@azzapp/service/mediaServices/mediaServices';

export const uploadMedia = async (
  buffer: Blob,
  givenMediaId?: string,
): Promise<string> => {
  const mediaId = givenMediaId ?? encodeMediaId(createId(), 'image');

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

export const uploadMediaFromUrl = (url: string) => {
  const mediaId = encodeMediaId(createId(), 'image');

  const promise = fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch image from ${url}`);
      }
      return res.blob();
    })
    .then(blob => uploadMedia(blob, mediaId))
    .catch(() => null);

  return {
    id: mediaId,
    promise,
  };
};
