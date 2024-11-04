'use server';
import { revalidatePath } from 'next/cache';
import {
  getCoverTemplateTagById,
  saveLocalizationMessage,
  transaction,
  updateCoverTemplateTag,
  createCoverTemplateTag,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { TEMPLATE_COVERTAG_DESCRIPTION_PREFIX } from '@azzapp/shared/translationsContants';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { coverTemplateTagsSchema } from './coverTemplateTagsSchema';

export const saveCoverTemplateTag = async (data: {
  id?: string;
  order: number;
  label: string;
  description?: string;
  enabled: boolean;
}): Promise<{
  success: boolean;
  formErrors?: any;
  message?: string;
  coverTemplateTagId?: string;
}> => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const validationResult = coverTemplateTagsSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      formErrors: validationResult.error.formErrors,
    } as const;
  }
  let coverTemplateTagId: string;

  try {
    coverTemplateTagId = await transaction(async () => {
      const { id, label, description, ...coverTemplateTagData } = data;

      let coverTemplateTagId: string;
      if (id) {
        const oldCoverTemplateTag = await getCoverTemplateTagById(id);
        if (!oldCoverTemplateTag) {
          throw new Error('cover template tag not found');
        }

        coverTemplateTagId = id;
        await updateCoverTemplateTag(coverTemplateTagId, coverTemplateTagData);
      } else {
        coverTemplateTagId = await createCoverTemplateTag(coverTemplateTagData);
      }

      await saveLocalizationMessage({
        key: coverTemplateTagId,
        value: label,
        locale: DEFAULT_LOCALE,
      });

      await saveLocalizationMessage({
        key: TEMPLATE_COVERTAG_DESCRIPTION_PREFIX + coverTemplateTagId,
        value: description || '',
        locale: DEFAULT_LOCALE,
      });
      return coverTemplateTagId;
    });
    revalidatePath(`/coverTemplateFilters/[id]`, 'layout');
    return { success: true, coverTemplateTagId } as const;
  } catch (e: any) {
    return {
      success: false,
      message: e.message || 'Error while saving Company Activities Type',
    };
  }
};
