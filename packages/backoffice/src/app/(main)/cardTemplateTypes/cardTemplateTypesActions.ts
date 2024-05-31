'use server';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { CardTemplateTypeTable, createLabel, db } from '@azzapp/data';
import { saveLabelKey } from '#helpers/lokaliseHelpers';
import { cardTemplateTypeSchema } from './cardTemplateTypeSchema';
import type {
  CardTemplateType,
  NewCardTemplateType,
  WebCardCategory,
} from '@azzapp/data';

export const saveCardTemplateType = async (
  data: { webCardCategory: WebCardCategory } & (
    | CardTemplateType
    | NewCardTemplateType
  ),
) => {
  const validation = cardTemplateTypeSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      formErrors: validation.error.formErrors,
    } as const;
  }
  let templateTypeId: string;
  try {
    //check if WebCard Template type exist

    if (data.id) {
      const id = data.id;
      await db.transaction(async trx => {
        await db
          .update(CardTemplateTypeTable)
          .set({
            labelKey: validation.data.labelKey,
            webCardCategoryId: data.webCardCategory.id,
            enabled: data.enabled,
          })
          .where(eq(CardTemplateTypeTable.id, id));

        await createLabel(
          {
            labelKey: validation.data.labelKey,
            baseLabelValue: validation.data.baseLabelValue,
            translations: {},
          },
          trx,
        );
        await saveLabelKey({
          labelKey: validation.data.labelKey,
          baseLabelValue: validation.data.baseLabelValue,
        });
      });

      templateTypeId = data.id;
    } else {
      templateTypeId = createId();
      await db.transaction(async trx => {
        await trx.insert(CardTemplateTypeTable).values({
          id: templateTypeId,
          labelKey: data.labelKey,
          webCardCategoryId: data.webCardCategory.id,
          enabled: data.enabled,
        });

        await createLabel(
          {
            labelKey: validation.data.labelKey,
            baseLabelValue: validation.data.baseLabelValue,
            translations: {},
          },
          trx,
        );
        await saveLabelKey({
          labelKey: validation.data.labelKey,
          baseLabelValue: validation.data.baseLabelValue,
        });
      });
    }
  } catch (error) {
    throw new Error('Error while saving Card Template Type');
  }

  revalidatePath(`/cardTemplateTypes/[id]`);
  return { success: true, id: templateTypeId } as const;
};
