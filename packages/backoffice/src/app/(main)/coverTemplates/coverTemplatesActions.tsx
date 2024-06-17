'use server';

import { parseWithZod } from '@conform-to/zod';

import { createCoverTemplate } from '@azzapp/data';
import { updateCoverTemplate } from '@azzapp/data/coverTemplates';
import { createId } from '@azzapp/data/helpers/createId';
import { createPresignedUpload } from '@azzapp/shared/cloudinaryHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { ADMIN } from '#roles';
import getCurrentUser from '#helpers/getCurrentUser';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { coverTemplateSchemaWithoutfile } from './coverTemplateSchema';
import type { SubmissionResult } from '@conform-to/react';

export const uploadMedia = async (media: File, kind: 'image' | 'raw') => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const userId = (await getCurrentUser())?.id;
  const mediaId = encodeMediaId(createId(), kind);

  const { uploadURL, uploadParameters } = await createPresignedUpload(
    mediaId,
    kind,
    null,
    null,
    false,
    `userId=${userId}|backoffice=true`,
  );

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
    throw 'Error in overlay image upload';
  }

  return result.json();
};

export const saveCoverTemplate = async (
  prevState: unknown,
  formData: FormData,
): Promise<SubmissionResult<string[]> & { coverTemplateId?: string }> => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }

  try {
    const lottieField = formData.get('lottie') as File;
    if (lottieField?.size > 0) {
      const { public_id } = await uploadMedia(lottieField, 'raw');
      formData.append(`lottieId`, public_id);
    }
    formData.delete('lottie');

    const overLayLayersFields = [];
    for (const key of formData.keys()) {
      if (key.includes('.image')) {
        overLayLayersFields.push(key.replace('.image', ''));
      }
    }

    await Promise.all(
      overLayLayersFields.map(async fieldName => {
        const imageField = formData.get(`${fieldName}.image`) as File;
        if (imageField?.size > 0) {
          const { public_id } = await uploadMedia(imageField, 'image');
          formData.append(`${fieldName}.media.id`, public_id);
        }
        formData.delete(`${fieldName}.image`);
      }),
    );

    const submission = parseWithZod(formData, {
      schema: coverTemplateSchemaWithoutfile,
    });

    if (submission.status !== 'success') {
      return submission.reply();
    }

    const data = {
      ...submission.value,
      enabled: submission.value.enabled === 'true',
    };

    if (data.id) {
      await updateCoverTemplate(data.id, data);
    } else {
      const coverTemplateId = await createCoverTemplate(data);
      return {
        ...submission.reply(),
        coverTemplateId,
      };
    }

    return submission.reply();
  } catch (e) {
    return { status: 'error' };
  }
};
