'use server';

import { parseWithZod } from '@conform-to/zod';

import { revalidatePath } from 'next/cache';
import {
  createCoverTemplate,
  createCoverTemplatePreview,
  removeCoverTemplatePreviewById,
  updateCoverTemplatePreview,
  getCoverTemplatePreview,
} from '@azzapp/data';
import { updateCoverTemplate } from '@azzapp/data/coverTemplates';
import { createId } from '@azzapp/data/helpers/createId';
import { createPresignedUpload } from '@azzapp/shared/cloudinaryHelpers';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { ADMIN } from '#roles';
import getCurrentUser from '#helpers/getCurrentUser';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { coverTemplateSchemaWithoutfile } from './coverTemplateSchema';
import type { SubmissionResult } from '@conform-to/react';

export const uploadMedia = async (
  media: File,
  kind: 'image' | 'raw' | 'video',
) => {
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
    throw 'Error in media upload';
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
    const previewField = formData.get('preview') as File;
    if (previewField?.size > 0) {
      const { public_id } = await uploadMedia(previewField, 'video');
      formData.set(`previewId`, public_id);
    }
    formData.delete('preview');

    const lottieField = formData.get('lottie') as File;
    if (lottieField?.size > 0) {
      const { public_id } = await uploadMedia(lottieField, 'raw');
      formData.set(`lottieId`, public_id);
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
          formData.set(`${fieldName}.media.id`, public_id);
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

    let coverTemplateId = data.id;
    if (coverTemplateId) {
      await updateCoverTemplate(coverTemplateId, data);
    } else {
      coverTemplateId = await createCoverTemplate(data);
    }

    return {
      ...submission.reply(),
      coverTemplateId,
    };
  } catch (e) {
    console.log(e);
    return { status: 'error' };
  }
};

export const uploadPreview = async (prevState: unknown, formData: FormData) => {
  const coverTemplateId = formData.get('coverTemplateId') as string;
  const companyActivityId = formData.get('activityId') as string;

  let media;
  const fileField = formData.get('file') as File;
  if (fileField?.size > 0) {
    const { public_id } = await uploadMedia(fileField, 'video');

    media = public_id;
  }

  try {
    const coverTemplatePreview = await getCoverTemplatePreview(
      coverTemplateId,
      companyActivityId,
    );
    if (coverTemplatePreview) {
      await updateCoverTemplatePreview(coverTemplateId, companyActivityId, {
        coverTemplateId,
        companyActivityId,
        mediaId: media,
      });
    } else {
      await createCoverTemplatePreview({
        coverTemplateId,
        companyActivityId,
        mediaId: media,
      });
    }
    revalidatePath(`/coverTemplates/[id]`, 'layout');

    return { status: 'success' };
  } catch (e) {
    return { status: 'error' };
  }
};

export const deletePreview = async (
  coverTemplateId: string,
  companyActivityId: string,
) => {
  try {
    await removeCoverTemplatePreviewById(coverTemplateId, companyActivityId);
    revalidatePath(`/coverTemplates/[id]`, 'layout');
  } catch (e) {
    console.error(e);
    throw e;
  }
};
