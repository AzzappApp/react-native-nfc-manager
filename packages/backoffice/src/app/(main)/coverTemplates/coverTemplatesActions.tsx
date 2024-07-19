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

  try {
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
  try {
    const coverTemplateId = formData.get('coverTemplateId') as string;
    const companyActivityId = formData.get('activityId') as string;
    const previewId = formData.get('previewId') as string;

    if (!previewId) {
      throw new Error('MISSING_PREVIEW_ID');
    }

    const coverTemplatePreview = await getCoverTemplatePreview(
      coverTemplateId,
      companyActivityId,
    );
    if (coverTemplatePreview) {
      await updateCoverTemplatePreview(coverTemplateId, companyActivityId, {
        coverTemplateId,
        companyActivityId,
        mediaId: previewId,
      });
    } else {
      await createCoverTemplatePreview({
        coverTemplateId,
        companyActivityId,
        mediaId: previewId,
      });
    }
    revalidatePath(`/coverTemplates/[id]`, 'layout');

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
