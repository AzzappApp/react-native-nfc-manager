'use server';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  db,
  createLabel,
  getCoverTemplateTypeById,
  CoverTemplateTypeTable,
} from '@azzapp/data';
import { ADMIN } from '#roles';
import { saveLabelKey } from '#helpers/lokaliseHelpers';
import { currentUserHasRole } from '#helpers/roleHelpers';
import { coverTemplateTypesSchema } from './coverTemplateTypesSchema';
import type {
  Label,
  CoverTemplateType,
  NewCoverTemplateType,
} from '@azzapp/data';

export const saveCoverTemplateType = async (
  data: Label & (CoverTemplateType | NewCoverTemplateType),
) => {
  if (!(await currentUserHasRole(ADMIN))) {
    throw new Error('Unauthorized');
  }
  const validationResult = coverTemplateTypesSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      success: false,
      formErrors: validationResult.error.formErrors,
    } as const;
  }
  let coverTemplateTypeId: string;

  try {
    coverTemplateTypeId = await db.transaction(async trx => {
      const { id, baseLabelValue, ...webCardCategoryData } = data;

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

        await createLabel(
          {
            labelKey: data.labelKey,
            baseLabelValue: data.baseLabelValue,
            translations: {},
          },
          trx,
        );
      } else {
        coverTemplateTypeId = createId();
        await trx.insert(CoverTemplateTypeTable).values({
          ...webCardCategoryData,
          id: coverTemplateTypeId,
        });

        await createLabel(
          {
            labelKey: data.labelKey,
            baseLabelValue: data.baseLabelValue,
            translations: {},
          },
          trx,
        );
      }

      await saveLabelKey({
        labelKey: data.labelKey,
        baseLabelValue: data.baseLabelValue,
      });

      return coverTemplateTypeId;
    });
  } catch (e) {
    throw new Error('Error while saving cover template type');
  }

  revalidatePath(`/coverTemplateTypes/[id]`, 'layout');
  return { success: true, coverTemplateTypeId } as const;
};
