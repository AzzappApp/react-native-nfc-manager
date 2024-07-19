'use server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  db,
  getCoverTemplateTagById,
  CoverTemplateTagTable,
  saveLocalizationMessage,
} from '@azzapp/data';
import { createId } from '@azzapp/data/helpers/createId';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { coverTemplateTagsSchema } from './coverTemplateTagsSchema';

export const saveCoverTemplateTag = async (data: {
  id?: string;
  order: number;
  label: string;
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
    coverTemplateTagId = await db.transaction(async trx => {
      const { id, label, ...coverTemplateTagData } = data;

      let coverTemplateTagId: string;
      if (id) {
        const oldCoverTemplateTag = await getCoverTemplateTagById(id);
        if (!oldCoverTemplateTag) {
          throw new Error('cover template tag not found');
        }

        coverTemplateTagId = id;
        await trx
          .update(CoverTemplateTagTable)
          .set(coverTemplateTagData)
          .where(eq(CoverTemplateTagTable.id, id));
      } else {
        coverTemplateTagId = createId();
        await trx.insert(CoverTemplateTagTable).values({
          ...coverTemplateTagData,
          id: coverTemplateTagId,
        });
      }

      await saveLocalizationMessage(
        {
          key: coverTemplateTagId,
          value: label,
          locale: DEFAULT_LOCALE,
          target: ENTITY_TARGET,
        },
        trx,
      );

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
