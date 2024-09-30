'use server';

import { parseWithZod } from '@conform-to/zod';

import { revalidatePath } from 'next/cache';
import {
  createCoverTemplate,
  createCoverTemplatePreview,
  removeCoverTemplatePreviewById,
  updateCoverTemplatePreview,
  getCoverTemplatePreview,
  updateCoverTemplate,
  checkMedias,
  referencesMedias,
  transaction,
  getCoverTemplateById,
} from '@azzapp/data';

import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { coverTemplateSchemaWithoutfile } from './coverTemplateSchema';
import type { SubmissionResult } from '@conform-to/react';

export const saveCoverTemplate = async (
  prevState: unknown,
  formData: FormData,
): Promise<SubmissionResult<string[]> & { coverTemplateId?: string }> => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }

  const submission = parseWithZod(formData, {
    schema: coverTemplateSchemaWithoutfile,
  });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  try {
    await checkMedias([submission.value.previewId]);

    const result = await transaction(async () => {
      const data = {
        ...submission.value,
        enabled: submission.value.enabled === 'true',
      };
      const previousPreviewIds: string[] = [];

      let coverTemplateId = data.id;
      if (coverTemplateId) {
        const coverTemplate = await getCoverTemplateById(coverTemplateId);
        if (coverTemplate) {
          previousPreviewIds.push(coverTemplate.previewId);
        }
        await updateCoverTemplate(coverTemplateId, data);
      } else {
        coverTemplateId = await createCoverTemplate(data);
      }

      await referencesMedias([data.previewId], previousPreviewIds);

      return {
        ...submission.reply(),
        coverTemplateId,
      };
    });

    return result;
  } catch (e) {
    console.log(e);
    return { status: 'error' };
  }
};

export const uploadPreview = async (prevState: unknown, formData: FormData) => {
  try {
    const coverTemplateId = formData.get('coverTemplateId') as string;
    const companyActivityId = formData.get('activityId') as string;
    const previewId = formData.get('previewId') as string;

    if (!previewId) {
      throw new Error('MISSING_PREVIEW_ID');
    }
    await checkMedias([previewId]);

    await transaction(async () => {
      const coverTemplatePreview = await getCoverTemplatePreview(
        coverTemplateId,
        companyActivityId,
      );

      if (coverTemplatePreview) {
        await updateCoverTemplatePreview(coverTemplateId, companyActivityId, {
          mediaId: previewId,
        });
      } else {
        await createCoverTemplatePreview({
          coverTemplateId,
          companyActivityId,
          mediaId: previewId,
        });
      }

      await referencesMedias([previewId], [coverTemplatePreview?.mediaId]);

      revalidatePath(`/coverTemplates/[id]`, 'layout');
    });

    return { status: 'success' };
  } catch (e) {
    console.log(e);
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
