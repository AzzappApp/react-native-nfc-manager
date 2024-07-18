'use server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  db,
  getCoverTemplateTypeById,
  CoverTemplateTypeTable,
  saveLocalizationMessage,
} from '@azzapp/data';
import { createId } from '@azzapp/data/helpers/createId';
import { DEFAULT_LOCALE, ENTITY_TARGET } from '@azzapp/i18n';
import { ADMIN } from '#roles';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { coverTemplateTypesSchema } from './coverTemplateTypesSchema';
import type { CoverTemplateType, NewCoverTemplateType } from '@azzapp/data';

export const saveCoverTemplateType = async (
  data: { label: string } & (CoverTemplateType | NewCoverTemplateType),
): Promise<{
  success: boolean;
  formErrors?: any;
  message?: string;
  coverTemplateTypeId?: string;
}> => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const validationResult = coverTemplateTypesSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      formErrors: validationResult.error.formErrors,
    };
  }
  let coverTemplateTypeId: string;

  try {
    coverTemplateTypeId = await db.transaction(async trx => {
      const { id, label, ...webCardCategoryData } = data;

      let coverTemplateTypeId: string;
      if (id) {
        const oldCoverTemplateType = await getCoverTemplateTypeById(id);
        if (!oldCoverTemplateType) {
          throw new Error('cover template type not found');
        }

        coverTemplateTypeId = id;
        await trx
          .update(CoverTemplateTypeTable)
          .set({
            ...webCardCategoryData,
          })
          .where(eq(CoverTemplateTypeTable.id, id));
      } else {
        coverTemplateTypeId = createId();
        await trx.insert(CoverTemplateTypeTable).values({
          ...webCardCategoryData,
          id: coverTemplateTypeId,
        });
      }

      await saveLocalizationMessage(
        {
          key: coverTemplateTypeId,
          value: label,
          locale: DEFAULT_LOCALE,
          target: ENTITY_TARGET,
        },
        trx,
      );

      return coverTemplateTypeId;
    });

    revalidatePath(`/coverTemplateTypes/[id]`, 'layout');
    return { success: true, coverTemplateTypeId };
  } catch (e: any) {
    console.error(e);
    return {
      success: false,
      message: e.message || 'Something went wrong',
    };
  }
};
