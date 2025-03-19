'use server';

import { parseWithZod } from '@conform-to/zod';

import {
  createCoverTemplate,
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

  const medias = JSON.parse(formData.get('medias') as string) as Array<{
    id: string;
    editable: boolean;
    index: number;
  }>;

  const submission = parseWithZod(formData, {
    schema: coverTemplateSchemaWithoutfile,
  });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  try {
    await checkMedias([
      submission.value.previewId,
      ...medias.map(media => media.id),
    ]);

    const result = await transaction(async () => {
      const data = {
        ...submission.value,
        medias,
        enabled: submission.value.enabled === 'true',
      };
      const previousPreviewIds: string[] = [];
      const previousMediaIds: string[] = [];

      let coverTemplateId = data.id;
      if (coverTemplateId) {
        const coverTemplate = await getCoverTemplateById(coverTemplateId);
        if (coverTemplate) {
          previousPreviewIds.push(coverTemplate.previewId);
          if (coverTemplate.medias) {
            previousMediaIds.push(
              ...coverTemplate.medias.map(media => media.id),
            );
          }
        }
        await updateCoverTemplate(coverTemplateId, data);
      } else {
        coverTemplateId = await createCoverTemplate(data);
      }

      await referencesMedias([data.previewId], previousPreviewIds);
      await referencesMedias(
        medias.map(media => media.id),
        previousMediaIds,
      );

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
